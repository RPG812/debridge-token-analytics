import { log } from '../lib/logger.js'
import { collectTransfersActivity } from './collectTransfers.js'

export async function collectTransfers(): Promise<void> {
    log('[Activity] collectTransfers() started')
    await collectTransfersActivity()
    log('[Activity] collectTransfers() finished')
}

export async function enrichWithReceipts(): Promise<void> {
    log('[Activity] enrichWithReceipts() called')
}

export async function computeMetrics(): Promise<void> {
    log('[Activity] computeMetrics() called')
}

export async function exportJson(): Promise<void> {
    log('[Activity] exportJson() called')
}
