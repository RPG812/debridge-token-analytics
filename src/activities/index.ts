import { log } from '../lib/logger.js'
import { collectTransfersActivity } from './collectTransfers.js'
import {enrichWithReceiptsActivity} from "./enrichWithReceipts.js"
import {computeMetricsActivity} from "./computeMetrics.js";

export async function collectTransfers(): Promise<void> {
    log('[Activity] collectTransfers() started')
    await collectTransfersActivity()
    log('[Activity] collectTransfers() finished')
}

export async function enrichWithReceipts(): Promise<void> {
    log('[Activity] enrichWithReceipts() started')
    await enrichWithReceiptsActivity()
    log('[Activity] enrichWithReceipts() finished')
}

export async function computeMetrics(): Promise<void> {
    log('[Activity] computeMetrics() started')
    await computeMetricsActivity()
    log('[Activity] computeMetrics() finished')
}

export async function exportJson(): Promise<void> {
    log('[Activity] exportJson() called')
}
