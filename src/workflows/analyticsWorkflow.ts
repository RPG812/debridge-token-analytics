import { proxyActivities } from '@temporalio/workflow'
import type * as activities from '../activities/index.js'

// TODO
const { collectTransfers, enrichWithReceipts, computeMetrics, exportJson } =
    proxyActivities<typeof activities>({
        scheduleToCloseTimeout: '2 hours',
        retry: { initialInterval: '2s', backoffCoefficient: 2.0, maximumAttempts: 5 }
    })

export async function analyticsWorkflow(): Promise<void> {
    await collectTransfers()
    await enrichWithReceipts()
    await computeMetrics()
    await exportJson()
}
