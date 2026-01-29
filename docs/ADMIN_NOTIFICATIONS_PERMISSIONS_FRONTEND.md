## Admin Notifications Permissions (Frontend)

This document explains how admin notifications are returned for:

- Super admin
- Team members with `notifications.view_all`
- Team members with `notifications.view_by_permission`

---

## Permissions

Two new permission slugs control admin notifications visibility:

- `notifications.view_all`
  - Can see **all** admin notifications (no filtering).
- `notifications.view_by_permission`
  - Can see **only** notification types that match permissions the team member already has.

If a team member has **both**, `notifications.view_all` wins.

---

## API Endpoint

### Get Admin Notifications

- **Method**: `GET`
- **URL**: `/api/admin/notifications`
- **Query params**:
  - `page` (string, optional, default `1`)
  - `limit` (string, optional, default `10`)
  - `isRead` (string, optional: `true` / `false`)

### Response

```ts
{
  message: 'Admin notifications retrieved successfully',
  success: true,
  data: {
    notifications: Array<{
      id: string,
      userId: string,
      title: string,
      url: string | null,
      message: string,
      isRead: boolean,
      createdAt: string, // ISO datetime
      updatedAt: string, // ISO datetime
    }>,
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number,
    },
  },
}
```

---

## Filtering Logic (view_by_permission)

When the viewer does **not** have `notifications.view_all`, the backend filters notifications by mapping the notification `title` (type) to a required permission slug.

Current mapping:

| Notification type (`title`) | Required permission to see it |
|----------------------------|-------------------------------|
| `DOCTOR_ONBOARDING_REQUEST` | `specialists.view` |
| `USER_INQUIRY` | `user_inquiries.view` |
| `APPOINTMENT_BOOKED` | `sessions.view` |
| `APPOINTMENT_COMPLETED` | `sessions.view` |
| `APPOINTMENT_NO_SHOW` | `sessions.view` |

Notes:

- If the viewer does not have the required permission slug, that notification type will not be returned.
- Message notifications (appointment chat) are currently **not** included in admin notifications filtering/mapping.

---

## Frontend Integration

### Recommended UI behavior

- If the admin user has `notifications.view_all`:
  - Show the full admin notification feed.
- Else if the admin user has `notifications.view_by_permission`:
  - Show the feed as returned (already filtered).
- Else:
  - Hide the notifications page/section (or show “No permission” state).

### Suggested permission checks (pseudo)

```ts
const canViewAll = permissions.includes('notifications.view_all')
const canViewFiltered = permissions.includes('notifications.view_by_permission')

const canSeeNotifications = canViewAll || canViewFiltered
```


