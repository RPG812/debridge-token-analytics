#!/bin/bash
set -e

NETWORK_NAME=debridge-net

echo "[INFO] Removing all containers, volumes, and networks..."
cd temporal
docker compose down -v
cd ..

docker compose down -v
docker network rm $NETWORK_NAME || true

echo "[SUCCESS] Environment cleaned up."
