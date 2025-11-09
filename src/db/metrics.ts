import { clickhouse } from '../lib/clickhouse.js'
import { log, logError } from '../lib/logger.js'

export type DailyMetricRow = {
    date: string // YYYY-MM-DD
    gasCostWei: string
    gasCostEth: number
    ma7Wei: string
    ma7Gwei: number
    cumulativeGasCostEth: number
}

export type PipelineSummary = {
    eventsCollected: number
    startBlock: number | null
    endBlock: number | null
    periodStartUtc: string | null
    periodEndUtc: string | null
}

type EventsSummaryRow = {
    events_collected: number
    start_block: number | null
    end_block: number | null
}

type PeriodSummaryRow = {
    start_date: string | null
    end_date: string | null
}

/** Truncate daily_metrics before recompute */
export async function truncateDailyMetrics(): Promise<void> {
    try {
        await clickhouse.command({ query: 'TRUNCATE TABLE daily_metrics' })
        log('Truncated daily_metrics')
    } catch (error) {
        logError('Failed to truncate daily_metrics', error)
        throw error
    }
}

/**
 * Aggregates per-day gas metrics and inserts them into ClickHouse.
 * - Calculates total gas cost per UTC day (wei / ETH)
 * - Computes 7-day moving average of effectiveGasPrice (MA7)
 * - Computes cumulative gas cost over time
 * Uses ClickHouse window functions for MA7 and cumulative sum.
 */
export async function computeAndInsertMetrics(): Promise<void> {
    // language=ClickHouse
    const query = `
        INSERT INTO daily_metrics (
            date,
            gas_cost_wei,
            gas_cost_eth,
            ma7_wei,
            ma7_gwei,
            cumulative_gas_cost_eth
        )
        SELECT
            date,
            gas_cost_wei,
            gas_cost_eth,
            toUInt256(avg(avg_gas_price_wei) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)) AS ma7_wei,
            (avg(avg_gas_price_wei) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)) / 1e9 AS ma7_gwei,
            sum(gas_cost_eth) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_gas_cost_eth
        FROM (
                 SELECT
                     toDate(m.block_time) AS date,
                     sum(toUInt256(m.gas_used) * m.effective_gas_price) AS gas_cost_wei,
                     sum((toUInt256(m.gas_used) * m.effective_gas_price) / 1e18) AS gas_cost_eth,
                     avg(m.effective_gas_price) AS avg_gas_price_wei
                 FROM raw_events AS e
                          INNER JOIN tx_meta AS m USING (tx_hash)
                 GROUP BY date
                 ) AS daily_base
        ORDER BY date
    `

    try {
        await clickhouse.command({ query })
        log('[computeMetrics] Inserted aggregated metrics into daily_metrics')
    } catch (error) {
        logError('[computeMetrics] Failed to compute and insert daily metrics', error)
        throw error
    }
}

/**
 * Selects daily metrics from ClickHouse for JSON export.
 * Returns rows with stringified bigint fields for JSON compatibility.
 */
export async function selectDailyMetrics(): Promise<DailyMetricRow[]> {
    // language=ClickHouse
    const query = `
        SELECT
            toString(date) AS date,
            toString(gas_cost_wei) AS gas_cost_wei,
            gas_cost_eth,
            toString(ma7_wei) AS ma7_wei,
            ma7_gwei,
            cumulative_gas_cost_eth
        FROM daily_metrics
        ORDER BY date
    `

    try {
        const res = await clickhouse.query({ query, format: 'JSONEachRow' })
        const rows = (await res.json()) as Array<{
            date: string
            gas_cost_wei: string
            gas_cost_eth: number
            ma7_wei: string
            ma7_gwei: number
            cumulative_gas_cost_eth: number
        }>

        return rows.map(r => ({
            date: r.date,
            gasCostWei: r.gas_cost_wei,
            gasCostEth: r.gas_cost_eth,
            ma7Wei: r.ma7_wei,
            ma7Gwei: r.ma7_gwei,
            cumulativeGasCostEth: r.cumulative_gas_cost_eth
        }))
    } catch (error) {
        logError('Failed to select daily_metrics', error)
        throw error
    }
}

/** Collect summary info for analytics.json */
export async function selectSummary(): Promise<PipelineSummary> {
    const eventsQuery = `
        SELECT
            count() AS events_collected,
            min(block_number) AS start_block,
            max(block_number) AS end_block
        FROM raw_events
    `

    // language=ClickHouse
    const periodQuery = `
        SELECT
            toString(toDate(min(block_time))) AS start_date,
            toString(toDate(max(block_time))) AS end_date
        FROM tx_meta
    `

    try {
        const [eventsRes, periodRes] = await Promise.all([
            clickhouse.query({ query: eventsQuery, format: 'JSONEachRow' }),
            clickhouse.query({ query: periodQuery, format: 'JSONEachRow' })
        ])

        const eventsRows = (await eventsRes.json()) as EventsSummaryRow[]
        const periodRows = (await periodRes.json()) as PeriodSummaryRow[]

        const events = eventsRows[0] ?? { events_collected: 0, start_block: null, end_block: null }
        const period = periodRows[0] ?? { start_date: null, end_date: null }

        return {
            eventsCollected: events.events_collected,
            startBlock: events.start_block,
            endBlock: events.end_block,
            periodStartUtc: period.start_date,
            periodEndUtc: period.end_date
        }
    } catch (error) {
        logError('Failed to select pipeline summary', error)
        throw error
    }
}
