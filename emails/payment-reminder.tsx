import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components'

interface PaymentReminderEmailProps {
  studentName: string
  amount: number
  dueDate: string
  paymentInstructions: string
  agencyName: string
  agencyContactEmail?: string
  agencyContactPhone?: string
}

/**
 * Email template for payment reminder notification
 * Sent to students 36 hours before payment due date
 */
export function PaymentReminderEmail({
  studentName,
  amount,
  dueDate,
  paymentInstructions,
  agencyName,
  agencyContactEmail,
  agencyContactPhone,
}: PaymentReminderEmailProps) {
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
              Payment Reminder
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                marginBottom: '20px',
              }}
            >
              Hi {studentName},
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                marginBottom: '30px',
              }}
            >
              This is a friendly reminder that your payment is due soon. We wanted to give you advance notice so you have time to arrange payment.
            </Text>

            <Section
              style={{
                backgroundColor: '#fef3c7',
                padding: '25px',
                borderRadius: '6px',
                marginBottom: '30px',
                borderLeft: '4px solid #f59e0b',
              }}
            >
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  color: '#92400e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Payment Details
              </Text>
              <Text style={{ fontSize: '16px', margin: '10px 0' }}>
                <strong>Amount Due:</strong>{' '}
                <span style={{ fontSize: '20px', color: '#d97706' }}>
                  ${amount.toFixed(2)}
                </span>
              </Text>
              <Text style={{ fontSize: '16px', margin: '10px 0' }}>
                <strong>Due Date:</strong> {dueDate}
              </Text>
            </Section>

            <Section
              style={{
                backgroundColor: '#f0f4f8',
                padding: '20px',
                borderRadius: '6px',
                marginBottom: '30px',
              }}
            >
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  color: '#334155',
                }}
              >
                Payment Instructions
              </Text>
              <Text
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  margin: '0',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {paymentInstructions}
              </Text>
            </Section>

            <Text
              style={{
                fontSize: '14px',
                lineHeight: '20px',
                marginBottom: '20px',
                color: '#666666',
              }}
            >
              Please ensure payment is received by the due date to avoid any late fees or payment complications. If you have already made this payment, please disregard this reminder.
            </Text>

            {(agencyContactEmail || agencyContactPhone) && (
              <>
                <Hr style={{ margin: '30px 0', borderColor: '#e6e6e6' }} />

                <Text
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                  }}
                >
                  Need Help?
                </Text>

                <Text
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    marginBottom: '5px',
                    color: '#666666',
                  }}
                >
                  If you have any questions or need assistance, please contact us:
                </Text>

                {agencyContactEmail && (
                  <Text
                    style={{
                      fontSize: '14px',
                      margin: '5px 0',
                      color: '#666666',
                    }}
                  >
                    Email:{' '}
                    <a
                      href={`mailto:${agencyContactEmail}`}
                      style={{ color: '#0066ff', textDecoration: 'none' }}
                    >
                      {agencyContactEmail}
                    </a>
                  </Text>
                )}

                {agencyContactPhone && (
                  <Text
                    style={{
                      fontSize: '14px',
                      margin: '5px 0',
                      color: '#666666',
                    }}
                  >
                    Phone: {agencyContactPhone}
                  </Text>
                )}
              </>
            )}

            <Hr style={{ margin: '30px 0', borderColor: '#e6e6e6' }} />

            <Text style={{ fontSize: '14px', color: '#666666', lineHeight: '20px' }}>
              Thank you,
              <br />
              {agencyName}
            </Text>

            <Text
              style={{
                fontSize: '12px',
                color: '#999999',
                marginTop: '30px',
                fontStyle: 'italic',
              }}
            >
              This is an automated payment reminder from Pleeno. Please do not reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PaymentReminderEmail
