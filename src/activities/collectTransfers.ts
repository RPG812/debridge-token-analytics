import { config } from '../config/index.js'
import { getProgress, insertEvents, type TransferEvent } from '../db/events.js'
import { getTransferLogs, getLatestBlock } from '../lib/viemClient.js'
import { log, logError, logMetric } from '../lib/logger.js'
import { sleep } from '../lib/sleep.js'
import { Context } from '@temporalio/activity'
import pLimit, { Limit } from 'p-limit'
import {RateLimitError} from "../lib/error.js";

/** Temporal activity entry point */
export async function collectTransfersActivity(): Promise<void> {
    log('[collectTransfers] Starting activity')

    try {
        const progress = await getProgress()

        if (Number(progress.count)){
            log(`[collectTransfers] Already collected: ${progress.count} events`)
        }

        const target = config.targetEvents
        const already = progress.count
        const remaining = target - already

        if (remaining <= 0) {
            log('[collectTransfers] Already have enough events')
            return
        }

        const latest = progress.minBlock ? null : await getLatestBlock()
        const startFrom = progress.minBlock
            ? BigInt(progress.minBlock) - 1n
            : latest!.number

        const collector = new TransferCollector({
            startFrom,
            remaining,
            address: config.address,
            blockStep: BigInt(config.blockStep),
            concurrency: config.rpcConcurrency
        })

        await collector.run()

        log('[collectTransfers] Completed successfully')
    } catch (error) {
        logError('[collectTransfers] Activity failed', error)
        throw error
    }
}

interface CollectorParams {
    startFrom: bigint
    remaining: number
    address: string
    blockStep: bigint
    concurrency: number
}

/** Stateful collector encapsulating cursor, batching, and persistence */
class TransferCollector {
    private cursor: bigint
    private collected = 0
    private scannedFrom: bigint
    private scannedTo: bigint
    private readonly limiter: Limit
    maxBlockStep: bigint

    constructor(private readonly params: CollectorParams) {
        this.cursor = params.startFrom
        this.scannedFrom = params.startFrom
        this.scannedTo = params.startFrom
        this.maxBlockStep = params.blockStep * 2n
        this.limiter = pLimit(params.concurrency)
    }

    async run(): Promise<void> {
        const ctx = Context.current()
        const minBlockStep = 1n

        while (this.collected < this.params.remaining && this.cursor > 0n) {
            const batch = this.buildBatch(this.cursor)

            if (!batch.length) break

            let events: TransferEvent[] = []

            try {
                events = await this.collectBatch(batch)
            } catch (error: any) {
                if (error instanceof RateLimitError || error?.isRateLimit) {
                    // Decrease block step adaptively, but not below minBlockStep
                    this.params.blockStep = this.params.blockStep / 2n > minBlockStep
                        ? this.params.blockStep / 2n
                        : minBlockStep

                    log(`[collectTransfers] Rate limited, blockStep decrease to ${this.params.blockStep}`)
                    await sleep(1000)
                    continue
                }

                throw error
            }

            if (events.length) {
                await this.saveBatch(events)
                this.collected += events.length
                logMetric('events_inserted', events.length)

                // Increase block step if too few events and we're below the max threshold
                if (events.length < 10 && this.params.blockStep < this.maxBlockStep) {
                    const nextStep = (this.params.blockStep * 3n) / 2n

                    this.params.blockStep = nextStep <= this.maxBlockStep ? nextStep : this.maxBlockStep
                    log(`[collectTransfers] Low event density, increase blockStep to ${this.params.blockStep}`)
                }
            }

            ctx.heartbeat()

            this.scannedFrom = batch[batch.length - 1].fromBlock
            this.scannedTo = batch[0].toBlock
            this.cursor = batch[batch.length - 1].fromBlock - 1n

            logMetric('total', this.collected)

            if (this.collected >= this.params.remaining) break

            await sleep(300)
        }

        log(`[collectTransfers] Done. Collected=${this.collected}, scanned [${this.scannedFrom}..${this.scannedTo}]`)
    }

    /** Build up to N block ranges from the current cursor */
    private buildBatch(cursor: bigint): Array<{ fromBlock: bigint; toBlock: bigint }> {
        const ranges: Array<{ fromBlock: bigint; toBlock: bigint }> = []
        let currentCursor = cursor

        for (let i = 0; i < this.params.concurrency; i++) {
            if (currentCursor < 0n) break

            const toBlock = currentCursor
            const fromBlock =
                currentCursor >= this.params.blockStep
                    ? currentCursor - this.params.blockStep + 1n
                    : 0n

            ranges.push({ fromBlock, toBlock })
            currentCursor = fromBlock - 1n

            if (currentCursor < 0n) break
        }

        return ranges
    }

    /** Fetch and decode all events in a batch of ranges */
    private async collectBatch(
        ranges: Array<{ fromBlock: bigint; toBlock: bigint }>
    ): Promise<TransferEvent[]> {
        const abortController = new AbortController()
        let rateLimitTriggered = false

        const tasks = ranges.map(range =>
            this.limiter(async () => {
                if (abortController.signal.aborted) return []

                try {
                    const logs = await getTransferLogs(range, abortController.signal)

                    return mapLogsToEvents(logs, this.params.address)
                } catch (error: any) {
                    if (error instanceof RateLimitError) {
                        rateLimitTriggered = true
                        abortController.abort()

                        throw error
                    }

                    if (abortController.signal.aborted) {
                        return []
                    }

                    throw error
                }
            })
        )

        try {
            const results = await Promise.all(tasks)

            return results.flat()
        } catch (error: any) {
            if (error instanceof RateLimitError || rateLimitTriggered) {
                throw new RateLimitError()
            }

            throw error
        }
    }

    private async saveBatch(events: TransferEvent[]) {
        if (!events.length) return

        await insertEvents(events)
    }
}

function mapLogsToEvents(logs: any[], target: string): TransferEvent[] {
    const targetAddr = target.toLowerCase()
    const events: TransferEvent[] = []

    for (const log of logs) {
        const { args, transactionHash, blockNumber, logIndex } = log

        if (!args || !transactionHash) continue

        const from = args.from?.toLowerCase?.()
        const to = args.to?.toLowerCase?.()

        if (from !== targetAddr && to !== targetAddr) continue

        events.push({
            txHash: transactionHash.toLowerCase(),
            logIndex: Number(logIndex),
            blockNumber: Number(blockNumber),
            fromAddress: from,
            toAddress: to,
            value: args.value,
            blockTime: null
        })
    }

    return events
}
