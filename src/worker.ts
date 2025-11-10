import { Worker, NativeConnection } from '@temporalio/worker'
import * as activities from './activities/index.js'
import { config } from './config/index.js'
import { log } from './lib/logger.js'

async function runWorker() {
    log(`Connecting to Temporal at ${config.temporal.address} ...`)

    const connection = await NativeConnection.connect({
        address: config.temporal.address,
    })

    const worker = await Worker.create({
        connection,
        workflowsPath: new URL('./workflows/analyticsWorkflow.ts', import.meta.url).pathname,
        activities,
        taskQueue: config.temporal.taskQueue,
    })

    log(`✅ Temporal Worker started on task queue "${config.temporal.taskQueue}"`)

    const shutdown = async () => {
        log('[worker] Caught termination signal. Shutting down gracefully...')
        worker.shutdown()
        process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    await worker.run()
}

runWorker().catch((err) => {
    console.error('Worker failed', err)
    process.exit(1)
})
