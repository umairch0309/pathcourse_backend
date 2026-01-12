# Authentication API Documentation

This document provides comprehensive integration instructions for the Authentication API endpoints, including patient and doctor signup flows.

## Base URL

All endpoints are prefixed with `/api`:

```
Base URL: https://your-api-domain.com/api
```

## Authentication

- **Signup endpoints**: Public (no authentication required)
- **Other endpoints**: Authentication required via better-auth session

## Authentication Endpoints

### 1. Patient Signup

Sign up a new patient account with enterprise code validation and automatic employee code generation.

**Endpoint:** `POST /api/auth/patient/signup`

**Authentication:** Not required (public endpoint)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "enterpriseCode": "ENT001"
}
```

**Request Schema:**
- `name` (string, required): Patient name (1-100 characters)
- `email` (string, required): Valid email address
- `password` (string, required): Password (minimum 8 characters)
- `enterpriseCode` (string, required): Enterprise code (1-50 characters)

**Response (201 Created):**
```json
{
  "message": "Patient signed up successfully",
  "success": true,
  "data": {
    "id": "clx123...",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "patient",
    "enterpriseCode": "ENT001",
    "employeeCode": "ENT001-A1B2C3",
    "onboardingStage": "COMPLETED"
  }
}
```

**Error Responses:**

- **400 Bad Request**: Invalid enterprise code
  ```json
  {
    "message": "Invalid enterprise code",
    "success": false
  }
  ```

- **409 Conflict**: Email already exists
  ```json
  {
    "message": "Email already exists",
    "success": false
  }
  ```

- **422 Unprocessable Entity**: Validation error
  ```json
  {
    "message": "Validation failed",
    "errors": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
  ```

**Business Logic:**
1. Validates that the enterprise code exists in the database
2. Checks if the email is already registered
3. Generates a unique employee code in the format `{enterpriseCode}-{6-character-suffix}` (e.g., `ENT001-A1B2C3`)
4. Creates the user account with role set to "patient"
5. Sets onboarding stage to "COMPLETED" (patients skip role selection)
6. Associates the user with the enterprise via `enterpriseCode`

**Example Usage (JavaScript/TypeScript):**
```typescript
async function signupPatient(data: {
  name: string
  email: string
  password: string
  enterpriseCode: string
}) {
  const response = await fetch('/api/auth/patient/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to sign up patient')
  }

  const result = await response.json()
  return result.data
}

// Usage
const patient = await signupPatient({
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'securePassword123',
  enterpriseCode: 'ENT001'
})

console.log('Patient ID:', patient.id)
console.log('Employee Code:', patient.employeeCode) // e.g., "ENT001-A1B2C3"
```

**Example Usage (React Component):**
```tsx
import { useState } from 'react'

function PatientSignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    enterpriseCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/patient/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Signup failed')
      }

      const result = await response.json()
      console.log('Signup successful:', result.data)
      // Redirect to login or dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        minLength={8}
      />
      <input
        type="text"
        placeholder="Enterprise Code"
        value={formData.enterpriseCode}
        onChange={(e) => setFormData({ ...formData, enterpriseCode: e.target.value })}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

### 2. Doctor Signup

Sign up a new doctor account. Doctors are automatically assigned the "doctor" role upon signup.

**Endpoint:** `POST /api/auth/doctor/signup`

**Authentication:** Not required (public endpoint)

**Request Body:**
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane.smith@example.com",
  "password": "securePassword123"
}
```

**Request Schema:**
- `name` (string, required): Doctor name (1-100 characters)
- `email` (string, required): Valid email address
- `password` (string, required): Password (minimum 8 characters)

**Response (201 Created):**
```json
{
  "message": "Doctor signed up successfully",
  "success": true,
  "data": {
    "id": "clx456...",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@example.com",
    "role": "doctor",
    "onboardingStage": "ROLE_SELECTION"
  }
}
```

**Error Responses:**

- **409 Conflict**: Email already exists
  ```json
  {
    "message": "Email already exists",
    "success": false
  }
  ```

- **422 Unprocessable Entity**: Validation error
  ```json
  {
    "message": "Validation failed",
    "errors": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
  ```

**Business Logic:**
1. Checks if the email is already registered
2. Creates the user account with role set to "doctor"
3. Sets onboarding stage to "ROLE_SELECTION" (doctors may need to complete additional onboarding steps)

**Example Usage (JavaScript/TypeScript):**
```typescript
async function signupDoctor(data: {
  name: string
  email: string
  password: string
}) {
  const response = await fetch('/api/auth/doctor/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to sign up doctor')
  }

  const result = await response.json()
  return result.data
}

// Usage
const doctor = await signupDoctor({
  name: 'Dr. Jane Smith',
  email: 'jane.smith@example.com',
  password: 'securePassword123'
})

console.log('Doctor ID:', doctor.id)
console.log('Role:', doctor.role)
```

## Employee Code Generation

Patient signup automatically generates a unique alphanumeric employee code for each enterprise. The employee code:

- Format: `{enterpriseCode}-{6-character-suffix}`
- Contains the enterprise code as a prefix, followed by a hyphen, then a 6-character alphanumeric suffix
- The suffix contains uppercase letters (A-Z) and numbers (0-9)
- Is globally unique across all enterprises
- Format example: `ENT001-A1B2C3`

The system automatically checks for uniqueness and regenerates if a collision occurs (up to 10 attempts).

## Enterprise Code Validation

Before creating a patient account, the system validates that:

1. The enterprise code exists in the database
2. The enterprise is active and valid

If the enterprise code is invalid, the signup request will be rejected with a 400 Bad Request error.

## Role Assignment

- **Patients**: Automatically assigned `role: "patient"` during signup
- **Doctors**: Automatically assigned `role: "doctor"` during signup
- **Default role** (for other signup methods): `"guest"` (as configured in better-auth)

## Onboarding Stages

- **Patients**: Set to `"COMPLETED"` immediately after signup (no role selection needed)
- **Doctors**: Set to `"ROLE_SELECTION"` (may need to complete additional onboarding steps)

## Integration Notes

1. **Separate Signup Forms**: The API provides separate endpoints for patient and doctor signup, allowing you to create different signup forms for each user type.

2. **Enterprise Code**: Patients must provide a valid enterprise code during signup. Ensure your frontend validates this before submission or handles the error gracefully.

3. **Email Uniqueness**: Both endpoints check for email uniqueness. If an email is already registered, a 409 Conflict error will be returned.

4. **Password Requirements**: Minimum 8 characters. Consider adding additional validation on the frontend (e.g., complexity requirements).

5. **Session Management**: After successful signup, users can log in using the standard better-auth login endpoint at `/api/auth/sign-in/email`.

## Error Handling Best Practices

```typescript
async function handleSignup(data: SignupData, userType: 'patient' | 'doctor') {
  try {
    const endpoint = userType === 'patient'
      ? '/api/auth/patient/signup'
      : '/api/auth/doctor/signup'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()

      // Handle specific error cases
      if (response.status === 409) {
        // Email already exists
        return { error: 'This email is already registered. Please use a different email or try logging in.' }
      }

      if (response.status === 400 && userType === 'patient') {
        // Invalid enterprise code
        return { error: 'Invalid enterprise code. Please check and try again.' }
      }

      if (response.status === 422) {
        // Validation errors
        return { error: 'Please check your input and try again.', validationErrors: error.errors }
      }

      return { error: error.message || 'Signup failed. Please try again.' }
    }

    const result = await response.json()
    return { success: true, data: result.data }
  } catch (error) {
    return { error: 'Network error. Please check your connection and try again.' }
  }
}
```

## Related Endpoints

- **Login**: Use better-auth's standard login endpoint at `/api/auth/sign-in/email`
- **User Info**: After signup, users can update their profile information via `/api/user/info`
- **Doctor Profile**: Doctors can create/update their professional profile via `/api/doctor`

## Security Considerations

1. **Password Security**: Passwords are hashed using bcrypt before storage
2. **Email Verification**: Email verification can be enabled in better-auth configuration
3. **Rate Limiting**: Consider implementing rate limiting on signup endpoints to prevent abuse
4. **Enterprise Code Validation**: Enterprise codes are validated server-side to prevent unauthorized access

