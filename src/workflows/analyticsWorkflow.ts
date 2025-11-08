import { config } from '../config/index.js'
import { proxyActivities } from '@temporalio/workflow'
import type * as activities from '../activities/index.js'

const { collectTransfers, enrichWithReceipts, computeMetrics, exportJson } =
    proxyActivities<typeof activities>({
        scheduleToCloseTimeout: config.temporal.activityTimeout,
        retry: config.temporal.retry
    })

export async function analyticsWorkflow(): Promise<void> {
    await collectTransfers()
    await enrichWithReceipts()
    await computeMetrics()
    await exportJson()
}
