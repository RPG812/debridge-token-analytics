import { clickhouse } from '../lib/clickhouse.js'
import { logError } from '../lib/logger.js'

export type TransferEvent = {
    txHash: string
    logIndex: number
    blockNumber: number
    fromAddress: string
    toAddress: string
    value: bigint
    blockTime?: Date | null
}

export type EventsProgress = {
    minBlock: number | null
    maxBlock: number | null
    count: number
}

type ProgressRow = {
    min_block: number | null
    max_block: number | null
    cnt: number
}

export async function insertEvents(events: TransferEvent[]): Promise<void> {
    if (events.length === 0) return

    const rows = events.map(e => ({
        tx_hash: e.txHash,
        log_index: e.logIndex,
        block_number: e.blockNumber,
        from_address: e.fromAddress,
        to_address: e.toAddress,
        value: e.value.toString(),
        ...(e.blockTime ? { block_time: e.blockTime } : {})
    }))

    try {
        await clickhouse.insert({
            table: 'raw_events',
            values: rows,
            format: 'JSONEachRow'
        })
    } catch (error) {
        throw error
    }
}

export async function getProgress(): Promise<EventsProgress> {
    const query = `
        SELECT
            min(block_number) AS min_block,
            max(block_number) AS max_block,
            count()           AS cnt
        FROM raw_events
    `

    try {
        const res = await clickhouse.query({ query, format: 'JSONEachRow' })
        const rows = (await res.json()) as ProgressRow[]


        if (rows.length === 0) {
            return { minBlock: null, maxBlock: null, count: 0 }
        }

        const row = rows[0]

        return {
            minBlock: row.min_block,
            maxBlock: row.max_block,
            count: row.cnt
        }
    } catch (error) {
        logError('Failed to read events progress', error)
        throw error
    }
}
