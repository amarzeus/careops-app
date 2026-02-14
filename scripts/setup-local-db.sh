#!/bin/bash

# Local PostgreSQL Setup Script for CareOps
# This script sets up a local PostgreSQL database using Docker

echo "🚀 CareOps Local PostgreSQL Setup"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Start PostgreSQL container
echo "🐳 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if container is running
if ! docker ps | grep -q careops-postgres; then
    echo "❌ Failed to start PostgreSQL container"
    echo "   Check logs with: docker-compose logs postgres"
    exit 1
fi

echo "✅ PostgreSQL is running on localhost:5432"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "📄 .env file already exists"
fi

echo ""
echo "📝 Next steps:"
echo "   1. Update DATABASE_URL in your .env file:"
echo "      DATABASE_URL=\"postgresql://careops:careops@localhost:5432/careops?schema=public\""
echo ""
echo "   2. Install dependencies:"
echo "      npm install"
echo ""
echo "   3. Push database schema:"
echo "      npx prisma db push"
echo ""
echo "   4. Start the development server:"
echo "      npm run dev"
echo ""
echo "   5. Access database admin (optional):"
echo "      docker-compose up -d adminer"
echo "      Then visit: http://localhost:8080"
echo "      System: PostgreSQL, Server: postgres, Username: careops, Password: careops, Database: careops"
echo ""
echo "🎯 To stop PostgreSQL:"
echo "   docker-compose down"
echo ""
echo "🎯 To stop and remove data:"
echo "   docker-compose down -v"
