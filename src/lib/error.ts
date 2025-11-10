export class RateLimitError extends Error {
    constructor(message = 'Rate limit exceeded') {
        super(message)
        this.name = 'RateLimitError'
        this.isRateLimit = true
    }
    isRateLimit: boolean
}
