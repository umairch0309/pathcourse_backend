# Admin Profile API

## Get Admin Profile

**Endpoint:**
```
GET /admin/profile
```

**Description:**
Fetches the current admin's profile information. Only accessible by users with the `admin` or `team_admin` role and the appropriate permission.

**Permissions Required:**
- Role: `admin` or `team_admin`
- Permission: `SETTINGS_VIEW`

**Response:**
- 200 OK
```json
{
  "message": "Admin profile retrieved successfully",
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "image": "string | null",
    "phone": "string | null",
    "role": "string | null",
    "createdAt": "ISO8601 string",
    "updatedAt": "ISO8601 string"
  }
}
```
- 401 Unauthorized
- 403 Forbidden

**Example Request:**
```
GET /admin/profile
Authorization: Bearer <token>
```

**Example Success Response:**
```json
{
  "message": "Admin profile retrieved successfully",
  "success": true,
  "data": {
    "id": "clxyz12345",
    "name": "Admin User",
    "email": "admin@example.com",
    "image": "https://s3.example.com/profile.jpg",
    "phone": "+1234567890",
    "role": "admin",
    "createdAt": "2026-01-29T12:00:00.000Z",
    "updatedAt": "2026-01-29T12:00:00.000Z"
  }
}
```

---

## Update Admin Profile

**Endpoint:**
```
PUT /admin/profile
```

See existing documentation for update details.
