# API Specification

## Settlement APIs

### GET /api/settlements

Retrieve settlements for a specific month and optionally filter by driver.

**Query Parameters:**
- `yearMonth` (required): Format YYYY-MM
- `driverId` (optional): Filter by specific driver

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "yearMonth": "2024-01",
      "driverId": "string",
      "driver": {
        "id": "string",
        "name": "string",
        "phone": "string",
        "bankName": "string",
        "accountNumber": "string"
      },
      "status": "DRAFT|CONFIRMED|PAID",
      "totalTrips": 25,
      "totalBaseFare": 1500000,
      "totalDeductions": 50000,
      "totalAdditions": 100000,
      "finalAmount": 1550000,
      "confirmedAt": "2024-01-31T00:00:00Z",
      "items": []
    }
  ],
  "summary": {
    "total": 10,
    "draft": 5,
    "confirmed": 3,
    "paid": 2
  }
}
```

### POST /api/settlements/preview

Generate a preview of settlements before finalization.

**Request Body:**
```json
{
  "yearMonth": "2024-01",
  "driverId": "optional-driver-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "previews": [
      {
        "driverId": "string",
        "driver": {
          "id": "string",
          "name": "string",
          "phone": "string"
        },
        "yearMonth": "2024-01",
        "totalTrips": 25,
        "totalBaseFare": 1500000,
        "totalDeductions": 50000,
        "totalAdditions": 100000,
        "finalAmount": 1550000,
        "trips": []
      }
    ],
    "existingSettlements": {
      "driver-id": "CONFIRMED"
    },
    "summary": {
      "totalDrivers": 10,
      "totalAmount": 15500000,
      "hasExisting": false
    }
  }
}
```

### POST /api/settlements/finalize

Finalize and lock settlements for a period.

**Request Body:**
```json
{
  "yearMonth": "2024-01",
  "driverId": "optional-driver-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settlements": [
      {
        "id": "string",
        "driverId": "string",
        "yearMonth": "2024-01",
        "status": "CONFIRMED",
        "totalTrips": 25,
        "finalAmount": 1550000,
        "confirmedAt": "2024-01-31T00:00:00Z"
      }
    ],
    "summary": {
      "totalSettlements": 10,
      "totalAmount": 15500000
    }
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Settlement already confirmed for this period",
  "existing": [
    {
      "driverId": "string",
      "status": "CONFIRMED",
      "confirmedAt": "2024-01-31T00:00:00Z"
    }
  ]
}
```

### POST /api/settlements/export

Export settlements to Excel format (stub implementation).

**Request Body:**
```json
{
  "yearMonth": "2024-01",
  "driverId": "optional-driver-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "format": "excel_stub",
    "filename": "settlements_2024-01.xlsx",
    "sheets": {
      "Summary": [],
      "Details": []
    },
    "metadata": {
      "exportedAt": "2024-01-31T12:00:00Z",
      "exportedBy": "user@email.com",
      "recordCount": 10
    }
  }
}
```

## Import APIs

### POST /api/import/drivers

Import drivers from CSV file.

**Request:** Form data with file field
- `file`: CSV file with driver data

**CSV Format:**
```csv
name,phone,email,businessNumber,companyName,representativeName,bankName,accountNumber,remarks,isActive
John Doe,010-1234-5678,john@email.com,123-45-67890,Company A,Rep Name,Bank Name,1234567890,Notes,true
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "imported": 10,
    "drivers": [
      {
        "id": "string",
        "name": "John Doe",
        "phone": "010-1234-5678",
        "email": "john@email.com"
      }
    ],
    "audit": {
      "timestamp": "2024-01-31T12:00:00Z",
      "filename": "drivers.csv",
      "importedBy": "user@email.com"
    }
  }
}
```

**Response (Validation Errors):**
```json
{
  "success": false,
  "simulation": true,
  "data": {
    "totalRows": 10,
    "validRows": 8,
    "errorRows": 2,
    "errors": [
      {
        "row": 3,
        "data": {},
        "error": "Phone number 010-1234-5678 already exists"
      }
    ]
  }
}
```

### POST /api/import/trips

Import trips from CSV file.

**Request:** Form data with file field
- `file`: CSV file with trip data

**CSV Format:**
```csv
date,driverPhone,vehiclePlateNumber,routeTemplateName,status,driverFare,billingFare,absenceReason,deductionAmount,substituteDriverPhone,substituteFare,remarks
2024-01-15,010-1234-5678,12가3456,Route A,COMPLETED,50000,60000,,,,Notes
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "imported": 50,
    "trips": [
      {
        "id": "string",
        "date": "2024-01-15",
        "driver": "John Doe",
        "vehicle": "12가3456",
        "route": "Route A",
        "status": "COMPLETED"
      }
    ],
    "audit": {
      "timestamp": "2024-01-31T12:00:00Z",
      "filename": "trips.csv",
      "importedBy": "user@email.com"
    }
  }
}
```

**Response (Validation with Duplicates):**
```json
{
  "success": false,
  "simulation": true,
  "data": {
    "totalRows": 50,
    "validRows": 45,
    "errorRows": 3,
    "duplicateRows": 2,
    "errors": [],
    "duplicates": [
      {
        "row": 5,
        "data": {},
        "error": "Trip already exists for vehicle 12가3456 on 2024-01-15",
        "existingId": "trip-id"
      }
    ],
    "summary": {
      "canImport": 45,
      "blocked": 5
    }
  }
}
```

## Health Check API

### GET /admin/health

Check system health and status.

**Response (Healthy):**
```json
{
  "ok": true,
  "status": "healthy",
  "version": "1.0.0",
  "migrated": true,
  "now": "2024-01-31T12:00:00Z",
  "details": {
    "database": {
      "connected": true,
      "migrated": true,
      "lastMigration": {
        "name": "20240101_initial",
        "appliedAt": "2024-01-01T00:00:00Z"
      }
    },
    "application": {
      "version": "1.0.0",
      "nodeVersion": "v18.17.0",
      "platform": "linux",
      "uptime": 3600,
      "memoryUsage": {}
    },
    "environment": {
      "nodeEnv": "production",
      "hasDatabase": true,
      "hasNextAuth": true
    },
    "timestamp": {
      "now": "2024-01-31T12:00:00Z",
      "timezone": "Asia/Seoul"
    },
    "entities": {
      "drivers": 100,
      "vehicles": 50,
      "trips": 1500,
      "settlements": 300
    }
  },
  "checks": {
    "database": "OK",
    "migrations": "OK",
    "environment": "PRODUCTION"
  }
}
```

**Response (Unhealthy):**
```json
{
  "ok": false,
  "status": "unhealthy",
  "version": "1.0.0",
  "migrated": false,
  "now": "2024-01-31T12:00:00Z",
  "checks": {
    "database": "FAILED",
    "migrations": "PENDING",
    "environment": "DEVELOPMENT"
  }
}
```

**HTTP Status Codes:**
- 200: System is healthy
- 503: System is unhealthy or experiencing issues

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message or array of errors"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Authentication

All API endpoints except `/admin/health` require authentication via NextAuth session cookies. Include the session cookie in all requests.

## Rate Limiting

- Default: 100 requests per minute per IP
- Import endpoints: 10 requests per minute per IP
- Export endpoints: 20 requests per minute per IP

## CORS

In production, CORS is configured to allow requests only from the application domain. In development, localhost origins are allowed.