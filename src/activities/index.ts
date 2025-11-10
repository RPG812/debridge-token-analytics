import { collectTransfersActivity } from './collectTransfers.js'
import {enrichWithReceiptsActivity} from "./enrichWithReceipts.js"
import {computeMetricsActivity} from "./computeMetrics.js";
import {exportJsonActivity} from "./exportJson.js";

export async function collectTransfers(): Promise<void> {
    await collectTransfersActivity()
}

export async function enrichWithReceipts(): Promise<void> {
    await enrichWithReceiptsActivity()
}

export async function computeMetrics(): Promise<void> {
    await computeMetricsActivity()
}

export async function exportJson(): Promise<void> {
    await exportJsonActivity()
}
