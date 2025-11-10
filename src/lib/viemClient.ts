import { createPublicClient, http, parseAbiItem, fallback, type Hash, Transport } from 'viem'
import { log } from './logger.js'
import { mainnet } from 'viem/chains'
import { config } from '../config/index.js'
import { withRetry } from './retry.js'
import { logError } from './logger.js'

if (!config.token?.contract) throw new Error('ERC-20 contract address is required')

export const transferEvent = parseAbiItem(
    'event Transfer(address indexed from, address indexed to, uint256 value)'
)

export const publicClient = createRpcClient()

export type BlockRange = {
    fromBlock: bigint
    toBlock: bigint
}

export function createRpcClient() {
    const transports: Transport[] = []

    if (config.rpc.infura) {
        log('[RPC] Infura endpoint detected')
        transports.push(
            http(config.rpc.infura, {
                retryCount: 0,
                name: 'infura',
            }),
        )
    }

    if (config.rpc.alchemy) {
        log('[RPC] Alchemy endpoint detected')
        transports.push(
            http(config.rpc.alchemy, {
                retryCount: 0,
                name: 'alchemy',
            }),
        )
    }

    if (!transports.length) {
        throw new Error('No RPC endpoints configured (set ALCHEMY_URL or INFURA_URL)')
    }

    // Use adaptive fallback with ranking — automatically prioritizes the healthiest RPC (Infura ↔ Alchemy)
    const transport = transports.length > 1 ? fallback(transports, { rank: true }) : transports[0]

    const client = createPublicClient({
        chain: mainnet,
        transport,
    })

    log(
        `[RPC] Created client with ${
            transports.length > 1
                ? 'fallback(Alchemy + Infura)'
                : config.rpc.alchemy
                    ? 'Alchemy only'
                    : 'Infura only'
        }`)

    return client
}

/** Fetch ERC-20 Transfer logs in a given block range */
export async function getTransferLogs(range: BlockRange) {
    try {
        return await withRetry(() =>
            publicClient.getLogs({
                address: config.token.contract as `0x${string}`,
                event: transferEvent,
                fromBlock: range.fromBlock,
                toBlock: range.toBlock
            })
        )
    } catch (error) {
        logError(`getTransferLogs failed after retries for [${range.fromBlock} - ${range.toBlock}]`, error)
        throw error
    }
}

export async function getTxReceipt(hash: Hash) {
    try {
        return await withRetry(() => publicClient.getTransactionReceipt({ hash }))
    } catch (error) {
        logError(`getTxReceipt failed after retries for tx ${hash}`, error)
        throw error
    }
}

export async function getLatestBlock() {
    try {
        return await withRetry(() => publicClient.getBlock())
    } catch (error) {
        logError(`getBlockByNumber failed after retries`, error)
        throw error
    }}

export async function getBlockByNumber(blockNumber: bigint) {
    try {
        return await withRetry(() => publicClient.getBlock({ blockNumber }))
    } catch (error) {
        logError(`getBlockByNumber failed after retries for block ${blockNumber}`, error)
        throw error
    }
}
