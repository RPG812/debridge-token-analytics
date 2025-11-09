import {sleep} from "./sleep.js";

/**
 * Executes an async function with exponential backoff and optional jitter.
 * Intended for unstable operations (e.g. RPC, DB, API calls).
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
    onError?: (error: unknown, attempt: number) => void
): Promise<T> {
    const {
        attempts = 5,
        baseDelayMs = 300,
        maxDelayMs = 5000,
        jitter = true
    } = options

    let lastError: unknown

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error

            if (onError) {
                onError(error, attempt)
            }

            if (attempt === attempts) break

            const delay = calcDelay(attempt, baseDelayMs, maxDelayMs, jitter)
            await sleep(delay)
        }
    }

    throw lastError
}

function calcDelay(
    attempt: number,
    base: number,
    max: number,
    jitter: boolean
): number {
    const exp = base * 2 ** (attempt - 1)
    const capped = Math.min(exp, max)

    return jitter ? capped * (0.5 + Math.random() / 2) : capped
}

export type RetryOptions = {
    attempts?: number
    baseDelayMs?: number
    maxDelayMs?: number
    jitter?: boolean
}
