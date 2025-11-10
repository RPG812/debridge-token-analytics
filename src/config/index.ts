import dotenv from 'dotenv'
dotenv.config()

export const config = {
    rpc: {
        alchemy: process.env.RPC_ALCHEMY || '',
        infura: process.env.RPC_INFURA || ''
    },
    address: process.env.ADDRESS || '',
    targetEvents: Number(process.env.TARGET_EVENTS || 5000),
    blockStep: Number(process.env.BLOCK_STEP || 100),
    batchSize: Number(process.env.BATCH_SIZE || 50),
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
        return {
            address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
            taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'token-analytics',
            activityTimeout: process.env.ACTIVITY_TIMEOUT || '2 hours'
        }
    })()
}
