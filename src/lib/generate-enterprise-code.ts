import prisma from '~/lib/prisma'

/**
 * Generates a 6-character code from enterprise name
 * Takes first 3 letters (uppercase) and adds 3 random numbers
 * Example: "Acme Corporation" -> "ACM123"
 */
function generateCodeFromName(name: string): string {
  // Remove special characters and spaces, convert to uppercase
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

  // Take first 3 letters (or pad if less than 3)
  let letters = cleaned.slice(0, 3)
  if (letters.length < 3) {
    letters = letters.padEnd(3, 'X')
  }

  // Generate 3 random numbers
  const numbers = Math.floor(100 + Math.random() * 900).toString() // 100-999

  return `${letters}${numbers}`
}

/**
 * Generates a unique enterprise code from name
 * Format: 3 letters (from name) + 3 numbers = 6 characters
 * Example: "Acme Corporation" -> "ACM123"
 * @param name - The enterprise name
 * @param maxAttempts - Maximum number of attempts to generate a unique code (default: 10)
 */
export async function generateUniqueEnterpriseCode(
  name: string,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateCodeFromName(name)

    // Check if this code already exists
    const existingEnterprise = await prisma.enterprise.findUnique({
      where: { code },
    })

    if (!existingEnterprise) {
      return code
    }

    // If code exists, try with different numbers
    const letters = code.slice(0, 3)
    const randomNumbers = Math.floor(100 + Math.random() * 900).toString()
    const newCode = `${letters}${randomNumbers}`

    const existingEnterprise2 = await prisma.enterprise.findUnique({
      where: { code: newCode },
    })

    if (!existingEnterprise2) {
      return newCode
    }
  }

  // If we couldn't generate a unique code after max attempts, throw an error
  throw new Error('Failed to generate unique enterprise code after multiple attempts')
}
