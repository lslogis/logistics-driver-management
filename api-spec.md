# API Specification

## Authentication & Authorization

All endpoints require authentication via JWT token. Role-based access control (RBAC) is enforced based on user roles:
- **ADMIN**: Full access to all resources
- **DISPATCHER**: Create/read/update drivers, routes, trips
- **ACCOUNTANT**: Read drivers, routes, trips; create/read/update settlements

## Common Response Formats

### Success Response (200/201)
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

### Error Response (400/404/409/500)
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human readable error message"
}
```

---

## Drivers API

### GET /api/drivers
**Description**: 기사 목록 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Query Parameters**:
```typescript
{
  page?: string;           // Default: "1"
  limit?: string;          // Default: "20", max: "100"
  search?: string;         // Name, phone, company search
  isActive?: string;       // "true" | "false"
  sortBy?: "name" | "phone" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
```
**Responses**:
- **200**: List of drivers with pagination
- **400**: Invalid query parameters
- **401**: Authentication required

### GET /api/drivers/:id
**Description**: 기사 상세 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Path Parameters**: `id: string (uuid)`  
**Responses**:
- **200**: Driver details
- **404**: Driver not found
- **401**: Authentication required

### POST /api/drivers
**Description**: 기사 등록  
**RBAC**: ADMIN, DISPATCHER  
**Request Body**:
```typescript
{
  name: string;                    // Required, max 50 chars
  phone: string;                   // Required, format: /^010-\d{4}-\d{4}$/
  email?: string;                  // Optional, valid email format
  businessNumber?: string;         // Optional, format: /^\d{3}-\d{2}-\d{5}$/
  companyName?: string;           // Optional, max 100 chars
  representativeName?: string;     // Optional, max 50 chars
  bankName?: string;              // Optional, max 50 chars
  accountNumber?: string;         // Optional, max 50 chars
  remarks?: string;               // Optional, max 1000 chars
}
```
**Responses**:
- **201**: Driver created successfully
- **400**: Validation error
- **409**: Phone number already exists
- **401**: Authentication required

### PUT /api/drivers/:id
**Description**: 기사 정보 수정  
**RBAC**: ADMIN, DISPATCHER  
**Path Parameters**: `id: string (uuid)`  
**Request Body**: Same as POST but all fields optional  
**Responses**:
- **200**: Driver updated successfully
- **400**: Validation error
- **404**: Driver not found
- **409**: Phone number conflict
- **401**: Authentication required

### DELETE /api/drivers/:id
**Description**: 기사 삭제 (소프트 삭제)  
**RBAC**: ADMIN  
**Path Parameters**: `id: string (uuid)`  
**Responses**:
- **200**: Driver deactivated successfully
- **400**: Cannot delete driver with active vehicles/trips
- **404**: Driver not found
- **401**: Authentication required

---

## Vehicles API

### GET /api/vehicles
**Description**: 차량 목록 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Query Parameters**:
```typescript
{
  page?: string;
  limit?: string;
  search?: string;           // Plate number, type, driver name search
  vehicleType?: string;      // Vehicle type filter
  ownership?: "OWNED" | "CHARTER" | "CONSIGNED";
  isActive?: string;         // "true" | "false"
  driverId?: string;         // Filter by assigned driver
  sortBy?: "plateNumber" | "vehicleType" | "ownership" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
```
**Responses**:
- **200**: List of vehicles with pagination
- **400**: Invalid query parameters

### GET /api/vehicles/:id
**Description**: 차량 상세 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Path Parameters**: `id: string (uuid)`  
**Responses**:
- **200**: Vehicle details
- **404**: Vehicle not found

### POST /api/vehicles
**Description**: 차량 등록  
**RBAC**: ADMIN  
**Request Body**:
```typescript
{
  plateNumber: string;             // Required, Korean plates: /^[가-힣0-9]+$/
  vehicleType: string;            // Required, max 50 chars
  ownership: "OWNED" | "CHARTER" | "CONSIGNED";
  driverId?: string;              // Optional, UUID
  year?: number;                  // Optional, >= 1980, <= current year + 1
  capacity?: number;              // Optional, positive, <= 100
  isActive?: boolean;             // Default: true
}
```
**Responses**:
- **201**: Vehicle created successfully
- **400**: Validation error
- **409**: Plate number already exists
- **404**: Driver not found (if driverId provided)

### PUT /api/vehicles/:id
**Description**: 차량 정보 수정  
**RBAC**: ADMIN  
**Request Body**: Same as POST but all fields optional  
**Responses**:
- **200**: Vehicle updated successfully
- **400**: Validation error
- **404**: Vehicle not found
- **409**: Plate number conflict

### DELETE /api/vehicles/:id
**Description**: 차량 삭제 (소프트 삭제)  
**RBAC**: ADMIN  
**Responses**:
- **200**: Vehicle deactivated successfully
- **400**: Cannot delete vehicle with active trips
- **404**: Vehicle not found

---

## Routes API

### GET /api/routes
**Description**: 노선 목록 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Query Parameters**:
```typescript
{
  page?: string;
  limit?: string;
  search?: string;              // Name, loading/unloading point search
  isActive?: string;
  defaultDriverId?: string;     // Filter by assigned driver
  weekday?: string;            // Filter by weekday (0-6)
  sortBy?: "name" | "loadingPoint" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
```
**Responses**:
- **200**: List of routes with pagination
- **400**: Invalid query parameters

### GET /api/routes/:id
**Description**: 노선 상세 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Responses**:
- **200**: Route details
- **404**: Route not found

### POST /api/routes
**Description**: 노선 등록  
**RBAC**: ADMIN, DISPATCHER  
**Request Body**:
```typescript
{
  name: string;                    // Required, max 100 chars, unique
  loadingPoint: string;           // Required, max 200 chars
  unloadingPoint: string;         // Required, max 200 chars
  distance?: number;              // Optional, positive, max 2000km
  driverFare: number;             // Required, positive, max 10M
  billingFare: number;            // Required, positive, max 10M
  weekdayPattern: number[];       // Required, array of 0-6 (0=Sunday)
  defaultDriverId?: string;       // Optional, UUID
  isActive?: boolean;             // Default: true
}
```
**Responses**:
- **201**: Route created successfully
- **400**: Validation error
- **409**: Route name already exists
- **404**: Driver not found (if defaultDriverId provided)

### PUT /api/routes/:id
**Description**: 노선 정보 수정  
**RBAC**: ADMIN, DISPATCHER  
**Request Body**: Same as POST but all fields optional  
**Responses**:
- **200**: Route updated successfully
- **400**: Validation error
- **404**: Route not found
- **409**: Route name conflict

### DELETE /api/routes/:id
**Description**: 노선 삭제 (소프트 삭제)  
**RBAC**: ADMIN  
**Responses**:
- **200**: Route deactivated successfully
- **400**: Cannot delete route with active trips
- **404**: Route not found

---

## Trips API

### GET /api/trips
**Description**: 운행 목록 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Query Parameters**:
```typescript
{
  page?: string;
  limit?: string;
  search?: string;                      // Driver name, vehicle plate search
  status?: "SCHEDULED" | "COMPLETED" | "ABSENCE" | "SUBSTITUTE";
  driverId?: string;                    // Filter by driver
  vehicleId?: string;                   // Filter by vehicle
  routeTemplateId?: string;            // Filter by route
  dateFrom?: string;                   // ISO date string
  dateTo?: string;                     // ISO date string
  sortBy?: "date" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
```
**Responses**:
- **200**: List of trips with pagination
- **400**: Invalid query parameters

### GET /api/trips/:id
**Description**: 운행 상세 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Responses**:
- **200**: Trip details
- **404**: Trip not found

### POST /api/trips
**Description**: 운행 등록  
**RBAC**: ADMIN, DISPATCHER  
**Request Body**:
```typescript
{
  date: string;                    // Required, ISO date string
  driverId: string;               // Required, UUID
  vehicleId: string;              // Required, UUID
  routeTemplateId?: string;       // Optional, UUID (for template-based)
  
  // Custom route (if routeTemplateId not provided)
  loadingPoint?: string;          // Required if no template, max 200 chars
  unloadingPoint?: string;        // Required if no template, max 200 chars
  distance?: number;              // Optional, positive, max 2000km
  
  driverFare: number;             // Required, positive, max 10M
  billingFare: number;            // Required, positive, max 10M
  status?: "SCHEDULED" | "COMPLETED" | "ABSENCE" | "SUBSTITUTE"; // Default: SCHEDULED
  
  deductionAmount?: number;       // Optional, for ABSENCE/SUBSTITUTE
  substituteDriverId?: string;    // Optional, UUID for SUBSTITUTE status
  remarks?: string;               // Optional, max 1000 chars
}
```
**Responses**:
- **201**: Trip created successfully
- **400**: Validation error
- **409**: Duplicate trip (same date/driver/route combination)
- **404**: Driver/vehicle/route not found

### PUT /api/trips/:id
**Description**: 운행 정보 수정  
**RBAC**: ADMIN, DISPATCHER  
**Request Body**: Same as POST but all fields optional  
**Responses**:
- **200**: Trip updated successfully
- **400**: Validation error
- **404**: Trip not found
- **409**: Conflict with existing trip

### DELETE /api/trips/:id
**Description**: 운행 삭제  
**RBAC**: ADMIN, DISPATCHER  
**Responses**:
- **200**: Trip deleted successfully
- **400**: Cannot delete completed trip with settlements
- **404**: Trip not found

---

## Settlements API

### GET /api/settlements
**Description**: 정산 목록 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Query Parameters**:
```typescript
{
  page?: string;
  limit?: string;
  yearMonth?: string;              // Format: YYYY-MM
  driverId?: string;               // Filter by driver
  status?: "DRAFT" | "CONFIRMED" | "PAID";
  sortBy?: "yearMonth" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
```
**Responses**:
- **200**: List of settlements with pagination
- **400**: Invalid query parameters

### POST /api/settlements/preview
**Description**: 정산 미리보기 계산  
**RBAC**: ADMIN, ACCOUNTANT  
**Request Body**:
```typescript
{
  driverId: string;               // Required, UUID
  yearMonth: string;              // Required, format: YYYY-MM
}
```
**Responses**:
- **200**: Settlement preview calculation
```json
{
  "driverId": "uuid",
  "yearMonth": "2024-12",
  "totalTrips": 25,
  "totalBaseFare": 1250000,
  "absenceDeduction": 50000,
  "substituteDeduction": 25000,
  "totalDeductions": 75000,
  "finalAmount": 1175000,
  "trips": [/* trip details */]
}
```
- **400**: Invalid parameters
- **404**: Driver not found

### POST /api/settlements/finalize
**Description**: 정산 확정  
**RBAC**: ADMIN, ACCOUNTANT  
**Request Body**:
```typescript
{
  settlementId: string;           // Required, UUID
}
```
**Responses**:
- **200**: Settlement finalized successfully
- **400**: Settlement already confirmed
- **404**: Settlement not found

### POST /api/settlements/export
**Description**: 정산 내역 엑셀 내보내기  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Request Body**:
```typescript
{
  yearMonth: string;              // Required, format: YYYY-MM
  driverIds?: string[];           // Optional, filter by drivers
}
```
**Responses**:
- **200**: Excel file download
- **400**: Invalid parameters

---

## Import API

### POST /api/import/drivers
**Description**: 기사 CSV 일괄 등록  
**RBAC**: ADMIN, ACCOUNTANT  
**Request Body**: `multipart/form-data`
```typescript
{
  file: File;                     // CSV file
  validateOnly?: boolean;         // Default: false, true for validation only
}
```
**CSV Format**:
```csv
name,phone,email,businessNumber,companyName,representativeName,bankName,accountNumber,remarks
김철수,010-1234-5678,kim@example.com,123-45-67890,김철수운송,김철수,국민은행,123-456-789,비고사항
```
**Responses**:
- **200**: Import completed successfully
```json
{
  "imported": 15,
  "errors": 2,
  "details": [
    { "row": 3, "error": "이미 등록된 전화번호입니다" },
    { "row": 7, "error": "올바르지 않은 전화번호 형식입니다" }
  ]
}
```
- **400**: Invalid file format or validation errors

### POST /api/import/trips
**Description**: 운행 CSV 일괄 등록  
**RBAC**: ADMIN, DISPATCHER  
**Request Body**: `multipart/form-data`
```typescript
{
  file: File;                     // CSV file
  validateOnly?: boolean;         // Default: false
}
```
**CSV Format**:
```csv
date,driverPhone,vehiclePlateNumber,routeName,status,deductionAmount,remarks
2024-12-01,010-1234-5678,12가3456,서울-부산,COMPLETED,,정상운행
2024-12-01,010-2345-6789,23나4567,인천-대구,ABSENCE,50000,병가
```
**Responses**:
- **200**: Import completed successfully
- **400**: Invalid file format or validation errors

---

## Error Codes

### 400 Bad Request
- Invalid request body format
- Validation errors (field format, length, etc.)
- Missing required fields

### 401 Unauthorized
- No authentication token provided
- Invalid or expired JWT token
- Account is inactive

### 403 Forbidden
- Insufficient permissions for the requested action
- RBAC rule violation

### 404 Not Found
- Resource not found (driver, vehicle, route, trip, settlement)

### 409 Conflict
- Unique constraint violation (phone number, plate number, route name)
- Business logic conflict (duplicate trip, settlement already confirmed)

### 500 Internal Server Error
- Database connection error
- Unexpected server error
- External service failure

---

## Rate Limiting

- **General API**: 1000 requests/hour per user
- **Import API**: 10 requests/hour per user
- **Export API**: 100 requests/hour per user

## Pagination

All list endpoints support pagination:
```json
{
  "data": {
    "items": [/* array of items */],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```