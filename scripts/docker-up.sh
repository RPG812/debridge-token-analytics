#!/bin/bash
set -e

NETWORK_NAME=debridge-net

echo "[INFO] Checking Docker network..."
if ! docker network inspect $NETWORK_NAME >/dev/null 2>&1; then
  docker network create $NETWORK_NAME
  echo "[INFO] Network '$NETWORK_NAME' created."
else
  echo "[INFO] Network '$NETWORK_NAME' already exists."
fi

echo "[INFO] Starting Temporal stack..."
cd temporal
docker compose up -d
cd ..

echo "[INFO] Starting ClickHouse and App..."
docker compose up -d --build

echo "[SUCCESS] All services are up and running."
