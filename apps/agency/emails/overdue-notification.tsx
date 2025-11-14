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

interface OverdueNotificationProps {
  recipientType: 'sales_agent' | 'agency_admin'
  studentName?: string
  amount?: string
  dueDate?: string
  studentEmail?: string
  studentPhone?: string
  installments?: Array<{
    studentName: string
    collegeName: string
    amount: string
    dueDate: string
  }>
  viewLink: string
  agencyName: string
}

export default function OverdueNotification({
  recipientType,
  studentName,
  amount,
  dueDate,
  studentEmail,
  studentPhone,
  installments,
  viewLink,
  agencyName
}: OverdueNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {recipientType === 'sales_agent'
          ? `Action Required - Overdue Payment for ${studentName}`
          : `New Overdue Payments - ${installments?.length || 0} students`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {recipientType === 'sales_agent' ? (
            <>
              <Heading style={h1}>Action Required</Heading>
              <Text style={text}>Hi,</Text>
              <Text style={text}>
                Your assigned student <strong>{studentName}</strong> has an
                overdue payment:
              </Text>
              <Section style={box}>
                <Text style={listItem}>Amount: {amount}</Text>
                <Text style={listItem}>Due Date: {dueDate}</Text>
                <Text style={listItem}>
                  Contact: {studentEmail}, {studentPhone}
                </Text>
              </Section>
            </>
          ) : (
            <>
              <Heading style={h1}>New Overdue Payments</Heading>
              <Text style={text}>Dear Admin,</Text>
              <Text style={text}>
                The following payments became overdue today:
              </Text>
              <Section style={box}>
                {installments?.map((inst, idx) => (
                  <Text key={idx} style={listItem}>
                    • {inst.studentName} ({inst.collegeName}) - {inst.amount}{' '}
                    (Due: {inst.dueDate})
                  </Text>
                ))}
              </Section>
            </>
          )}

          <Section style={buttonContainer}>
            <Link href={viewLink} style={button}>
              {recipientType === 'sales_agent'
                ? 'View Student Profile'
                : 'View All Overdue Payments'}
            </Link>
          </Section>

          <Text style={footer}>{agencyName}</Text>
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

const listItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '8px 0'
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0'
}

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '4px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none'
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px'
}
