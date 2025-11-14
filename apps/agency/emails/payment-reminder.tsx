import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'

interface PaymentReminderProps {
  studentName: string
  amount: string
  dueDate: string
  collegeName: string
  branchName?: string
  paymentInstructions: string
  agencyName: string
  agencyEmail: string
  agencyPhone: string
}

export default function PaymentReminder({
  studentName,
  amount,
  dueDate,
  collegeName,
  branchName,
  paymentInstructions,
  agencyName,
  agencyEmail,
  agencyPhone
}: PaymentReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment Reminder - {collegeName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Reminder</Heading>

          <Text style={text}>Dear {studentName},</Text>

          <Text style={text}>
            This is a friendly reminder that your payment of{' '}
            <strong>{amount}</strong> for {collegeName}
            {branchName && ` (${branchName})`} was due on{' '}
            <strong>{dueDate}</strong>.
          </Text>

          <Section style={box}>
            <Heading as="h2" style={h2}>
              Payment Instructions
            </Heading>
            <Text style={text}>{paymentInstructions}</Text>
          </Section>

          <Text style={text}>
            If you have already made this payment, please disregard this
            message.
          </Text>

          <Text style={text}>
            For questions, please contact us:
            <br />
            Email: {agencyEmail}
            <br />
            Phone: {agencyPhone}
          </Text>

          <Text style={footer}>
            Thank you,
            <br />
            {agencyName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px'
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '16px 0'
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0'
}

const box = {
  backgroundColor: '#f6f9fc',
  borderRadius: '4px',
  padding: '20px'
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px'
}
