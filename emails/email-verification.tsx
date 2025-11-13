import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components'

interface EmailVerificationProps {
  agencyName: string
  userName: string
  verificationUrl: string
}

/**
 * Email template for email verification
 * Sent when an admin changes their email address to verify the new email
 *
 * @param agencyName - Name of the agency the user belongs to
 * @param userName - Full name of the user verifying their email
 * @param verificationUrl - Complete URL with verification token: {APP_URL}/verify-email?token={token}
 */
export function EmailVerificationEmail({
  agencyName,
  userName,
  verificationUrl,
}: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0', maxWidth: '600px' }}>
          <Section
            style={{
              backgroundColor: '#ffffff',
              padding: '40px',
              borderRadius: '8px',
            }}
          >
            <Text
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '20px',
                color: '#1a1a1a',
              }}
            >
              Verify your new email address
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                marginBottom: '20px',
                color: '#333333',
              }}
            >
              Hi {userName},
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                marginBottom: '20px',
                color: '#333333',
              }}
            >
              You recently requested to change your email address for your {agencyName} account on Pleeno.
              To complete this change, please verify your new email address by clicking the button below.
            </Text>

            <Button
              href={verificationUrl}
              style={{
                backgroundColor: '#0066ff',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px',
                marginBottom: '20px',
                fontWeight: '600',
              }}
            >
              Verify Email Address
            </Button>

            <Text
              style={{
                fontSize: '14px',
                lineHeight: '20px',
                color: '#666666',
                marginTop: '20px',
                marginBottom: '20px',
              }}
            >
              Or copy and paste this link into your browser:
            </Text>

            <Text
              style={{
                fontSize: '14px',
                lineHeight: '20px',
                color: '#0066ff',
                wordBreak: 'break-all',
                backgroundColor: '#f6f9fc',
                padding: '12px',
                borderRadius: '4px',
              }}
            >
              {verificationUrl}
            </Text>

            <Hr style={{ margin: '30px 0', borderColor: '#e6e6e6' }} />

            <Text
              style={{
                fontSize: '14px',
                color: '#999999',
                lineHeight: '20px',
                marginBottom: '10px',
              }}
            >
              This verification link will expire in 1 hour for security reasons.
            </Text>

            <Text
              style={{
                fontSize: '14px',
                color: '#999999',
                lineHeight: '20px',
              }}
            >
              If you didn't request this change, please ignore this email and your email address will remain unchanged.
            </Text>
          </Section>

          <Text
            style={{
              fontSize: '12px',
              color: '#999999',
              textAlign: 'center',
              marginTop: '20px',
              lineHeight: '18px',
            }}
          >
            This is an automated message from Pleeno. Please do not reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default EmailVerificationEmail
