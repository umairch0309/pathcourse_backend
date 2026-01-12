/**
 * Generates a unique alphanumeric employee code suffix
 * Format: 6 characters (uppercase letters and numbers)
 * Example: A1B2C3
 */
function generateEmployeeCodeSuffix(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * Generates a unique employee code with enterprise code prefix
 * Format: {enterpriseCode}-{6-character-suffix}
 * Example: ENT001-A1B2C3
 * @param enterpriseCode - The enterprise code to use as prefix
 * @param maxAttempts - Maximum number of attempts to generate a unique code (default: 10)
 */
export async function generateUniqueEmployeeCode(
  enterpriseCode: string,
  maxAttempts: number = 10
): Promise<string> {
  const prisma = (await import('~/lib/prisma')).default

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const suffix = generateEmployeeCodeSuffix()
    const employeeCode = `${enterpriseCode}-${suffix}`

    // Check if this employee code already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        employeeCode,
      },
    })

    if (!existingUser) {
      return employeeCode
    }
  }

  // If we couldn't generate a unique code after max attempts, throw an error
  throw new Error('Failed to generate unique employee code after multiple attempts')
}
