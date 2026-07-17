#!/bin/sh
set -eu

npm run prisma:migrate

# Demo seeding is idempotent and enabled by default for the local stack.
# Set RUN_SEED=false in production so restarts never touch data.
if [ "${RUN_SEED:-true}" = "true" ]; then
  npm run prisma:seed
else
  echo "[entrypoint] RUN_SEED=${RUN_SEED:-true}; skipping seed"
fi

exec node dist/index.js
