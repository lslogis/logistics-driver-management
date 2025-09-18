#!/bin/bash

# Fix Prisma Permission Errors Script
# This script resolves permission issues with Prisma client generation

echo "🔧 Fixing Prisma permissions..."

# Check if running in Docker or locally
if [ -f /.dockerenv ]; then
    echo "📦 Running in Docker container"
    
    # Fix permissions for Docker environment
    if [ -d "node_modules" ]; then
        echo "Fixing node_modules permissions..."
        chown -R node:node node_modules 2>/dev/null || sudo chown -R node:node node_modules
    fi
    
    if [ -d "node_modules/.prisma" ]; then
        echo "Fixing .prisma client permissions..."
        chmod -R 755 node_modules/.prisma
    fi
    
    if [ -d "node_modules/@prisma" ]; then
        echo "Fixing @prisma permissions..."
        chmod -R 755 node_modules/@prisma
    fi
else
    echo "💻 Running on local machine"
    
    # Fix permissions for local development
    if [ -d "node_modules" ]; then
        echo "Fixing node_modules permissions..."
        chmod -R 755 node_modules
    fi
    
    # Clean Prisma cache
    echo "Cleaning Prisma cache..."
    rm -rf node_modules/.prisma
    rm -rf node_modules/@prisma/client
fi

# Regenerate Prisma client
echo "🔄 Regenerating Prisma client..."
npx prisma generate --schema=prisma/schema.prisma

# Verify Prisma client generation
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma client generated successfully!"
    
    # Additional permission fix after generation
    if [ -f /.dockerenv ]; then
        chown -R node:node node_modules/.prisma 2>/dev/null
        chown -R node:node node_modules/@prisma 2>/dev/null
    fi
else
    echo "❌ Failed to generate Prisma client"
    echo "Try running: npm install --unsafe-perm"
    exit 1
fi

echo "🎉 Prisma permissions fixed successfully!"