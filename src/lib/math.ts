// Unit constants (BigInt)
const WEI_IN_ETH = 10n ** 18n
const WEI_IN_GWEI = 10n ** 9n

export function weiToEth(wei: bigint): number {
    if (wei === 0n) {
        return 0
    }

    return Number(wei) / Number(WEI_IN_ETH)
}

export function weiToGwei(wei: bigint): number {
    if (wei === 0n) {
        return 0
    }

    return Number(wei) / Number(WEI_IN_GWEI)
}

export function gasCostWei(gasUsed: bigint, effectiveGasPrice: bigint): bigint {
    return gasUsed * effectiveGasPrice
}

export function toDecimalString(value: bigint): string {
    return value.toString(10)
}
