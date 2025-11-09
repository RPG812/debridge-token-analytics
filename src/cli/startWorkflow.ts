import { Connection, WorkflowClient } from '@temporalio/client'
import { config } from '../config/index.js'
import { log } from '../lib/logger.js'

async function startWorkflow() {
    log(`Starting workflow...`)

    const connection = await Connection.connect({
        address: config.temporal.address
    })

    log(`Connected to Temporal at ${config.temporal.address}`)

    const client = new WorkflowClient({ connection })
    const workflowId = `analytics-${config.token.symbol.toLowerCase()}`

    const handle = await client.start('analyticsWorkflow', {
        taskQueue: config.temporal.taskQueue,
        workflowId,
        workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY'
    })

    log(`Workflow started: ${handle.workflowId}`)
}

startWorkflow().catch(err => {
    console.error('Failed to start workflow', err)
    process.exit(1)
})
