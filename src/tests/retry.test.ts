import { withRetry } from '../lib/retry.js'

describe('retry util', () => {
    it('should retry a failing function', async () => {
        let attempts = 0

        await withRetry(async () => {
            attempts++
            if (attempts < 3) throw new Error('fail')
            return 'ok'
        })

        expect(attempts).toBe(3)
    })
})
