/**
 * Helper functions to anonymize user data when anonymous mode is enabled
 * For patients with isAnonymous = true, only employeeCode is shown
 */

interface UserData {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
  employeeCode?: string | null
  isAnonymous?: boolean | null
}

/**
 * Format user data, masking sensitive information if user is anonymous
 * Only applies to patients with isAnonymous = true
 */
export function formatUserForResponse(user: UserData, isViewingOwnData = false): {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string | null
  employeeCode: string | null
} {
  // If viewing own data, always show full info (users can see their own data)
  if (isViewingOwnData) {
    return {
      id: user.id,
      name: user.name || null,
      email: user.email || null,
      image: user.image || null,
      role: user.role || null,
      employeeCode: user.employeeCode || null,
    }
  }

  // If patient is anonymous, mask name and email
  if (user.role === 'patient' && user.isAnonymous === true) {
    return {
      id: user.id,
      name: null, // Hide name
      email: null, // Hide email
      image: null, // Hide image
      role: user.role || null,
      employeeCode: user.employeeCode || null, // Only show employee code
    }
  }

  // Non-anonymous users or non-patients: show all data
  return {
    id: user.id,
    name: user.name || null,
    email: user.email || null,
    image: user.image || null,
    role: user.role || null,
    employeeCode: user.employeeCode || null,
  }
}

/**
 * Format user data for appointment responses
 * Patient data is anonymized if patient has isAnonymous = true
 * Doctor data is always shown
 * employeeCode is always shown for patients (even when anonymous) so doctors can identify them
 */
export function formatUserForAppointment(user: UserData, userRole: 'doctor' | 'patient', isViewingOwnData = false): {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string | null
  employeeCode: string | null
} {
  // If viewing own data, always show full info
  if (isViewingOwnData) {
    return {
      id: user.id,
      name: user.name || null,
      email: user.email || null,
      image: user.image || null,
      role: user.role || null,
      employeeCode: user.employeeCode || null,
    }
  }

  // For appointments: always show doctor info, anonymize patient if anonymous
  if (userRole === 'doctor') {
    // Doctors are never anonymized in appointment context
    return {
      id: user.id,
      name: user.name || null,
      email: user.email || null,
      image: user.image || null,
      role: user.role || null,
      employeeCode: user.employeeCode || null,
    }
  }

  // Patient: anonymize if isAnonymous = true, but always show employeeCode
  if (user.isAnonymous === true) {
    return {
      id: user.id,
      name: null, // Hide name
      email: null, // Hide email
      image: null, // Hide image
      role: user.role || null,
      employeeCode: user.employeeCode || null, // Always show employee code for identification
    }
  }

  // Non-anonymous patient: show all data
  return {
    id: user.id,
    name: user.name || null,
    email: user.email || null,
    image: user.image || null,
    role: user.role || null,
    employeeCode: user.employeeCode || null,
  }
}

