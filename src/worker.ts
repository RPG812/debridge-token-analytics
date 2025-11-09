import { Worker } from '@temporalio/worker'
import * as activities from './activities/index.js'
import { config } from './config/index.js'
import { log } from './lib/logger.js'

async function runWorker() {
    const worker = await Worker.create({
        workflowsPath: new URL('./workflows/analyticsWorkflow.ts', import.meta.url).pathname,
        activities,
        taskQueue: config.temporal.taskQueue
    })

    log(`Temporal Worker started on task queue "${config.temporal.taskQueue}"`)

    await worker.run()
}

runWorker().catch(err => {
    console.error('Worker failed', err)
    process.exit(1)
})
