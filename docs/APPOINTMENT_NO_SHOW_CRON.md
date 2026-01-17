# Appointment No-Show Cron Job

This document describes the automated cron job that marks appointments as NO_SHOW when 20 minutes have passed since the scheduled time and the appointment hasn't been completed.

## Overview

The appointment no-show cron job automatically monitors all `BOOKED` appointments and marks them as `NO_SHOW` if:
1. The appointment has a `scheduledAt` time
2. 20 minutes have passed since `scheduledAt`
3. The appointment status is still `BOOKED` (not `COMPLETED`)

This ensures that appointments that are missed or not attended are automatically tracked without manual intervention.

## How It Works

### Cron Job Schedule

- **Check Frequency**: Every 5 minutes
- **No-Show Threshold**: 20 minutes after `scheduledAt`
- **Runs On**: Server startup and then every 5 minutes

### Process Flow

1. **Cron Job Execution**: The cron job runs every 5 minutes
2. **Query Appointments**: Finds all appointments where:
   - `status = 'BOOKED'`
   - `scheduledAt` is not null
   - `scheduledAt <= (current_time - 20 minutes)`
3. **Mark as NO_SHOW**: Updates all matching appointments to `status = 'NO_SHOW'`
4. **Restore Doctor Availability**: For each affected doctor, checks if they can be restored to available status (if no other active appointments exist)

## Implementation Details

### Service Method

**Location**: `src/services/appointment.service.ts`

**Method**: `markNoShowAppointments()`

```typescript
markNoShowAppointments: async () => {
  // Finds appointments past 20-minute mark
  // Updates them to NO_SHOW
  // Restores doctor availability if appropriate
  return {
    marked: number,        // Count of appointments marked
    appointments: Array    // Details of marked appointments
  }
}
```

### Cron Job Class

**Location**: `src/lib/appointment-no-show-cron.ts`

**Class**: `AppointmentNoShowCron`

- Singleton pattern
- Runs check every 5 minutes
- Executes immediately on startup
- Provides start/stop methods

### Startup Integration

**Location**: `src/index.ts`

The cron job is automatically started when the server starts:

```typescript
// Start appointment no-show cron job
appointmentNoShowCron.start()
```

## Example Scenarios

### Scenario 1: Patient Doesn't Show Up

1. **10:00 AM**: Appointment is created with `scheduledAt = 10:00 AM`, `status = 'BOOKED'`
2. **10:20 AM**: 20 minutes have passed, appointment is still `BOOKED`
3. **10:25 AM**: Cron job runs (every 5 minutes), detects appointment is past 20-minute mark
4. **Result**: Appointment status updated to `NO_SHOW`

### Scenario 2: Appointment Completed Before 20 Minutes

1. **10:00 AM**: Appointment is created with `scheduledAt = 10:00 AM`, `status = 'BOOKED'`
2. **10:10 AM**: Doctor marks appointment as `COMPLETED`
3. **10:20 AM**: 20 minutes have passed, but status is already `COMPLETED`
4. **Result**: Cron job skips this appointment (only checks `BOOKED` appointments)

### Scenario 3: Multiple Appointments for Same Doctor

1. **10:00 AM**: Doctor has 3 appointments scheduled
2. **10:20 AM**: All 3 appointments pass 20-minute mark without completion
3. **10:25 AM**: Cron job marks all 3 as `NO_SHOW`
4. **Result**: Doctor's availability is checked and restored if no other active appointments exist

## Doctor Availability Restoration

When appointments are marked as `NO_SHOW`, the cron job also:

1. Identifies all unique doctors affected by the no-show appointments
2. Calls `syncAvailabilityWithMeetingStatus()` for each doctor
3. This method checks if the doctor has any other active appointments within the next 15 minutes
4. If no active appointments exist and the doctor is not in a meeting, their availability is restored

**Important**: Doctor availability is only restored if:
- No other `BOOKED` appointments exist within the next 15 minutes
- Doctor is not currently in a meeting (`isInMeeting = false`)

## Logging

The cron job logs important events:

### Successful Marking
```
[No-Show Cron] Marked 3 appointment(s) as NO_SHOW. Appointment IDs: apt_123, apt_456, apt_789
[No-Show Cron] Check completed at 2026-01-14T10:25:00.000Z - Marked 3 appointment(s) as NO_SHOW
```

### No Appointments to Mark
```
// No log output (silent when no appointments need marking)
```

### Errors
```
[No-Show Cron] Error checking for no-show appointments: [error details]
[No-Show Cron] Error syncing availability for doctor doctor_123: [error details]
```

## Configuration

### Check Interval

The cron job checks every **5 minutes** by default. This can be modified in `src/lib/appointment-no-show-cron.ts`:

```typescript
private readonly checkIntervalMs = 5 * 60 * 1000 // 5 minutes
```

### No-Show Threshold

The threshold is **20 minutes** after `scheduledAt`. This is defined in `src/services/appointment.service.ts`:

```typescript
const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000) // 20 minutes
```

To change the threshold, modify this value in the `markNoShowAppointments()` method.

## Database Impact

### Appointment Updates

When appointments are marked as `NO_SHOW`:
- `status` field is updated from `'BOOKED'` to `'NO_SHOW'`
- `updatedAt` field is automatically updated (via Prisma `@updatedAt`)
- No other fields are modified

### Query Performance

The cron job uses an efficient query:
- Filters by `status = 'BOOKED'` (indexed)
- Filters by `scheduledAt <= twentyMinutesAgo` (indexed)
- Only selects necessary fields (`id`, `doctorId`, `patientId`, `scheduledAt`)

## Manual Override

If needed, appointments can still be manually marked as `NO_SHOW` using the existing API:

```
PATCH /api/appointment/{id}/status
{
  "status": "NO_SHOW"
}
```

The cron job will not re-mark appointments that are already `NO_SHOW` or `COMPLETED`.

## Monitoring

### Check Cron Job Status

The cron job logs when it starts:
```
[No-Show Cron] Starting - will check every 5 minutes for appointments past 20-minute mark
```

### Verify Appointments Marked

Check server logs for:
- `[No-Show Cron] Marked X appointment(s) as NO_SHOW`
- Appointment IDs that were marked

### Database Query

To manually check for appointments that should be marked:

```sql
SELECT id, doctorId, patientId, scheduledAt, status
FROM "Appointment"
WHERE status = 'BOOKED'
  AND "scheduledAt" IS NOT NULL
  AND "scheduledAt" <= NOW() - INTERVAL '20 minutes';
```

## Error Handling

The cron job includes comprehensive error handling:

1. **Service Method Errors**: Caught and logged, doesn't stop the cron job
2. **Doctor Availability Sync Errors**: Logged per doctor, doesn't affect other doctors
3. **Database Errors**: Caught and logged, cron job continues to next check

## Best Practices

1. **Monitor Logs**: Regularly check logs for errors or unexpected behavior
2. **Adjust Threshold**: Consider your appointment duration when setting the 20-minute threshold
3. **Check Frequency**: 5-minute intervals provide good balance between responsiveness and server load
4. **Manual Review**: Periodically review `NO_SHOW` appointments to identify patterns

## Troubleshooting

### Appointments Not Being Marked

1. **Check scheduledAt**: Ensure appointments have a valid `scheduledAt` value
2. **Check Status**: Verify appointments are still `BOOKED` (not already `COMPLETED` or `NO_SHOW`)
3. **Check Time**: Verify server time is correct (appointments are compared against server time)
4. **Check Logs**: Look for errors in cron job execution

### Doctor Availability Not Restored

1. **Check Other Appointments**: Doctor may have other active appointments
2. **Check Meeting Status**: Doctor may be in a meeting (`isInMeeting = true`)
3. **Check Logs**: Look for errors in availability sync

## Related Features

- **Appointment Status Management**: See `APPOINTMENT_BOOKING_IMPLEMENTATION.md`
- **Doctor Availability**: See `DOCTOR_AVAILABILITY_MANAGEMENT.md`
- **Appointment APIs**: See `APPOINTMENT_FETCH_APIS.md`

