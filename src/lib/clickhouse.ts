import { createClient } from '@clickhouse/client'
import { config } from '../config/index.js'
import { log, logError } from './logger.js'

export const clickhouse = createClient({
    url: config.clickhouse.url,
    database: config.clickhouse.database,
    username: config.clickhouse.user,
    password: config.clickhouse.password
})

export const testClickhouseConnection = async () => {
    try {
        const res = await clickhouse.query({ query: 'SELECT version()' })
        const text = await res.text()
        log(`Connected to ClickHouse ${config.clickhouse.url}. Version: ${text.trim()}`)
    } catch (error) {
        logError('Failed to connect to ClickHouse', error)
        process.exit(1)
    }
}
