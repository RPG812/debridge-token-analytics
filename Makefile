# Global network name for all services
NETWORK_NAME=debridge-net

.PHONY: network temporal app up down clean logs rebuild restart build-only

# Create a shared Docker network if it doesn't exist
network:
	@docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || \
	docker network create $(NETWORK_NAME)

# Start Temporal (Postgres + UI)
temporal:
	cd temporal && docker compose up -d

# Start ClickHouse + Application (no rebuild)
app:
	docker compose up -d

# Full startup sequence (no rebuild)
up: network temporal app
	@echo "All services are up and running."

# Rebuild only the application container (faster iteration)
rebuild:
	docker compose up -d --build app
	@echo "Application rebuilt and restarted."

# Restart the app without rebuild (keep cache)
restart:
	docker compose restart app
	@echo "Application restarted."

# Build all Docker images (ClickHouse + app)
build-only:
	docker compose build
	@echo "Docker images built."

# Stop all containers without removing volumes or networks
down:
	@echo "Stopping all running containers..."
	@if [ -d temporal ]; then \
		cd temporal && docker compose down --remove-orphans; \
	fi
	docker compose down --remove-orphans
	@echo "Containers stopped."

# Stop and remove all containers, networks, and volumes
clean:
	cd temporal && docker compose down -v
	docker compose down -v
	rm -rf ./docker/clickhouse-init/users.d || true
	docker network rm $(NETWORK_NAME) || true
	@echo "Environment cleaned up completely."

# Stream logs from all services
logs:
	docker compose logs -f

# Run worker (waits for Temporal inside the container)
run-worker:
	@echo "Waiting for Temporal to become available..."
	@docker compose exec app sh -c '\
		until nc -z temporal 7233; do \
			echo "Waiting for Temporal..."; \
			sleep 3; \
		done; \
		echo "Temporal is up, starting worker..."; \
		npm run worker:start \
	'

# Run workflow after worker is ready
run-workflow:
	@docker compose exec app sh -c "npm run workflow:start"

# Run worker + workflow locally (Docker infra must be running)
dev-run:
	TEMPORAL_ADDRESS=localhost:7233 CLICKHOUSE_HOST=localhost npm run worker:start & \
	sleep 5 && \
	TEMPORAL_ADDRESS=localhost:7233 CLICKHOUSE_HOST=localhost npm run workflow:start
