#To run locally on Apple M1/M2/M3 — uncomment the section below
#FROM node:20-alpine
#WORKDIR /app
#COPY package*.json ./
#RUN npm ci
#COPY . .
#RUN npm run build || true
#CMD ["npm", "run", "dev"]

# To run on Linux or GitHub Codespaces — uncomment the section below
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

CMD ["sh", "-c", "until nc -z temporal 7233; do echo '⏳ Waiting for Temporal...'; sleep 3; done && echo '✅ Temporal is up, starting worker...' && npm run worker:start"]
