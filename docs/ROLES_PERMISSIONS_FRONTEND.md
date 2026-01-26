# Roles and Permissions System - Frontend Guide

## Overview

The roles and permissions system allows administrators to:
- Create custom roles
- Assign specific permissions to roles
- Add team members with assigned roles
- Control access to admin features based on permissions

## Permission System

### Available Permissions

The system includes the following permissions:

| Permission Slug | Description |
|----------------|-------------|
| `dashboard.view` | View dashboard statistics and overview |
| `enterprise.add` | Create new enterprises |
| `enterprise.view` | View enterprises |
| `enterprise.update` | Update enterprise details |
| `enterprise.delete` | Delete enterprises |
| `specialists.view` | View specialists/doctors |
| `specialists.add` | Add new specialists/doctors |
| `specialists.block_unblock` | Block or unblock specialists/doctors |
| `specialists.accept_reject` | Accept or reject specialist/doctor requests |
| `users.view` | View users/patients |
| `sessions.view` | View appointments/sessions |
| `user_inquiries.view` | View user inquiries |
| `user_inquiries.delete` | Delete user inquiries |
| `settings.view` | View and manage settings |

## API Endpoints

### Permissions

#### Get All Permissions
```http
GET /api/admin/permissions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Permissions retrieved successfully",
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "perm_123",
        "name": "Dashboard View",
        "slug": "dashboard.view",
        "description": "View dashboard statistics and overview",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Get Permission by ID
```http
GET /api/admin/permissions/{id}
Authorization: Bearer <token>
```

#### Create Permission
```http
POST /api/admin/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Custom Permission",
  "slug": "custom.permission",
  "description": "Description of the permission"
}
```

#### Update Permission
```http
PATCH /api/admin/permissions/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Permission Name",
  "slug": "updated.permission",
  "description": "Updated description"
}
```

#### Delete Permission
```http
DELETE /api/admin/permissions/{id}
Authorization: Bearer <token>
```

### Roles

#### Get All Roles
```http
GET /api/admin/roles
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Roles retrieved successfully",
  "success": true,
  "data": {
    "roles": [
      {
        "id": "role_123",
        "name": "Manager",
        "description": "Manager role with limited permissions",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "permissions": [
          {
            "id": "perm_123",
            "name": "Dashboard View",
            "slug": "dashboard.view",
            "description": "View dashboard statistics"
          }
        ]
      }
    ]
  }
}
```

#### Get Role by ID
```http
GET /api/admin/roles/{id}
Authorization: Bearer <token>
```

#### Create Role
```http
POST /api/admin/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Manager",
  "description": "Manager role with limited permissions"
}
```

#### Update Role
```http
PATCH /api/admin/roles/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Role Name",
  "description": "Updated description"
}
```

#### Delete Role
```http
DELETE /api/admin/roles/{id}
Authorization: Bearer <token>
```

**Note:** Cannot delete a role that is assigned to team members.

#### Assign Permissions to Role
```http
POST /api/admin/roles/{id}/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionIds": ["perm_123", "perm_456", "perm_789"]
}
```

**Response:**
```json
{
  "message": "Permissions assigned successfully",
  "success": true,
  "data": {
    "id": "role_123",
    "name": "Manager",
    "description": "Manager role",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "permissions": [
      {
        "id": "perm_123",
        "name": "Dashboard View",
        "slug": "dashboard.view",
        "description": "View dashboard statistics"
      }
    ]
  }
}
```

### Team Members

#### Get All Team Members
```http
GET /api/admin/team-members
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Team members retrieved successfully",
  "success": true,
  "data": {
    "teamMembers": [
      {
        "id": "tm_123",
        "userId": "user_123",
        "user": {
          "id": "user_123",
          "name": "John Doe",
          "email": "john@example.com",
          "image": "https://...",
          "role": "admin",
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        "role": {
          "id": "role_123",
          "name": "Manager",
          "description": "Manager role",
          "permissions": [
            {
              "id": "perm_123",
              "name": "Dashboard View",
              "slug": "dashboard.view"
            }
          ]
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Get Team Member by User ID
```http
GET /api/admin/team-members/{userId}
Authorization: Bearer <token>
```

#### Add Team Member
```http
POST /api/admin/team-members
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123",
  "roleId": "role_123"
}
```

**Response:**
```json
{
  "message": "Team member created successfully",
  "success": true,
  "data": {
    "id": "tm_123",
    "userId": "user_456",
    "user": {
      "id": "user_456",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "image": null,
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "role": {
      "id": "role_123",
      "name": "Manager",
      "description": "Manager role",
      "permissions": [...]
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Team Member Role
```http
PATCH /api/admin/team-members/{userId}/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "role_456"
}
```

#### Remove Team Member
```http
DELETE /api/admin/team-members/{userId}
Authorization: Bearer <token>
```

**Note:** This removes the user from the team but keeps their user account. The user's role is set to `null`.

## Permission Checks in Admin Routes

All admin routes now check for specific permissions before allowing access:

| Route | Required Permission |
|-------|---------------------|
| `GET /api/admin/doctor-requests` | `specialists.view` |
| `POST /api/admin/doctor-requests/approve` | `specialists.accept_reject` |
| `POST /api/admin/doctor-requests/reject` | `specialists.accept_reject` |
| `GET /api/admin/doctors/approved` | `specialists.view` |
| `POST /api/admin/doctors` | `specialists.add` |
| `PATCH /api/admin/doctors/{doctorId}/block` | `specialists.block_unblock` |
| `PATCH /api/admin/doctors/{doctorId}/unblock` | `specialists.block_unblock` |
| `GET /api/admin/patients` | `users.view` |
| `GET /api/admin/patients/{patientId}` | `users.view` |
| `GET /api/admin/user-queries` | `user_inquiries.view` |
| `GET /api/admin/user-queries/{id}` | `user_inquiries.view` |
| `GET /api/admin/appointments` | `sessions.view` |
| `GET /api/admin/appointments/{id}` | `sessions.view` |
| `GET /api/admin/dashboard/stats` | `dashboard.view` |
| `GET /api/admin/dashboard/last-user-queries` | `dashboard.view` |
| `GET /api/admin/dashboard/last-appointments` | `dashboard.view` |
| `PATCH /api/admin/profile` | `settings.view` |
| `POST /api/enterprises` | `enterprise.add` |
| `GET /api/enterprises` | `enterprise.view` |
| `GET /api/enterprises/{id}` | `enterprise.view` |
| `PATCH /api/enterprises/{id}` | `enterprise.update` |
| `DELETE /api/enterprises/{id}` | `enterprise.delete` |

## Frontend Implementation

### Checking User Permissions

You can check if a user has a specific permission by calling:

```typescript
// Get all permissions for the current user
const response = await fetch('/api/admin/team-members/{userId}', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

const { data } = await response.json()
const userPermissions = data.role.permissions.map(p => p.slug)

// Check if user has permission
const hasPermission = userPermissions.includes('dashboard.view')
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react'

interface Permission {
  id: string
  name: string
  slug: string
  description: string | null
}

interface Role {
  id: string
  name: string
  description: string | null
  permissions: Permission[]
}

interface TeamMember {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
    role: string | null
    createdAt: string
  }
  role: Role
  createdAt: string
  updatedAt: string
}

export function useUserPermissions(userId: string | null) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchPermissions() {
      try {
        const response = await fetch(`/api/admin/team-members/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch permissions')
        }

        const { data } = await response.json()
        const permissionSlugs = data.role.permissions.map((p: Permission) => p.slug)
        setPermissions(permissionSlugs)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [userId])

  const hasPermission = (slug: string) => {
    return permissions.includes(slug)
  }

  return { permissions, hasPermission, loading, error }
}
```

### Usage in Components

```typescript
import { useUserPermissions } from './hooks/useUserPermissions'

function Dashboard() {
  const userId = useAuth().user?.id
  const { hasPermission, loading } = useUserPermissions(userId)

  if (loading) {
    return <div>Loading...</div>
  }

  if (!hasPermission('dashboard.view')) {
    return <div>You don't have permission to view the dashboard</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

### Permission-Based Route Protection

```typescript
import { Navigate } from 'react-router-dom'
import { useUserPermissions } from './hooks/useUserPermissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission: string
  userId: string | null
}

function ProtectedRoute({ children, requiredPermission, userId }: ProtectedRouteProps) {
  const { hasPermission, loading } = useUserPermissions(userId)

  if (loading) {
    return <div>Loading...</div>
  }

  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

// Usage
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute requiredPermission="dashboard.view" userId={user?.id}>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Conditional Rendering Based on Permissions

```typescript
function AdminPanel() {
  const userId = useAuth().user?.id
  const { hasPermission } = useUserPermissions(userId)

  return (
    <div>
      <h1>Admin Panel</h1>

      {hasPermission('enterprise.view') && (
        <Link to="/admin/enterprises">Enterprises</Link>
      )}

      {hasPermission('specialists.view') && (
        <Link to="/admin/doctors">Doctors</Link>
      )}

      {hasPermission('users.view') && (
        <Link to="/admin/patients">Patients</Link>
      )}

      {hasPermission('sessions.view') && (
        <Link to="/admin/appointments">Appointments</Link>
      )}

      {hasPermission('user_inquiries.view') && (
        <Link to="/admin/inquiries">Inquiries</Link>
      )}

      {hasPermission('settings.view') && (
        <Link to="/admin/settings">Settings</Link>
      )}
    </div>
  )
}
```

## Error Handling

When a user tries to access a route without the required permission, they will receive a `403 Forbidden` response:

```json
{
  "message": "You do not have permission to perform this action. Required permission: dashboard.view",
  "success": false
}
```

Handle this in your frontend:

```typescript
try {
  const response = await fetch('/api/admin/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (response.status === 403) {
    const error = await response.json()
    // Show error message to user
    showError(error.message)
    // Redirect to unauthorized page
    navigate('/unauthorized')
  }
} catch (error) {
  // Handle other errors
}
```

## Workflow Example

### Creating a Role and Assigning Permissions

1. **Create a new role:**
```typescript
const createRole = async (name: string, description?: string) => {
  const response = await fetch('/api/admin/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, description })
  })
  return response.json()
}

const role = await createRole('Manager', 'Manager role with limited permissions')
```

2. **Get all available permissions:**
```typescript
const getPermissions = async () => {
  const response = await fetch('/api/admin/permissions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.json()
}

const { data } = await getPermissions()
const permissions = data.permissions
```

3. **Assign permissions to the role:**
```typescript
const assignPermissions = async (roleId: string, permissionIds: string[]) => {
  const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ permissionIds })
  })
  return response.json()
}

// Select permissions (e.g., from a checkbox list)
const selectedPermissionIds = [
  'perm_dashboard_view',
  'perm_enterprise_view',
  'perm_users_view'
]

await assignPermissions(role.id, selectedPermissionIds)
```

4. **Add a team member with the role:**
```typescript
const addTeamMember = async (name: string, email: string, password: string, roleId: string) => {
  const response = await fetch('/api/admin/team-members', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, email, password, roleId })
  })
  return response.json()
}

await addTeamMember('John Doe', 'john@example.com', 'securePassword123', role.id)
```

## Important Notes

1. **Permission Checks**: All admin routes now require both:
   - User role must be `'admin'`
   - User must have the specific permission for that route

2. **Team Members**: Only users who are added as team members (via `/api/admin/team-members`) will have permissions. Regular admin users without a team member record will not have access.

3. **Role Deletion**: You cannot delete a role that is assigned to any team members. First, remove or reassign all team members with that role.

4. **Permission Assignment**: When assigning permissions to a role, all existing permissions are replaced with the new set. To add permissions, include both existing and new permission IDs.

5. **User Creation**: When adding a team member, a new user account is created with:
   - Role set to `'admin'`
   - Team member record linking the user to the assigned role

6. **Permission Slugs**: Permission slugs are unique identifiers. Use the slugs from the `PERMISSION_SLUGS` constant for consistency.

## TypeScript Types

```typescript
// Permission types
interface Permission {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

// Role types
interface Role {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  permissions: Permission[]
}

// Team member types
interface TeamMember {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
    role: string | null
    createdAt: string
  }
  role: Role
  createdAt: string
  updatedAt: string
}

// API Response types
interface ApiResponse<T> {
  message: string
  success: boolean
  data: T
}

type PermissionsResponse = ApiResponse<{ permissions: Permission[] }>
type RolesResponse = ApiResponse<{ roles: Role[] }>
type TeamMembersResponse = ApiResponse<{ teamMembers: TeamMember[] }>
type SingleRoleResponse = ApiResponse<Role>
type SinglePermissionResponse = ApiResponse<Permission>
type SingleTeamMemberResponse = ApiResponse<TeamMember>
```

## Best Practices

1. **Cache Permissions**: Fetch user permissions once on login and cache them to avoid repeated API calls.

2. **Permission Constants**: Create a constants file for permission slugs:
```typescript
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  ENTERPRISE_ADD: 'enterprise.add',
  ENTERPRISE_VIEW: 'enterprise.view',
  // ... etc
} as const
```

3. **Error Boundaries**: Wrap permission-protected components in error boundaries to handle permission errors gracefully.

4. **Loading States**: Always show loading states while fetching permissions.

5. **Fallback UI**: Show appropriate fallback UI when users don't have permissions (e.g., "You don't have access to this feature").

6. **Permission Groups**: Group related permissions in your UI for better UX:
   - Dashboard: `dashboard.view`
   - Enterprise Management: `enterprise.add`, `enterprise.view`, `enterprise.update`, `enterprise.delete`
   - Specialist Management: `specialists.view`, `specialists.add`, `specialists.block_unblock`, `specialists.accept_reject`
   - User Management: `users.view`
   - Session Management: `sessions.view`
   - Inquiry Management: `user_inquiries.view`, `user_inquiries.delete`
   - Settings: `settings.view`

## Migration Notes

If you have existing admin users, you'll need to:
1. Create roles with appropriate permissions
2. Add existing admin users as team members with assigned roles
3. Ensure all admin routes are protected with permission checks

The system maintains backward compatibility - users with `role: 'admin'` can still access routes, but they must also have the required permissions through their team member role.

