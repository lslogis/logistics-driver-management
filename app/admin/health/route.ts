import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database connection
    let dbStatus = false;
    let migrationStatus = false;
    let lastMigration = null;
    
    try {
      // Test DB connection
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = true;
      
      // Check migrations
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, started_at, finished_at 
        FROM _prisma_migrations 
        ORDER BY started_at DESC 
        LIMIT 1
      ` as any[];
      
      if (migrations && migrations.length > 0) {
        migrationStatus = true;
        lastMigration = migrations[0];
      }
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
    }

    // Get package.json version
    let version = 'unknown';
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      version = packageJson.version || 'unknown';
    } catch (e) {
      console.error('Failed to read package.json:', e);
    }

    // Collect system metrics
    const metrics = {
      database: {
        connected: dbStatus,
        migrated: migrationStatus,
        lastMigration: lastMigration ? {
          name: lastMigration.migration_name,
          appliedAt: lastMigration.finished_at,
        } : null,
      },
      application: {
        version,
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasDatabase: !!process.env.DATABASE_URL,
        hasNextAuth: !!process.env.NEXTAUTH_URL,
      },
      timestamp: {
        now: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    // Count entities for operational status
    let entityCounts = null;
    if (dbStatus) {
      try {
        const [drivers, vehicles, trips, settlements] = await Promise.all([
          prisma.driver.count(),
          prisma.vehicle.count(),
          prisma.trip.count(),
          prisma.settlement.count(),
        ]);
        
        entityCounts = {
          drivers,
          vehicles,
          trips,
          settlements,
        };
      } catch (e) {
        console.error('Failed to count entities:', e);
      }
    }

    const isHealthy = dbStatus && migrationStatus;

    return NextResponse.json({
      ok: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      version,
      migrated: migrationStatus,
      now: new Date().toISOString(),
      details: {
        ...metrics,
        entities: entityCounts,
      },
      checks: {
        database: dbStatus ? 'OK' : 'FAILED',
        migrations: migrationStatus ? 'OK' : 'PENDING',
        environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT',
      },
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': isHealthy ? 'OK' : 'UNHEALTHY',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      ok: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      now: new Date().toISOString(),
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'ERROR',
      },
    });
  }
}