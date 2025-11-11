# Architecture Overview

## 1. Overview

This project implements a blockchain data pipeline for collecting and analyzing **ERC-20 transfer events** from the Ethereum mainnet.  
The system retrieves raw events via the JSON-RPC API, enriches them with gas information, calculates time-series gas metrics, and exports the results as structured analytics in JSON format.

The pipeline is fully asynchronous and fault-tolerant, built around **Temporal** for workflow orchestration and **ClickHouse** for time-series storage.  
All services run inside Docker containers and are managed through a unified **Makefile** interface.

**Core technologies:**  
TypeScript • Temporal • ClickHouse • viem • Docker


## 2. System Architecture

The pipeline consists of three main layers coordinated by **Temporal**.

### Workflow Orchestration
The main entry point is `analyticsWorkflow`, which runs four sequential activities with built-in retries and fault tolerance:

1. `сollectTransfersActivity`  
   - Fetches ERC-20 `Transfer` logs using `viem`.  
   - Handles pagination, concurrency, and rate limits adaptively.  
   - Writes decoded events into the `raw_events` table.

2. `enrichWithReceiptsActivity`  
   - Retrieves transaction receipts and block timestamps.  
   - Computes gas usage and effective gas price and stores results in `tx_meta`.

3. `computeMetricsActivity`  
   Aggregates metrics in ClickHouse:
    - Daily total gas cost
    - 7-day moving average (MA7) of gas price
    - Cumulative gas cost  

   Results are stored in the `daily_metrics` table.

4. `exportJsonActivity`  
   Reads aggregated data from ClickHouse, builds a structured JSON, and writes it to `./output/analytics.json`.  


### Data Layer (ClickHouse)
The system stores three logical datasets optimized for analytical workloads:

- `raw_events` — decoded ERC-20 transfers
- `tx_meta` — transaction-level metadata (gas, price, block time)
- `daily_metrics` — daily aggregated analytics

Aggregations use ClickHouse **window functions** for MA7 and cumulative sums.


### RPC Layer
The Ethereum RPC client is implemented with **viem**, using adaptive fallback between [Alchemy](https://www.alchemy.com/) and [Infura](https://www.infura.io/).

All network calls use the `withRetry` helper with exponential backoff and jitter for resilience.


## 3. Data Model (ClickHouse)

Each table uses the **ReplacingMergeTree** engine with 180-day TTL and optimized indexes for time-series workloads.

```sql
CREATE TABLE raw_events (
tx_hash String,
log_index UInt32,
block_number UInt32,
from_address String,
to_address String,
value UInt256,
block_time DateTime('UTC'),
_ingested_at DateTime('UTC') DEFAULT now()
)
ENGINE = ReplacingMergeTree(_ingested_at)
PARTITION BY toYYYYMM(block_time)
ORDER BY (tx_hash, log_index)
TTL _ingested_at + INTERVAL 180 DAY DELETE;
```

Key points:
- Indexes on `from_address`, `to_address`, and `block_number` accelerate lookups.
- The schema separates raw event data (`raw_events`) and enriched metadata (`tx_meta`) for efficient joins.
- `daily_metrics` is built using ClickHouse window functions (`OVER (...)`) for MA7 and cumulative calculations.

## 4. Operational Resilience

### Reliability and Idempotency
- Every activity is idempotent and can be retried safely.
- Deduplication is ensured by `(tx_hash, log_index)` uniqueness.
- Temporal handles retry policies, exponential backoff, and heartbeats.
- RPC retries are implemented via a custom `withRetry` helper with adaptive delay and jitter.
- The system tolerates rate-limit errors and automatically reduces block range size.
- All runtime parameters are defined via `.env.docker`

### Deployment and Control
Full infrastructure (Temporal + ClickHouse + app) runs via **Docker Compose**, managed by the **Makefile**.

Primary commands:
```
make up            # start all services
make run-worker    # start Temporal worker
make run-workflow  # launch workflow
make down          # stop containers
make clean         # remove all containers and networks
```

## 5. Future Improvements

The current implementation focuses on the core data pipeline, orchestration, and analytical logic.  
Several areas remain open for future enhancement:

- **Startup & Shutdown** — improve initialization and graceful shutdown sequence for Temporal worker and workflow processes.
- **Monitoring & Metrics** — add Prometheus / OpenTelemetry instrumentation for activity latency, RPC retries, and workflow metrics.
- **Centralized Error Handling** — improve centralized exception handling and structured logging across all workflow activities.
- **ARM Compatibility** — resolve build issues for `@temporalio/core-bridge` on Apple Silicon (M1–M3).
- **Testing Coverage** — extend integration and unit tests, especially for metrics aggregation and ClickHouse queries.
- **Optional FX Conversion** — implement ETH to USDC conversion for daily totals.
- **Workflow Parallelization** — optional optimization: split analytics by block ranges or token addresses to run multiple workflows concurrently.
- **Make Commands** — add one-command startup for worker and workflow in production.
