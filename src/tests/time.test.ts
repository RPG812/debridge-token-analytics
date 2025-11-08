import { toUtcDateString } from '../lib/time.js'

describe('time utils', () => {
    it('should convert timestamp to UTC date string', () => {
        const ts = 1700000000 // fixed timestamp (Nov 2023)
        const date = toUtcDateString(ts)
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
})
