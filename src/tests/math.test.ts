import { weiToEth, weiToGwei, gasCostWei, toDecimalString } from '../lib/math.js'

describe('math utils', () => {
    it('should correctly convert wei to ETH', () => {
        expect(weiToEth(1_000_000_000_000_000_000n)).toBe(1)
    })

    it('should correctly convert wei to Gwei', () => {
        expect(weiToGwei(1_000_000_000n)).toBe(1)
    })

    it('should calculate gas cost in wei', () => {
        const gasUsed = 21000n
        const gasPrice = 50_000_000_000n // 50 gwei
        expect(gasCostWei(gasUsed, gasPrice)).toBe(1_050_000_000_000_000n)
    })

    it('should convert bigint to decimal string', () => {
        expect(toDecimalString(123456789n)).toBe('123456789')
    })
})
