import { clickhouse } from '../lib/clickhouse.js'
import { log, logError } from '../lib/logger.js'

export type TxMeta = {
    txHash: string
    blockNumber: number
    blockTime: Date
    gasUsed: bigint
    effectiveGasPrice: bigint
}

type MissingTxRow = {
    tx_hash: string
}

export async function insertMeta(batch: TxMeta[]): Promise<void> {
    if (batch.length === 0) return

    const rows = batch.map(m => ({
        tx_hash: m.txHash,
        block_number: m.blockNumber,
        block_time: m.blockTime.toISOString().slice(0, 19).replace('T', ' '),
        gas_used: Number(m.gasUsed),
        effective_gas_price: m.effectiveGasPrice.toString()
    }))

    try {
        await clickhouse.insert({
            table: 'tx_meta',
            values: rows,
            format: 'JSONEachRow'
        })
    } catch (error) {
        logError('Failed to insert tx_meta batch', error)
        throw error
    }
}

export async function getMissingTxHashes(limit = 100): Promise<string[]> {
    const query = `
        SELECT DISTINCT e.tx_hash
        FROM raw_events AS e
        LEFT JOIN tx_meta AS m ON e.tx_hash = m.tx_hash
        WHERE m.tx_hash IS NULL OR m.tx_hash = ''
        LIMIT ${limit}
    `

    try {
        const res = await clickhouse.query({ query, format: 'JSONEachRow' })
        const rows = (await res.json()) as MissingTxRow[]

        if (rows.length === 0) return []

        return rows.map(({ tx_hash }) => tx_hash)
    } catch (error) {
        logError('Failed to select missing tx hashes', error)
        throw error
    }
}

