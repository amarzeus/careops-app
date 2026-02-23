#!/bin/bash
export PORT=5020
npm run dev > dev_5020.log 2>&1 &
SERVER_PID=$!
echo "Waiting for server to start on port 5020..."
while ! curl -s http://localhost:5020 > /dev/null; do
  sleep 2
done
echo "Server is up! Running Playwright tests..."
export BASE_URL=http://localhost:5020
npx playwright test tests/e2e/routing.spec.ts --workers=1 > routing_results_explicit.txt 2>&1
echo "Tests completed. Shutting down server."
kill -9 $SERVER_PID
