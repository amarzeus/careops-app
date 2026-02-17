#!/usr/bin/env bash

# Exit on error
set -e

echo "🚀 Starting robust build process..."

# 0. Patch Prisma Schema for Production (PostgreSQL)
if [[ "$DATABASE_URL" == postgres* ]]; then
  echo "🔧 Detected PostgreSQL environment. Patching schema.prisma..."
  sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma
fi


# 1. Install dependencies using the lock file
echo "📦 Installing dependencies from package-lock.json..."
npm ci

# 2. Verify Next.js binary exists
echo "🔍 Checking for Next.js binary..."
if [ ! -f "./node_modules/.bin/next" ]; then
  echo "❌ Error: next binary not found in node_modules/.bin"
  ls -la node_modules/.bin
  exit 1
fi

# 3. Generate Prisma Client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# 4. Build Next.js
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build process completed successfully!"
