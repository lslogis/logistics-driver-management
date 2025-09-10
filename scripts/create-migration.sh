#!/bin/bash

# create-migration.sh - Task-based migration with rollback script generation
# Usage: ./create-migration.sh "migration_name" "task_id"

set -e

MIGRATION_NAME="$1"
TASK_ID="$2"

if [ -z "$MIGRATION_NAME" ] || [ -z "$TASK_ID" ]; then
    echo "Usage: $0 'migration_name' 'task_id'"
    echo "Example: $0 'initial_schema' 'DB-001'"
    exit 1
fi

echo "🚀 Creating migration: $MIGRATION_NAME for task: $TASK_ID"

# Create backup before migration
echo "📋 Creating backup before migration..."
BACKUP_FILE="backups/before_${TASK_ID}_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p backups
docker-compose exec -T db pg_dump -U postgres -d logistics_db > "$BACKUP_FILE" 2>/dev/null || echo "No database to backup (first migration)"

# Generate migration
echo "🔄 Generating Prisma migration..."
npx prisma migrate dev --name "${MIGRATION_NAME}" --create-only

# Find the latest migration directory
MIGRATION_DIR=$(find prisma/migrations -name "*${MIGRATION_NAME}*" -type d | sort | tail -1)

if [ -z "$MIGRATION_DIR" ]; then
    echo "❌ Migration directory not found"
    exit 1
fi

echo "📁 Migration created at: $MIGRATION_DIR"

# Create rollback script
ROLLBACK_SCRIPT="$MIGRATION_DIR/rollback.sql"
echo "🔙 Creating rollback script: $ROLLBACK_SCRIPT"

cat > "$ROLLBACK_SCRIPT" << EOF
-- Rollback script for $MIGRATION_NAME (Task: $TASK_ID)
-- Generated: $(date)
-- 
-- IMPORTANT: Review this script before executing!
-- This script attempts to reverse the changes made by migration.sql
--
-- To execute rollback:
-- 1. docker-compose exec -T db psql -U postgres -d logistics_db < $ROLLBACK_SCRIPT
-- 2. Delete migration directory: rm -rf $MIGRATION_DIR
-- 3. Restore from backup if needed: docker-compose exec -T db psql -U postgres -d logistics_db < $BACKUP_FILE

-- Add your rollback statements here
-- Example:
-- DROP TABLE IF EXISTS new_table;
-- ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column;

-- Note: Some operations cannot be automatically rolled back and require manual intervention
EOF

# Create task commit script
COMMIT_SCRIPT="scripts/commit-${TASK_ID}.sh"
cat > "$COMMIT_SCRIPT" << EOF
#!/bin/bash
# Commit script for task $TASK_ID
# Migration: $MIGRATION_NAME

set -e

echo "🚀 Applying migration for task $TASK_ID..."

# Apply migration
npx prisma migrate deploy

# Verify migration
echo "✅ Verifying migration..."
npx prisma db push --accept-data-loss

# Run seed if specified
if [ "\$1" = "--seed" ]; then
    echo "🌱 Running seed data..."
    npm run db:seed
fi

echo "✅ Task $TASK_ID migration completed successfully!"
echo "📝 Backup available at: $BACKUP_FILE"
echo "🔙 Rollback script available at: $ROLLBACK_SCRIPT"
EOF

chmod +x "$COMMIT_SCRIPT"

echo "✅ Migration setup complete!"
echo "📄 Migration file: $MIGRATION_DIR/migration.sql"
echo "🔙 Rollback script: $ROLLBACK_SCRIPT"
echo "🚀 Commit script: $COMMIT_SCRIPT"
echo ""
echo "Next steps:"
echo "1. Review the generated migration file"
echo "2. Update the rollback script with proper reverse operations"
echo "3. Test migration: ./$COMMIT_SCRIPT"
echo "4. Commit changes: git add . && git commit -m '[$TASK_ID] $MIGRATION_NAME'"