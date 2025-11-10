#FROM node:20-alpine
#
#WORKDIR /app
#
#COPY package*.json ./
#RUN npm ci
#
#COPY . .
#
#RUN npm run build || true
#
#CMD ["npm", "run", "dev"]

# Build under amd64 to ensure native deps match Temporal runtime
FROM --platform=linux/amd64 node:20-bullseye

WORKDIR /app

# Install netcat for Temporal connection checks
RUN apt-get update && apt-get install -y netcat && rm -rf /var/lib/apt/lists/*

# Copy only package.json and package-lock.json first
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy the rest of the project
COPY . .

# Rebuild only critical native modules (under correct arch)
RUN npm rebuild @swc/core --build-from-source && \
    npm rebuild @temporalio/core-bridge --build-from-source

# Optional build (won’t crash if workflows don’t prebuild)
RUN npm run build || true

# Run worker with Temporal connection wait
CMD ["sh", "-c", "until nc -z temporal 7233; do echo '⏳ Waiting for Temporal...'; sleep 3; done && echo '✅ Temporal is up, starting worker...' && npm run worker:start"]
