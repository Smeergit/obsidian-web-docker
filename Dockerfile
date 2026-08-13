FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        ca-certificates \
        unzip \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/MusiCode1/obsidian-web.git .
RUN node scripts/update-obsidian-mobile.js --version 1.12.7
RUN node scripts/patch-obsidian-mobile.js --version 1.12.7
WORKDIR /app/src/runtime-server/server
RUN npm install
WORKDIR /app
COPY docker/registry-init.js docker/proxy.js docker/entrypoint.sh /app/docker/
RUN chmod +x /app/docker/entrypoint.sh

ENV VAULT_PATH=/vault/obsidian
ENV VAULT_REGISTRY=/vault/registry.json
ENV VAULT_AUTOOPEN=true
ENV PORT=3000
ENV INTERNAL_PORT=3001

EXPOSE 3000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
