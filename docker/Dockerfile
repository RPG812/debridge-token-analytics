FROM --platform=linux/amd64 node:20-bullseye

WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y netcat && rm -rf /var/lib/apt/lists/*
RUN npm ci
COPY . .
COPY .env.docker ./.env.docker

RUN npm rebuild @swc/core --build-from-source \
    && npm rebuild @temporalio/core-bridge --build-from-source \
    && npm run build || true
