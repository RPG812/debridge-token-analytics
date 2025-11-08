export function toUnixSeconds(value: number | bigint): number {
    if (typeof value === 'bigint') {
        return Number(value)
    }

    return value
}

export function toUtcDate(timestamp: number | bigint): Date {
    const seconds = toUnixSeconds(timestamp)

    return new Date(seconds * 1000)
}

export function toUtcDateString(timestamp: number | bigint): string {
    const d = toUtcDate(timestamp)

    const year = d.getUTCFullYear()
    const month = `${d.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${d.getUTCDate()}`.padStart(2, '0')

    return `${year}-${month}-${day}`
}
