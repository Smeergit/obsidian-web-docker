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
WORKDIR /app/src/runtime-server/server
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
