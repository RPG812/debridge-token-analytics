import dotenv from 'dotenv'
dotenv.config()

export const config = {
    rpcUrl: process.env.RPC_URL || '',
    address: process.env.ADDRESS || '',
    contract: process.env.CONTRACT || '',
    blockStep: Number(process.env.BLOCK_STEP || 5000),
    batchSize: Number(process.env.BATCH_SIZE || 100),

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

    temporal: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
    }
}
