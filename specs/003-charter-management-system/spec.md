# Charter Management System - Final Spec with LoadingPoint Integration

## Overview

A comprehensive charter management system that properly integrates centers using the existing `LoadingPoint` table instead of creating a separate Center entity. This system handles requests from logistics centers to driver dispatch and pricing management, leveraging the proven LoadingPoint infrastructure already in use by fixed contracts and route templates.

## Business Context

This system corrects the center integration approach by:
- **Reusing LoadingPoint Infrastructure**: Leveraging the existing, proven LoadingPoint table as the center entity
- **Unified Center Management**: Consolidating `centerName` and `loadingPointName` into a single `name` field
- **Proper Request-Center Relationships**: Using `loadingPointId` FK instead of a separate center table
- **Maintaining Compatibility**: Preserving existing FixedContract and RouteTemplate relationships with LoadingPoint

## Core Data Models

### LoadingPoint (Center)

**Purpose**: Represents logistics centers and loading points in a unified entity

**Fields**:
- `id` (String, cuid, PK): Unique identifier
- `name` (String, required): Unified center/loading point name (replaces centerName + loadingPointName)
- `lotAddress` (String, optional): Lot-based address
- `roadAddress` (String, optional): Road-based address  
- `manager1` (String, optional): Primary manager name
- `manager2` (String, optional): Secondary manager name
- `phone1` (String, optional): Primary contact number
- `phone2` (String, optional): Secondary contact number
- `remarks` (String, optional): Additional notes
- `isActive` (Boolean, default true): Active status flag
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `hasMany Requests`: Charter requests from this center
- `hasMany FixedContracts`: Existing fixed contract relationships
- `hasMany RouteTemplates`: Existing route template relationships

### Request

**Purpose**: Store charter requests from logistics centers

**Fields**:
- `id` (String, cuid, PK): Unique identifier
- `requestDate` (DateTime, required): Date of the charter request
- `centerCarNo` (String, optional): Center's vehicle number for daily communication (no relational meaning)
- `vehicleTon` (Decimal(3,1), required): Requested vehicle tonnage
- `regions` (JSON array, required): Array of delivery regions
- `stops` (Integer, required): Number of destination stops
- `notes` (String, optional): Free text field for changes, returns, etc.
- `extraAdjustment` (Integer, default 0): Center billing adjustment amount (+/-)
- `adjustmentReason` (String, optional): Required when extraAdjustment ≠ 0
- `loadingPointId` (String, FK): Foreign key to LoadingPoint.id
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `createdBy` (String, optional): User who created the request

**Relationships**:
- `belongsTo LoadingPoint`: The center/loading point for this request
- `hasMany Dispatches`: Driver assignments for this request
- `belongsTo User`: Creator of the request (optional)

### Dispatch

**Purpose**: Record driver assignments for charter requests

**Fields**:
- `id` (String, cuid, PK): Unique identifier
- `requestId` (String, FK): Foreign key to Request.id
- `driverId` (String, optional): Foreign key to existing drivers table
- `driverName` (String, required): Driver name (manual entry when driverId is null)
- `driverPhone` (String, required): Driver contact number
- `driverVehicle` (String, required): Driver's vehicle information
- `deliveryTime` (String, optional): Delivery time slot (e.g., "09~12시")
- `driverFee` (Integer, required): Driver fare amount
- `driverNotes` (String, optional): Additional driver-specific notes
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships**:
- `belongsTo Request`: The charter request this dispatch fulfills
- `belongsTo Driver`: Optional link to existing driver record

### FixedContract (Unchanged)

**Purpose**: Continues to manage stable routes and "호차" for fixed contracts

**Key Points**:
- No changes to existing functionality
- Continues to use LoadingPoint relationships
- No overlap with Request.centerCarNo (which is for daily communication only)

## Business Logic

### Center Fare Calculation

**Function**: `calculateCenterFare`

**Logic**: 
```
Final Amount = Base Fare + (stops-1) × Stop Fee + (regions-1) × Region Fee + extraAdjustment
```

**Integration**: Use existing center_fares table and calculation engine

**Inputs**: 
- `loadingPointId` (for center identification)
- `vehicleTon` (for vehicle type matching)
- `regions` (for region-based fare calculation)
- `stops` (for stop-based fee calculation)
- `extraAdjustment` (for manual adjustments)

**Outputs**: 
- `baseFare`: Base transportation fare
- `extraStopFee`: Additional charges for extra stops
- `extraRegionFee`: Additional charges for extra regions
- `adjustment`: Manual adjustment amount
- `totalFare`: Final calculated fare

### Validation Rules

- **LoadingPoint Validation**: Requests must reference a valid, active LoadingPoint
- **Adjustment Validation**: If `extraAdjustment ≠ 0`, then `adjustmentReason` is required
- **Center Mapping**: When importing Excel data, `centerName` must map to an existing LoadingPoint

## API Requirements

### LoadingPoint (Center) APIs

**Endpoints**:
- `GET /api/loading-points` - List centers with filtering and pagination
- `POST /api/loading-points` - Create new center
- `GET /api/loading-points/:id` - Get center details
- `PUT /api/loading-points/:id` - Update center
- `DELETE /api/loading-points/:id` - Soft delete center

**Enhanced Features**:
- Include request count in list responses
- Support name-based search and filtering
- Maintain backward compatibility with existing FixedContract usage

### Request APIs

**Endpoints**:
- `GET /api/requests` - List requests with pagination and filtering
- `POST /api/requests` - Create new request (requires valid `loadingPointId`)
- `GET /api/requests/:id` - Get request details with loadingPoint data
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request

**Response Enhancement**:
- Include `loadingPoint.name` in all request responses
- Support filtering by `loadingPointId`
- Maintain financial summary calculations

### Excel Import/Export

**Import Requirements**:
- Accept `centerName` string in Excel files
- Map `centerName` to existing `LoadingPoint.name`
- Create new LoadingPoint if not found (with user confirmation)
- Validate all required fields before import

**Export Requirements**:
- Export `loadingPoint.name` as `centerName` column
- Maintain existing Excel format compatibility
- Include all request and dispatch data

### Validation APIs

**Business Rule Validation**:
- Validate `loadingPointId` exists and is active
- Require `adjustmentReason` when `extraAdjustment ≠ 0`
- Ensure proper fare calculation parameters

## User Interface Components

### RequestForm Component

**Purpose**: Center request input screen with LoadingPoint integration

**Fields**: 
- `loadingPointId`: Dropdown selector showing LoadingPoint.name (stores ID)
- `centerCarNo`: Manual text input for daily communication reference
- `requestDate`: Date picker
- `vehicleTon`: Numeric input with decimal support
- `regions`: Multi-select interface for delivery regions
- `stops`: Numeric input for destination count
- `notes`: Textarea for additional information
- `extraAdjustment`: Numeric input for fare adjustments
- `adjustmentReason`: Text input (required when adjustment ≠ 0)

**Features**:
- LoadingPoint dropdown with search functionality
- Real-time fare calculation based on selected center
- Form validation with helpful error messages
- Auto-save functionality for work-in-progress

### RequestList & RequestDetail Components

**Purpose**: Display requests with proper center information

**Display Requirements**:
- Show `loadingPoint.name` as center name
- Display `centerCarNo` as communication reference (not relational)
- Include center location information when available
- Maintain existing financial summary functionality

**Features**:
- Filter by center (LoadingPoint)
- Search across center names and car numbers
- Export functionality with proper center name mapping

### DispatchForm Component

**Purpose**: Driver dispatch assignment (unchanged functionality)

**Fields**: 
- `driverId`: Optional lookup to existing drivers
- `driverName`: Manual text entry
- `driverPhone`: Contact information
- `driverVehicle`: Vehicle details
- `deliveryTime`: Time slot specification
- `driverFee`: Fare amount
- `driverNotes`: Additional information

## Technical Requirements

### Database Schema Changes

**LoadingPoint Model Updates**:
```prisma
model LoadingPoint {
  id               String           @id @default(cuid())
  name             String           // Unified field replacing centerName + loadingPointName
  lotAddress       String?
  roadAddress      String?
  manager1         String?
  manager2         String?
  phone1           String?
  phone2           String?
  remarks          String?
  isActive         Boolean          @default(true)
  createdAt        DateTime         @default(now()) @db.Timestamptz(6)
  updatedAt        DateTime         @updatedAt @db.Timestamptz(6)

  // Relationships
  requests         Request[]        // New relationship
  fixedContracts   FixedContract[]  // Existing relationship
  routeTemplates   RouteTemplate[]  // Existing relationship

  @@index([name])
  @@index([isActive])
  @@map("loading_points")
}
```

**Request Model Updates**:
```prisma
model Request {
  id                String      @id @default(cuid())
  requestDate       DateTime    @db.Date
  centerCarNo       String?     @db.VarChar(50)  // Optional, for communication only
  vehicleTon        Decimal     @db.Decimal(3,1)
  regions           Json        // Array of region names
  stops             Int
  notes             String?
  extraAdjustment   Int         @default(0)
  adjustmentReason  String?     // Required when extraAdjustment != 0
  createdAt         DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt         DateTime    @updatedAt @db.Timestamptz(6)
  createdBy         String?
  
  // LoadingPoint relationship
  loadingPointId    String
  loadingPoint      LoadingPoint @relation(fields: [loadingPointId], references: [id])
  
  // Other relationships
  dispatches        Dispatch[]
  creator           User?       @relation("RequestCreator", fields: [createdBy], references: [id])
  
  @@index([loadingPointId])
  @@index([requestDate])
  @@index([centerCarNo])
  @@index([createdAt])
  @@map("requests")
}
```

### Migration Strategy

**Phase 1: Schema Migration**
- Update LoadingPoint model to consolidate name fields
- Update Request model to use loadingPointId FK
- Remove separate Center table if created
- Maintain all existing relationships

**Phase 2: Data Migration**
- Consolidate centerName + loadingPointName into unified name field
- Map existing center data to LoadingPoint records
- Update Request records to use proper loadingPointId references
- Validate all relationships are intact

**Phase 3: API Updates**
- Update all APIs to use LoadingPoint instead of Center
- Maintain backward compatibility for Excel import/export
- Update validation logic for new field requirements

**Phase 4: UI Updates**
- Replace center dropdown with LoadingPoint selector
- Update display components to show unified center names
- Ensure all forms use proper loadingPointId references

### Integration Points

- **Center Fares System**: Update to use LoadingPoint.name for center identification
- **Fixed Contracts**: No changes required (already uses LoadingPoint)
- **Route Templates**: No changes required (already uses LoadingPoint)
- **Driver Management**: Maintain existing integration
- **Settlement System**: Prepare for future integration using LoadingPoint references

## Success Criteria

- [ ] LoadingPoint properly consolidated as unified center entity
- [ ] Request-LoadingPoint relationships functioning correctly
- [ ] All existing FixedContract and RouteTemplate relationships preserved
- [ ] Excel import/export working with proper center name mapping
- [ ] Request creation and management functionality
- [ ] Dispatch assignment and tracking
- [ ] Integration with center_fares calculation engine
- [ ] Responsive UI components for all screen sizes
- [ ] Comprehensive API coverage for all operations
- [ ] Successful migration maintaining data integrity
- [ ] Performance meets user experience requirements

## Migration Rollback Plan

- Maintain backup of current schema and data
- Document all changes for potential rollback
- Test migration in staging environment first
- Implement gradual rollout with monitoring
- Prepare rollback scripts for emergency use
