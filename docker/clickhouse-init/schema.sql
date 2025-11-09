USE analytics;

CREATE TABLE IF NOT EXISTS raw_events
(
    tx_hash String,
    log_index UInt32,
    block_number UInt32,
    from_address String,
    to_address String,
    value UInt256,
    block_time DateTime('UTC') DEFAULT toDateTime(0, 'UTC'),
    _ingested_at DateTime('UTC') DEFAULT now()
)
    ENGINE = ReplacingMergeTree(_ingested_at)
        PARTITION BY toYYYYMM(block_time)
        ORDER BY (tx_hash, log_index)
        TTL _ingested_at + INTERVAL 180 DAY DELETE
        SETTINGS index_granularity = 8192;

CREATE TABLE IF NOT EXISTS tx_meta
(
    tx_hash String,
    block_number UInt32,
    block_time DateTime('UTC'),
    gas_used UInt64,
    effective_gas_price UInt256,
    _ingested_at DateTime('UTC') DEFAULT now()
)
    ENGINE = ReplacingMergeTree(_ingested_at)
        PARTITION BY toYYYYMM(block_time)
        ORDER BY (tx_hash)
        TTL _ingested_at + INTERVAL 180 DAY DELETE
        SETTINGS index_granularity = 8192;

CREATE TABLE IF NOT EXISTS daily_metrics
(
    date Date,
    gas_cost_wei UInt256,
    gas_cost_eth Float64,
    ma7_wei UInt256,
    ma7_gwei Float64,
    cumulative_gas_cost_eth Float64,
    _ingested_at DateTime('UTC') DEFAULT now()
)
    ENGINE = ReplacingMergeTree(_ingested_at)
        PARTITION BY toYYYYMM(date)
        ORDER BY (date)
        TTL _ingested_at + INTERVAL 180 DAY DELETE
        SETTINGS index_granularity = 8192;
