FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

WORKDIR /workspace

RUN corepack enable

# A new named volume copies owner and mode from this directory, so the
# non-root "node" user can write to /workspace/node_modules.
RUN mkdir -p /workspace/node_modules && chown node:node /workspace/node_modules

EXPOSE 3000 3002 4173

CMD ["sleep", "infinity"]