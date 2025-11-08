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

# Stop all containers but keep volumes
down:
	cd temporal && docker compose down
	docker compose down
	@echo "Containers stopped (volumes preserved)."

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
