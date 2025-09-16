import { PrismaClient, AuditAction } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogParams {
  userId?: string | null;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: any;
  metadata?: any;
}

// Create audit log entry
export async function createAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: params.changes || undefined,
        metadata: params.metadata || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break main operations
    return null;
  }
}

// Batch create audit logs
export async function createAuditLogs(logs: AuditLogParams[]) {
  try {
    return await prisma.auditLog.createMany({
      data: logs.map(log => ({
        userId: log.userId,
        userName: log.userName,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        changes: log.changes || undefined,
        metadata: log.metadata || undefined,
      })),
    });
  } catch (error) {
    console.error('Failed to create audit logs:', error);
    return null;
  }
}

// Query audit logs
export async function getAuditLogs(params: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  
  if (params.userId) where.userId = params.userId;
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.action) where.action = params.action;
  
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }
  
  return prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: params.limit || 100,
    skip: params.offset || 0,
  });
}

// Audit log helpers for specific actions
export const audit = {
  // User actions
  login: (userId: string, userName: string, metadata?: any) =>
    createAuditLog({
      userId,
      userName,
      action: 'LOGIN',
      entityType: 'User',
      entityId: userId,
      metadata,
    }),
  
  logout: (userId: string, userName: string, metadata?: any) =>
    createAuditLog({
      userId,
      userName,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: userId,
      metadata,
    }),
  
  // CRUD actions
  create: (params: Omit<AuditLogParams, 'action'>) =>
    createAuditLog({ ...params, action: 'CREATE' }),
  
  update: (params: Omit<AuditLogParams, 'action'>) =>
    createAuditLog({ ...params, action: 'UPDATE' }),
  
  delete: (params: Omit<AuditLogParams, 'action'>) =>
    createAuditLog({ ...params, action: 'DELETE' }),
  
  // Import/Export actions
  import: (params: Omit<AuditLogParams, 'action'>) =>
    createAuditLog({ ...params, action: 'IMPORT' }),
  
  export: (params: Omit<AuditLogParams, 'action'>) =>
    createAuditLog({ ...params, action: 'EXPORT' }),
  
  // Settlement actions
  confirm: (params: Omit<AuditLogParams, 'action'>) =>
    createAuditLog({ ...params, action: 'CONFIRM' }),
};

// Audit middleware for API routes
export function withAudit<T extends (...args: any[]) => any>(
  handler: T,
  getAuditParams: (req: any, res: any) => AuditLogParams | null
): T {
  return (async (...args: Parameters<T>) => {
    const [req, res] = args;
    
    try {
      const result = await handler(...args);
      
      // Log successful action
      const auditParams = getAuditParams(req, result);
      if (auditParams) {
        await createAuditLog(auditParams);
      }
      
      return result;
    } catch (error) {
      // Log failed action
      const auditParams = getAuditParams(req, null);
      if (auditParams) {
        await createAuditLog({
          ...auditParams,
          metadata: {
            ...auditParams.metadata,
            error: error instanceof Error ? error.message : 'Unknown error',
            failed: true,
          },
        });
      }
      
      throw error;
    }
  }) as T;
}

// Format changes for audit log
export function formatChanges(before: any, after: any): any {
  const changes: any = {};
  
  if (!before) {
    return { created: after };
  }
  
  if (!after) {
    return { deleted: before };
  }
  
  // Compare objects and track changes
  for (const key in after) {
    if (after[key] !== before[key]) {
      changes[key] = {
        from: before[key],
        to: after[key],
      };
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : null;
}

// Get user info from session for audit
export async function getUserForAudit(session: any) {
  if (!session?.user?.email) {
    return { userId: null, userName: 'system' };
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  
  return {
    userId: user?.id || null,
    userName: user?.name || session.user.email,
  };
}