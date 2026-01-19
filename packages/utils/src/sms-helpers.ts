import twilio from 'twilio'

// Lazy initialization of Twilio client to ensure env vars are loaded
let twilioInstance: ReturnType<typeof twilio> | null = null

/**
 * Get or initialize Twilio client
 * @returns Twilio client instance
 * @throws Error if required environment variables are not set
 */
function getTwilioClient(): ReturnType<typeof twilio> {
  if (!twilioInstance) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error(
        'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are not set. SMS sending is disabled.'
      )
    }
    twilioInstance = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }
  return twilioInstance
}

/**
 * Format Australian phone number to E.164 format (+61...)
 * Handles various AU phone formats:
 * - 0412345678 -> +61412345678
 * - 04 1234 5678 -> +61412345678
 * - (04) 1234 5678 -> +61412345678
 * - +61412345678 (already formatted)
 *
 * @param phone - Phone number in various formats
 * @returns E.164 formatted phone number
 * @throws Error if phone number is invalid
 *
 * @example
 * ```typescript
 * formatPhoneNumberToE164('0412345678') // Returns: '+61412345678'
 * formatPhoneNumberToE164('04 1234 5678') // Returns: '+61412345678'
 * formatPhoneNumberToE164('+61412345678') // Returns: '+61412345678'
 * ```
 */
export function formatPhoneNumberToE164(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // If already in E.164 format (+61...), validate and return
  if (cleaned.startsWith('+61')) {
    if (cleaned.length !== 12) {
      throw new Error(`Invalid AU phone number: ${phone}. E.164 format should be +61 followed by 9 digits.`)
    }
    return cleaned
  }

  // If starts with 61 (without +), add the +
  if (cleaned.startsWith('61')) {
    cleaned = '+' + cleaned
    if (cleaned.length !== 12) {
      throw new Error(`Invalid AU phone number: ${phone}. Expected 9 digits after 61.`)
    }
    return cleaned
  }

  // If starts with 0, replace with +61
  if (cleaned.startsWith('0')) {
    cleaned = '+61' + cleaned.substring(1)
    if (cleaned.length !== 12) {
      throw new Error(`Invalid AU phone number: ${phone}. Expected 10 digits starting with 0.`)
    }
    return cleaned
  }

  throw new Error(
    `Invalid phone number format: ${phone}. Expected AU format (04XX XXX XXX) or E.164 (+61...)`
  )
}

/**
 * Interface for sending payment reminder SMS
 */
interface SendPaymentReminderSmsParams {
  to: string
  studentFirstName: string
  amount: number
  dueDate: string
  agencyName: string
}

/**
 * Result of sending a payment reminder SMS
 */
interface SendPaymentReminderSmsResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Sends a payment reminder SMS to a student
 * Message kept under 160 characters to avoid multi-part SMS charges
 *
 * @param params - The SMS parameters
 * @param params.to - Student phone number (will be converted to E.164)
 * @param params.studentFirstName - Student's first name
 * @param params.amount - Payment amount due
 * @param params.dueDate - Formatted due date string (e.g., "Jan 15")
 * @param params.agencyName - Name of the agency
 * @returns Promise resolving to send result with success status and message ID or error
 *
 * @example
 * ```typescript
 * const result = await sendPaymentReminderSms({
 *   to: '0412345678',
 *   studentFirstName: 'John',
 *   amount: 10000,
 *   dueDate: 'Dec 15',
 *   agencyName: 'Global Education'
 * })
 * // Sends: "Hi John, your $10,000 payment was due Dec 15. Please pay ASAP. -Global Education"
 * ```
 */
export async function sendPaymentReminderSms(
  params: SendPaymentReminderSmsParams
): Promise<SendPaymentReminderSmsResult> {
  const { to, studentFirstName, amount, dueDate, agencyName } = params

  // Validate required environment variables
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    const errorMsg =
      'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are not set. SMS sending is disabled.'
    console.error(errorMsg)
    return {
      success: false,
      error: errorMsg,
    }
  }

  if (!process.env.TWILIO_PHONE_NUMBER) {
    const errorMsg = 'TWILIO_PHONE_NUMBER environment variable is not set. SMS sending is disabled.'
    console.error(errorMsg)
    return {
      success: false,
      error: errorMsg,
    }
  }

  try {
    // Format phone number to E.164
    const formattedPhone = formatPhoneNumberToE164(to)

    // Format amount as currency (e.g., $10,000)
    const formattedAmount = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

    // Construct SMS message (max 160 characters to avoid multi-part SMS)
    // Template: "Hi [FirstName], your $[amount] payment was due [date]. Please pay ASAP. -[AgencyName]"
    const message = `Hi ${studentFirstName}, your ${formattedAmount} payment was due ${dueDate}. Please pay ASAP. -${agencyName}`

    // Warn if message exceeds 160 characters
    if (message.length > 160) {
      console.warn('SMS message exceeds 160 characters, will be sent as multi-part SMS', {
        length: message.length,
        message,
      })
    }

    // Send SMS via Twilio
    const client = getTwilioClient()
    const twilioMessage = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })

    console.log('Payment reminder SMS sent successfully', {
      messageId: twilioMessage.sid,
      to: formattedPhone,
      studentFirstName,
      amount,
      dueDate,
    })

    return {
      success: true,
      messageId: twilioMessage.sid,
    }
  } catch (error) {
    // Log error for debugging
    const errorMsg = error instanceof Error ? error.message : 'Unknown error sending SMS'
    console.error('Error sending payment reminder SMS:', {
      to,
      studentFirstName,
      amount,
      dueDate,
      error: errorMsg,
    })

    return {
      success: false,
      error: errorMsg,
    }
  }
}
