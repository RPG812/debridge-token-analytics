export const log = (msg: string) => {
    console.log(`[INFO] ${msg}`)
}

export const logWarn = (msg: string) => {
    console.warn(`[WARN] ${msg}`)
}

export const logError = (msg: string, err?: unknown) => {
    console.error(`[ERROR] ${msg}`, err)
}

export const logMetric = (name: string, value: string | number) => {
    console.log(`[METRIC] ${name}=${value}`)
}
