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

/** Insert aggregated metrics into daily_metrics */
export async function insertDailyMetrics(rows: DailyMetricRow[]): Promise<void> {
    if (rows.length === 0) return

    const values = rows.map(r => ({
        date: r.date,
        gas_cost_wei: r.gasCostWei,
        gas_cost_eth: r.gasCostEth,
        ma7_wei: r.ma7Wei,
        ma7_gwei: r.ma7Gwei,
        cumulative_gas_cost_eth: r.cumulativeGasCostEth
    }))

    try {
        await clickhouse.insert({
            table: 'daily_metrics',
            values,
            format: 'JSONEachRow'
        })

        log(`Inserted ${values.length} daily_metrics rows`)
    } catch (error) {
        logError('Failed to insert daily_metrics batch', error)
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
