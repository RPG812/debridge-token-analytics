import { Connection, WorkflowClient } from '@temporalio/client'
import { analyticsWorkflow } from '../workflows/analyticsWorkflow.js'
import { config } from '../config/index.js'
import { log } from '../lib/logger.js'

async function startWorkflow() {
    const connection = await Connection.connect({
        address: config.temporal.address
    })

    const client = new WorkflowClient({ connection })
    const workflowId = `analytics-${config.token.symbol.toLowerCase()}-run-1`

    const handle = await client.start(analyticsWorkflow, {
        taskQueue: config.temporal.taskQueue,
        workflowId
    })

    log(`Workflow started: ${handle.workflowId}`)
}

startWorkflow().catch(err => {
    console.error('Failed to start workflow', err)
    process.exit(1)
})
