# Global network name for all services
NETWORK_NAME=debridge-net

.PHONY: network temporal app up down clean logs

# Create a shared Docker network if it doesn't exist
network:
	@docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || \
	docker network create $(NETWORK_NAME)

# Start Temporal (Postgres + UI)
temporal:
	cd temporal && docker compose up -d

# Start ClickHouse + Application
app:
	docker compose up -d --build

# Full startup sequence
up: network temporal app
	@echo "All services are up and running."

# Stop all containers but keep volumes
down:
	cd temporal && docker compose down
	docker compose down

# Stop and remove all containers, networks, and volumes
clean:
	cd temporal && docker compose down -v
	docker compose down -v
	docker network rm $(NETWORK_NAME) || true
	@echo "Environment cleaned up."

# Stream logs from all services
logs:
	docker compose logs -f
