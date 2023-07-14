#!/bin/bash

# Start Ganache CLI in the background
npx ganache-cli &

# Store the PID of Ganache CLI process
ganache_pid=$!

# Wait for Ganache to start
timeout=10
while ! nc -z localhost 8545; do
  ((timeout--))

  if [ $timeout -eq 0 ]; then
    echo "Ganache failed to start within the specified timeout!"
    exit 1
  fi

  sleep 1
done

# Run the Truffle tests
npx truffle test

# Kill Ganache CLI process
kill $ganache_pid
