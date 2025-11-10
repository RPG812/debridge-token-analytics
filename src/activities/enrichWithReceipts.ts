import { Context } from '@temporalio/activity'
import pLimit, { Limit } from 'p-limit'
import { config } from '../config/index.js'
import { getMissingTxHashes, insertMeta, type TxMeta } from '../db/txMeta.js'
import { getTxReceipt, getBlockByNumber } from '../lib/viemClient.js'
import { log, logError, logMetric } from '../lib/logger.js'
import { sleep } from '../lib/sleep.js'

export async function enrichWithReceiptsActivity(): Promise<void> {
    log('[enrichWithReceipts] Starting activity')

    try {
        const collector = new EnrichmentCollector({
            batchSize: config.batchSize,
            concurrency: config.rpcConcurrency
        })

        await collector.run()

        log('[enrichWithReceipts] Completed successfully')
    } catch (err) {
        logError('[enrichWithReceipts] Activity failed', err)
        throw err
    }
}

interface EnrichmentParams {
    batchSize: number
    concurrency: number
}

class EnrichmentCollector {
    private readonly limiter: Limit
    private processed = 0
    private readonly blockCache = new Map<bigint, Date>()

    constructor(private readonly params: EnrichmentParams) {
        this.limiter = pLimit(params.concurrency)
    }

    async run(): Promise<void> {
        const ctx = Context.current()

        while (true) {
            const hashes = await getMissingTxHashes(this.params.batchSize)

            if (!hashes.length) {
                log('[enrichWithReceipts] No missing transactions, done')
                break
            }

            const results = await Promise.allSettled(
                hashes.map(hash => this.limiter(() => this.enrichOne(hash)))
            )

            const successful = results
                .filter(result => result.status === 'fulfilled')
                .map(result => (result as PromiseFulfilledResult<TxMeta>).value)

            if (successful.length) {
                await insertMeta(successful)
                this.processed += successful.length
                logMetric('tx_meta_inserted', successful.length)
            }

            ctx.heartbeat()
            await sleep(300)
        }

        log(`[enrichWithReceipts] Done. Total processed=${this.processed}`)
    }

    private async enrichOne(hash: string): Promise<TxMeta> {
        try {
            const receipt = await getTxReceipt(hash as `0x${string}`)
            const blockNumber = receipt.blockNumber
            let blockTime = this.blockCache.get(blockNumber)

            if (!blockTime) {
                const block = await getBlockByNumber(blockNumber)

                blockTime = new Date(Number(block.timestamp) * 1000)
                this.blockCache.set(blockNumber, blockTime)
            }

            return {
                txHash: hash,
                blockNumber: Number(blockNumber),
                blockTime,
                gasUsed: receipt.gasUsed,
                effectiveGasPrice: receipt.effectiveGasPrice
            }
        } catch (error) {
            logError(`[enrichWithReceipts] Failed to enrich tx ${hash}`, error)
            throw error
        }
    }
}
