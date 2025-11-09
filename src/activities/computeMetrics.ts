import { log, logError } from '../lib/logger.js'
import { truncateDailyMetrics, computeAndInsertMetrics } from '../db/metrics.js'

export async function computeMetricsActivity(): Promise<void> {
    log('[computeMetrics] Starting activity')

    try {
        await truncateDailyMetrics()
        await computeAndInsertMetrics()

        log('[computeMetrics] Metrics computed successfully')
    } catch (error) {
        logError('[computeMetrics] Activity failed', error)
        throw error
    }
}
