# API Specification - Today's Endpoints

**Version**: 1.0.0  
**Base URL**: `http://localhost:3000/api`  
**Authentication**: Required (JWT Token via NextAuth)  
**Date**: 2024-12-10

---

## Common Response Format

All API responses follow this standardized structure:

```typescript
interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}
```

### Success Response (200/201)
```json
{
  "ok": true,
  "data": { /* response data */ }
}
```

### Error Response (400/404/409/500)
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error info */ }
  }
}
```

---

## Authentication

All endpoints require authentication via NextAuth JWT token:

```http
Authorization: Bearer <jwt_token>

# Or for testing/development:
x-user-id: <user_id>
x-user-role: ADMIN|DISPATCHER|ACCOUNTANT
x-user-name: <user_name>
x-user-email: <user_email>
```

### Common HTTP Status Codes
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

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
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "김철수",
        "phone": "010-1234-5678",
        "email": "kim@example.com",
        "businessNumber": "123-45-67890",
        "companyName": "김철수운송",
        "representativeName": "김철수",
        "bankName": "국민은행",
        "accountNumber": "123-456-789",
        "remarks": "비고사항",
        "isActive": true,
        "createdAt": "2024-12-10T00:00:00Z",
        "updatedAt": "2024-12-10T00:00:00Z"
      }
    ],
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
- **400**: Validation error (Zod)
- **401**: Authentication required

### GET /api/drivers/:id
**Description**: 기사 상세 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Path Parameters**: `id: string (uuid)`  
**Responses**:
- **200**: Driver details
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "김철수",
    "phone": "010-1234-5678",
    "email": "kim@example.com",
    "businessNumber": "123-45-67890",
    "companyName": "김철수운송",
    "representativeName": "김철수",
    "bankName": "국민은행",
    "accountNumber": "123-456-789",
    "remarks": "비고사항",
    "isActive": true,
    "createdAt": "2024-12-10T00:00:00Z",
    "updatedAt": "2024-12-10T00:00:00Z"
  }
}
```
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
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "김철수",
    "phone": "010-1234-5678",
    "email": "kim@example.com",
    "isActive": true,
    "createdAt": "2024-12-10T00:00:00Z"
  }
}
```
- **400**: Validation error (Zod)
- **409**: Phone number already exists
- **401**: Authentication required

### PUT /api/drivers/:id
**Description**: 기사 정보 수정  
**RBAC**: ADMIN, DISPATCHER  
**Path Parameters**: `id: string (uuid)`  
**Request Body**: Same as POST but all fields optional  
**Responses**:
- **200**: Driver updated successfully
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "김철수",
    "phone": "010-1234-5678",
    "updatedAt": "2024-12-10T00:00:00Z"
  }
}
```
- **400**: Validation error (Zod)
- **404**: Driver not found
- **409**: Phone number conflict
- **401**: Authentication required

### DELETE /api/drivers/:id
**Description**: 기사 삭제 (소프트 삭제)  
**RBAC**: ADMIN  
**Path Parameters**: `id: string (uuid)`  
**Responses**:
- **200**: Driver deactivated successfully
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "isActive": false,
    "updatedAt": "2024-12-10T00:00:00Z"
  }
}
```
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
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "plateNumber": "12가3456",
        "vehicleType": "1톤트럭",
        "ownership": "OWNED",
        "driverId": "uuid",
        "driver": {
          "name": "김철수",
          "phone": "010-1234-5678"
        },
        "year": 2020,
        "capacity": 1,
        "isActive": true,
        "createdAt": "2024-12-10T00:00:00Z",
        "updatedAt": "2024-12-10T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```
- **400**: Validation error (Zod)

### GET /api/vehicles/:id
**Description**: 차량 상세 조회  
**RBAC**: ADMIN, DISPATCHER, ACCOUNTANT  
**Path Parameters**: `id: string (uuid)`  
**Responses**:
- **200**: Vehicle details
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "plateNumber": "12가3456",
    "vehicleType": "1톤트럭",
    "ownership": "OWNED",
    "driverId": "uuid",
    "driver": {
      "name": "김철수",
      "phone": "010-1234-5678"
    },
    "year": 2020,
    "capacity": 1,
    "isActive": true,
    "createdAt": "2024-12-10T00:00:00Z",
    "updatedAt": "2024-12-10T00:00:00Z"
  }
}
```
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
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "plateNumber": "12가3456",
    "vehicleType": "1톤트럭",
    "ownership": "OWNED",
    "isActive": true,
    "createdAt": "2024-12-10T00:00:00Z"
  }
}
```
- **400**: Validation error (Zod)
- **409**: Plate number already exists
- **404**: Driver not found (if driverId provided)

### PUT /api/vehicles/:id
**Description**: 차량 정보 수정  
**RBAC**: ADMIN  
**Path Parameters**: `id: string (uuid)`  
**Request Body**: Same as POST but all fields optional  
**Responses**:
- **200**: Vehicle updated successfully
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "plateNumber": "12가3456",
    "vehicleType": "1톤트럭",
    "updatedAt": "2024-12-10T00:00:00Z"
  }
}
```
- **400**: Validation error (Zod)
- **404**: Vehicle not found
- **409**: Plate number conflict

### DELETE /api/vehicles/:id
**Description**: 차량 삭제 (소프트 삭제)  
**RBAC**: ADMIN  
**Path Parameters**: `id: string (uuid)`  
**Responses**:
- **200**: Vehicle deactivated successfully
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "isActive": false,
    "updatedAt": "2024-12-10T00:00:00Z"
  }
}
```
- **400**: Cannot delete vehicle with active trips
- **404**: Vehicle not found

---

## Error Codes

### 400 Bad Request (Zod Validation)
- Invalid request body format
- Field validation errors (format, length, type)
- Missing required fields
- Invalid query parameters

**Example Response**:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "전화번호 형식이 올바르지 않습니다",
    "details": {
      "field": "phone",
      "value": "010-123-456",
      "expected": "010-XXXX-XXXX format"
    }
  }
}
```

### 401 Unauthorized
- No authentication token provided
- Invalid or expired JWT token
- Account is inactive

### 403 Forbidden  
- Insufficient permissions for the requested action
- RBAC rule violation

### 404 Not Found
- Driver not found
- Vehicle not found  
- Resource does not exist

**Example Response**:
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "기사를 찾을 수 없습니다",
    "details": {
      "resourceType": "driver",
      "resourceId": "uuid"
    }
  }
}
```

### 409 Conflict
- Phone number already exists (drivers)
- Plate number already exists (vehicles)
- Unique constraint violation

**Example Response**:
```json
{
  "ok": false,
  "error": {
    "code": "CONFLICT",
    "message": "이미 등록된 전화번호입니다",
    "details": {
      "field": "phone",
      "value": "010-1234-5678",
      "conflictType": "unique_constraint"
    }
  }
}
```

### 500 Internal Server Error
- Database connection error
- Unexpected server error
- System failure

---

## Response Examples

### Pagination Structure
All list endpoints return paginated results:
```json
{
  "ok": true,
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

### Ownership Enum Values
For vehicles, the `ownership` field accepts these values:
- `"OWNED"` - 자사 차량
- `"CHARTER"` - 용차 
- `"CONSIGNED"` - 위탁