import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { config } from '../config/index.js'
import { log, logError } from '../lib/logger.js'
import { selectSummary, selectDailyMetrics } from '../db/metrics.js'

/**
 * Build final analytics JSON payload and write it to ./output/analytics.json
 * Uses aggregated data from ClickHouse and follows the required schema.
 */
export async function exportJsonActivity(): Promise<void> {
    log('[exportJson] Starting activity')

    try {
        const [summary, dailyMetrics] = await Promise.all([
            selectSummary(),
            selectDailyMetrics()
        ])

        const analytics = {
            address: config.address,
            network: 'ethereum-mainnet',
            token: config.token.symbol,
            summary: {
                events_collected: Number(summary.eventsCollected),
                blocks_scanned: [summary.startBlock, summary.endBlock],
                period_utc: [summary.periodStartUtc, summary.periodEndUtc]
            },
            daily_gas_cost: dailyMetrics.map(m => ({
                date: m.date,
                gas_cost_wei: m.gasCostWei,
                gas_cost_eth: m.gasCostEth
            })),
            ma7_effective_gas_price: dailyMetrics.map(m => ({
                date: m.date,
                ma7_wei: m.ma7Wei,
                ma7_gwei: m.ma7Gwei
            })),
            cumulative_gas_cost_eth: dailyMetrics.map(m => ({
                date: m.date,
                cum_eth: m.cumulativeGasCostEth
            }))
        }

        const outDir = path.resolve('./output')
        await mkdir(outDir, { recursive: true })

        const outPath = path.join(outDir, 'analytics.json')
        await writeFile(outPath, JSON.stringify(analytics, null, 2), 'utf8')

        log(`[exportJson] Written to ${outPath}`)
    } catch (error) {
        logError('[exportJson] Activity failed', error)
        throw error
    }
}
