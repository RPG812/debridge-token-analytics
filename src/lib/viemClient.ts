import { createPublicClient, http, parseAbiItem, type Hash } from 'viem'
import { mainnet } from 'viem/chains'
import { config } from '../config/index.js'
import { withRetry } from './retry.js'
import { logError } from './logger.js'

if (!config.rpcUrl) throw new Error('RPC_URL is required')
if (!config.contract) throw new Error('USDC contract address is required')

// ERC-20 Transfer event
export const usdcTransferEvent = parseAbiItem(
    'event Transfer(address indexed from, address indexed to, uint256 value)'
)

export const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(config.rpcUrl, { retryCount: 0 }) // disable viem retries
})

export type BlockRange = {
    fromBlock: bigint
    toBlock: bigint
}

// Fetch USDC Transfer logs in a block range
export async function getUsdcTransferLogs(range: BlockRange) {
    try {
        return await withRetry(() =>
            publicClient.getLogs({
                address: config.contract as `0x${string}`,
                event: usdcTransferEvent,
                fromBlock: range.fromBlock,
                toBlock: range.toBlock
            })
        )
    } catch (error) {
        logError(`getUsdcTransferLogs failed after retries for [${range.fromBlock} - ${range.toBlock}]`, error)
        throw error
    }
}

// Fetch transaction receipt
export async function getTxReceipt(hash: Hash) {
    try {
        return await withRetry(() => publicClient.getTransactionReceipt({ hash }))
    } catch (error) {
        logError(`getTxReceipt failed after retries for tx ${hash}`, error)
        throw error
    }
}

// Fetch block metadata
export async function getBlockByNumber(blockNumber: bigint) {
    try {
        return await withRetry(() => publicClient.getBlock({ blockNumber }))
    } catch (error) {
        logError(`getBlockByNumber failed after retries for block ${blockNumber}`, error)
        throw error
    }
}
