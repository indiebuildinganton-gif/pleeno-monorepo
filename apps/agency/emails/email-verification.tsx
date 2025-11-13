import * as React from 'react'

/**
 * Email Verification Template (Stub)
 *
 * NOTE: This is a simple stub implementation.
 * Task 11 will create the full React Email template with proper styling.
 *
 * This template is used when an admin changes a user's email address.
 * The user must click the verification link to confirm the new email.
 */

interface EmailVerificationTemplateProps {
  userName: string
  verificationUrl: string
  expiresIn: string
}

export const EmailVerificationTemplate: React.FC<EmailVerificationTemplateProps> = ({
  userName,
  verificationUrl,
  expiresIn,
}) => {
  return (
    <div>
      <h1>Verify Your New Email Address</h1>
      <p>Hi {userName},</p>
      <p>
        Your administrator has requested to change your email address. To complete this change,
        please verify your new email address by clicking the link below:
      </p>
      <p>
        <a href={verificationUrl}>Verify Email Address</a>
      </p>
      <p>This link will expire in {expiresIn}.</p>
      <p>If you did not request this change, please contact your administrator immediately.</p>
      <p>
        Best regards,
        <br />
        The Pleeno Team
      </p>
    </div>
  )
}
