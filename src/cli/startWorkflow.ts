import { Connection, WorkflowClient } from '@temporalio/client'
import { config } from '../config/index.js'
import { log } from '../lib/logger.js'
import readline from 'node:readline/promises'

async function startWorkflow() {
    log(`Starting workflow...`)

    const connection = await Connection.connect({ address: config.temporal.address })
    const client = new WorkflowClient({ connection })

    const workflowId = `analytics-${config.token.symbol.toLowerCase()}`
    const taskQueue = config.temporal.taskQueue

    if (await isWorkflowRunning(client, workflowId)) {
        log(`Workflow ${workflowId} is already running.`)

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        const answer = await rl.question('Do you want to terminate and restart it? (y/N): ')

        rl.close()

        if (answer.trim().toLowerCase() === 'y') {
            log(`Terminating existing workflow ${workflowId}...`)

            try {
                await client.getHandle(workflowId).terminate('Restart requested')
            } catch {
                log('No active workflow to terminate (possibly completed)')
            }
        } else {
            log('Skipping restart.')
            process.exit(0)
        }
    }

    const handle = await client.start('analyticsWorkflow', {
        workflowId,
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        taskQueue
    })

    log(`Workflow started: ${handle.workflowId}`)
}

async function isWorkflowRunning(client: WorkflowClient, workflowId: string): Promise<boolean> {
    const handle = client.getHandle(workflowId)

    try {
        const desc = await handle.describe()

        return desc.status.name === 'RUNNING'
    } catch (error: any) {
        if (['WorkflowNotFoundError', 'NotFoundError'].includes(error.name)) {
            return false
        }

        throw error
    }
}

startWorkflow().catch(error => {
    console.error('Failed to start workflow:', error)
    process.exit(1)
})
