import { proxyActivities } from '@temporalio/workflow'
import type * as activities from '../activities/index.js'

const temporalDefaults = {
    scheduleToCloseTimeout: '2 hours',
    retry: {
        initialInterval: '2s',
        backoffCoefficient: 2.0,
        maximumAttempts: 5,
    },
}

const { collectTransfers, enrichWithReceipts, computeMetrics, exportJson } =
    proxyActivities<typeof activities>(temporalDefaults)

export async function analyticsWorkflow(): Promise<void> {
    await collectTransfers()
    await enrichWithReceipts()
    await computeMetrics()
    await exportJson()
}
