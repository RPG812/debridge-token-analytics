import { testClickhouseConnection } from './lib/clickhouse.js'
import { log } from './lib/logger.js'

const main = async () => {
    log('Starting infrastructure verification...')
    await testClickhouseConnection()
    log('✅ Infrastructure check complete.')
}

main()
