#!/bin/bash
set -e

echo "[INFO] Stopping all containers..."
cd temporal
docker compose down
cd ..

docker compose down
echo "[INFO] Containers stopped."
