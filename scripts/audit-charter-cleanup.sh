#!/bin/bash

# Charter Migration Cleanup Audit Script
# 
# This script verifies the complete transition from Trip-based system to Charter-based system.
# It detects any remaining trips references and ensures proper charter system implementation.
#
# Usage:
#   ./scripts/audit-charter-cleanup.sh [options]
#
# Options:
#   --skip-tests    Skip running automated tests
#   --skip-db       Skip database schema validation
#   --verbose       Show detailed output
#   --help          Show this help message

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Script configuration
SKIP_TESTS=false
SKIP_DB=false
VERBOSE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    echo "Charter Migration Cleanup Audit Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --skip-tests    Skip running automated tests"
    echo "  --skip-db       Skip database schema validation"
    echo "  --verbose       Show detailed output"
    echo "  --help          Show this help message"
    echo ""
    echo "This script verifies the complete transition from Trip to Charter system."
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_CHECKS++))
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

increment_check() {
    ((TOTAL_CHECKS++))
}

# Main audit functions
audit_code_references() {
    log_info "🔍 Auditing codebase for remaining trips references..."
    
    local failed=false
    local search_dirs=("src" "tests")
    local exclude_patterns=("node_modules" ".next" "dist" "coverage" ".git")
    
    # Build exclusion arguments for grep
    local exclude_args=""
    for pattern in "${exclude_patterns[@]}"; do
        exclude_args+=" --exclude-dir=$pattern"
    done
    
    # Failure patterns - these should NOT exist
    local failure_patterns=(
        "src/app/trips[^/]"  # Match src/app/trips but not src/app/trips/page.tsx (redirect allowed)
        "useTrips[^C]"  # Match useTrips but not useTripsCompat
        "TripsAPI[^C]"  # Match TripsAPI but not TripsAPICompat
        "TRIPS_[A-Z]"   # Match TRIPS_CONSTANT but not trips_
        "matcher:.*trips"
    )
    
    # Allowed patterns in comments/docs
    local allowed_patterns=(
        "마이그레이션"
        "migration"
        "CHANGELOG"
        "301.*redirect"
        "redirect.*charters"
        "deprecated"
        "legacy"
        "import/trips"  # Import trips CSV is allowed
        "API.*import.*trips"  # Import API for trips is allowed
        "POST.*import/trips"  # Import endpoint is allowed
        "CSV.*trips"  # CSV import/export is allowed
        "template.*trips"  # Template download is allowed
        "compatibility.*alias"  # Compatibility aliases are allowed
        "transition.*from.*trips"  # Transition comments are allowed
    )
    
    increment_check
    log_verbose "Searching for prohibited trips references..."
    
    for pattern in "${failure_patterns[@]}"; do
        local results
        if results=$(grep -RIn $exclude_args "$pattern" "${search_dirs[@]}" 2>/dev/null || true); then
            if [[ -n "$results" ]]; then
                # Check if it's in allowed context
                local is_allowed=false
                for allowed in "${allowed_patterns[@]}"; do
                    if echo "$results" | grep -qi "$allowed"; then
                        is_allowed=true
                        break
                    fi
                done
                
                if [[ "$is_allowed" == "false" ]]; then
                    log_error "Found prohibited trips reference: $pattern"
                    echo "$results" | head -5
                    if [[ $(echo "$results" | wc -l) -gt 5 ]]; then
                        echo "... and $(($(echo "$results" | wc -l) - 5)) more matches"
                    fi
                    failed=true
                fi
            fi
        fi
    done
    
    if [[ "$failed" == "true" ]]; then
        log_error "Code cleanup verification failed"
        return 1
    else
        log_success "No prohibited trips references found in codebase"
        return 0
    fi
}

audit_routing_redirects() {
    log_info "🚦 Auditing routing and redirects..."
    
    increment_check
    
    # Check if trips page exists and only contains redirect
    local trips_page="$PROJECT_ROOT/src/app/trips/page.tsx"
    if [[ -f "$trips_page" ]]; then
        log_verbose "Found trips page, checking if it only contains redirect..."
        
        local content
        content=$(cat "$trips_page")
        
        # Must contain redirect to charters
        if ! echo "$content" | grep -q "redirect('/charters')"; then
            log_error "trips/page.tsx exists but doesn't redirect to /charters"
            return 1
        fi
        
        # Must not contain other React functionality
        if echo "$content" | grep -q -E "(useState|useEffect|return.*<|render|component)"; then
            log_error "trips/page.tsx contains React functionality beyond redirect"
            return 1
        fi
        
        log_success "trips/page.tsx properly redirects to /charters"
    else
        log_success "No trips page found (clean removal)"
    fi
    
    return 0
}

audit_sidebar_menu() {
    log_info "📋 Auditing sidebar menu configuration..."
    
    increment_check
    
    local sidebar_file="$PROJECT_ROOT/src/components/layout/AdminSidebar.tsx"
    if [[ ! -f "$sidebar_file" ]]; then
        log_error "AdminSidebar.tsx not found"
        return 1
    fi
    
    local content
    content=$(cat "$sidebar_file")
    
    # Check for charter menu
    if ! echo "$content" | grep -q "용차 관리"; then
        log_error "Charter management menu (용차 관리) not found in sidebar"
        return 1
    fi
    
    if ! echo "$content" | grep -q "href.*['\"]\/charters['\"]"; then
        log_error "Charter menu href '/charters' not found in sidebar"
        return 1
    fi
    
    # Check for permission gate
    if ! echo "$content" | grep -q -E "(PermissionGate|can\(['\"]charters['\"])"; then
        log_error "Charter menu permission control not found in sidebar"
        return 1
    fi
    
    # Check that no trips menu exists
    if echo "$content" | grep -q -E "(운행 관리|href.*['\"]\/trips['\"])"; then
        log_error "Found trips menu still present in sidebar"
        return 1
    fi
    
    log_success "Sidebar menu properly configured with charter management"
    return 0
}

audit_rbac_permissions() {
    log_info "🔐 Auditing RBAC permissions..."
    
    increment_check
    
    local rbac_file="$PROJECT_ROOT/src/lib/auth/rbac.ts"
    if [[ ! -f "$rbac_file" ]]; then
        log_error "RBAC file not found"
        return 1
    fi
    
    local content
    content=$(cat "$rbac_file")
    
    # Check for charters resource
    if ! echo "$content" | grep -q "charters:"; then
        log_error "charters resource not found in RBAC permissions"
        return 1
    fi
    
    # Check for proper role mappings
    local required_roles=("ADMIN" "DISPATCHER" "ACCOUNTANT")
    for role in "${required_roles[@]}"; do
        if ! echo "$content" | grep -A 10 "charters:" | grep -q "$role"; then
            log_error "Role $role not found in charters permissions"
            return 1
        fi
    done
    
    # Check for CRUD operations
    local required_actions=("create" "read" "update" "delete")
    for action in "${required_actions[@]}"; do
        if ! echo "$content" | grep -A 10 "charters:" | grep -q "$action:"; then
            log_error "Action $action not found in charters permissions"
            return 1
        fi
    done
    
    log_success "RBAC permissions properly configured for charters"
    return 0
}

audit_api_endpoints() {
    log_info "🌐 Auditing API endpoints..."
    
    increment_check
    
    # Check charter API exists
    local charter_api_dir="$PROJECT_ROOT/src/app/api/charters"
    if [[ ! -d "$charter_api_dir" ]]; then
        log_error "Charter API directory not found: $charter_api_dir"
        return 1
    fi
    
    # Check trips API doesn't exist (unless it's just 410 Gone handlers or import/trips)
    local trips_api_dir="$PROJECT_ROOT/src/app/api/trips"
    if [[ -d "$trips_api_dir" ]]; then
        log_verbose "Found trips API directory, checking if it contains only 410 Gone handlers..."
        
        # Count non-410 handlers (excluding import/trips which is allowed)
        local active_handlers=0
        while IFS= read -r -d '' file; do
            if [[ -f "$file" ]]; then
                # Skip import/trips endpoint as it's allowed for CSV import
                if [[ "$file" == *"/import/"* ]]; then
                    log_verbose "Skipping import endpoint: $file"
                    continue
                fi
                
                local content
                content=$(cat "$file")
                if ! echo "$content" | grep -q "410"; then
                    ((active_handlers++))
                    log_verbose "Active handler found: $file"
                fi
            fi
        done < <(find "$trips_api_dir" -name "*.ts" -print0)
        
        if [[ $active_handlers -gt 0 ]]; then
            log_error "Found $active_handlers active trips API handlers (should be 410 Gone only)"
            return 1
        fi
    fi
    
    # Verify charter API has basic endpoints
    local required_endpoints=("requests")
    for endpoint in "${required_endpoints[@]}"; do
        local endpoint_path="$charter_api_dir/$endpoint"
        if [[ ! -d "$endpoint_path" && ! -f "$endpoint_path/route.ts" ]]; then
            log_error "Required charter endpoint not found: $endpoint"
            return 1
        fi
    done
    
    log_success "API endpoints properly configured"
    return 0
}

audit_tests() {
    log_info "🧪 Auditing test configuration..."
    
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "Skipping test validation (--skip-tests flag)"
        return 0
    fi
    
    increment_check
    
    # Check charter E2E tests exist
    local charter_e2e="$PROJECT_ROOT/tests/e2e/charter-access.spec.ts"
    if [[ ! -f "$charter_e2e" ]]; then
        log_error "Charter E2E test not found: $charter_e2e"
        return 1
    fi
    
    # Check for remaining trips tests
    local trips_tests
    if trips_tests=$(find "$PROJECT_ROOT/tests" -name "*trips*" 2>/dev/null || true); then
        if [[ -n "$trips_tests" ]]; then
            log_error "Found remaining trips test files:"
            echo "$trips_tests"
            return 1
        fi
    fi
    
    # Run tests if requested
    log_verbose "Running test suite..."
    if cd "$PROJECT_ROOT" && npm test --silent > /dev/null 2>&1; then
        log_success "Test suite passed"
    else
        log_error "Test suite failed"
        return 1
    fi
    
    return 0
}

audit_database_schema() {
    log_info "🗄️  Auditing database schema..."
    
    if [[ "$SKIP_DB" == "true" ]]; then
        log_warning "Skipping database validation (--skip-db flag)"
        return 0
    fi
    
    increment_check
    
    local schema_file="$PROJECT_ROOT/prisma/schema.prisma"
    if [[ ! -f "$schema_file" ]]; then
        log_error "Prisma schema file not found"
        return 1
    fi
    
    local content
    content=$(cat "$schema_file")
    
    # Check that Trip model is removed
    if echo "$content" | grep -q "model Trip"; then
        log_error "Trip model still exists in Prisma schema"
        return 1
    fi
    
    # Check that Charter models exist
    local required_models=("CharterRequest" "CenterFare" "CharterDestination")
    for model in "${required_models[@]}"; do
        if ! echo "$content" | grep -q "model $model"; then
            log_error "Required model not found in schema: $model"
            return 1
        fi
    done
    
    log_success "Database schema properly configured for charter system"
    return 0
}

# Main execution
main() {
    echo "🚚 Charter Migration Cleanup Audit"
    echo "=================================="
    echo ""
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Run all audit checks
    local overall_result=0
    
    audit_code_references || overall_result=1
    audit_routing_redirects || overall_result=1
    audit_sidebar_menu || overall_result=1
    audit_rbac_permissions || overall_result=1
    audit_api_endpoints || overall_result=1
    audit_tests || overall_result=1
    audit_database_schema || overall_result=1
    
    # Final report
    echo ""
    echo "📊 Audit Summary"
    echo "==============="
    echo -e "Total checks: ${BLUE}$TOTAL_CHECKS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    echo ""
    
    if [[ $overall_result -eq 0 ]]; then
        echo -e "${GREEN}✅ All audit checks passed!${NC}"
        echo "The Trip → Charter migration is complete and properly configured."
    else
        echo -e "${RED}❌ Audit failed!${NC}"
        echo "The Trip → Charter migration has remaining issues that need to be addressed."
        echo ""
        echo "Next steps:"
        echo "1. Review the failed checks above"
        echo "2. Fix the identified issues"
        echo "3. Re-run this audit script"
    fi
    
    exit $overall_result
}

# Parse arguments and run main function
parse_args "$@"
main