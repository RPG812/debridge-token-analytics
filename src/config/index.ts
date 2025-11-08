import dotenv from 'dotenv'
dotenv.config()

export const config = {
    rpcUrl: process.env.RPC_URL || '',
    address: process.env.ADDRESS || '',
    blockStep: Number(process.env.BLOCK_STEP || 5000),
    batchSize: Number(process.env.BATCH_SIZE || 100),
    rpcConcurrency: Number(process.env.RPC_CONCURRENCY || 5),

    token: {
        symbol: process.env.TOKEN_SYMBOL || 'USDC',
        decimals: Number(process.env.TOKEN_DECIMALS || 6),
        contract: process.env.CONTRACT || ''
    },

    clickhouse: (() => {
        const protocol = process.env.CLICKHOUSE_PROTOCOL || 'http'
        const host = process.env.CLICKHOUSE_HOST || 'localhost'
        const port = Number(process.env.CLICKHOUSE_PORT || 8123)
        const database = process.env.CLICKHOUSE_DB || 'analytics'
        const user = process.env.CLICKHOUSE_USER || 'default'
        const password = process.env.CLICKHOUSE_PASSWORD || ''

        return {
            protocol,
            host,
            port,
            database,
            user,
            password,
            url: `${protocol}://${host}:${port}`
        }
    })(),

    temporal: (() => {
        const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233'
        const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'token-analytics'
        const activityTimeout = process.env.ACTIVITY_TIMEOUT || '2 hours'

        const retry = {
            initialInterval: process.env.RETRY_INITIAL || '2s',
            backoffCoefficient: Number(process.env.RETRY_BACKOFF || 2.0),
            maximumInterval: process.env.RETRY_MAX_INTERVAL || '1m',
            maximumAttempts: Number(process.env.RETRY_MAX_ATTEMPTS || 5)
        }

        return {
            address,
            taskQueue,
            activityTimeout,
            retry
        }
    })()
}
