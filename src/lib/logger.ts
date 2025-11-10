export const log = (msg: string) => {
    console.log(`[INFO] ${msg}`)
}

export const logWarn = (msg: string) => {
    console.warn(`[WARN] ${msg}`)
}

export function logError(context: string, error: any) {
    const message =
        typeof error === 'string'
            ? error
            : error?.shortMessage || error?.message || String(error)

    const status = error?.status ? ` status=${error.status}` : ''
    const method = error?.body?.method ? ` method=${error.body.method}` : ''
    const details = error?.details ? ` details="${error.details}"` : ''

    console.error(`[ERROR] ${context}${status}${method}${details}: ${message}`)
}


export const logMetric = (name: string, value: string | number) => {
    console.log(`[METRIC] ${name}=${value}`)
}
