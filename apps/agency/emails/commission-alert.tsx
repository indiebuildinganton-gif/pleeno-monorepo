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

interface CommissionAlertProps {
  collegeName: string
  students: Array<{
    name: string
    amount: string
    dueDate: string
  }>
  agencyName: string
  viewLink: string
}

export default function CommissionAlert({
  collegeName,
  students,
  agencyName,
  viewLink
}: CommissionAlertProps) {
  return (
    <Html>
      <Head />
      <Preview>Overdue Payment Summary - {collegeName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Overdue Payment Summary</Heading>

          <Text style={text}>Dear {collegeName} Team,</Text>

          <Text style={text}>
            The following students have overdue payments:
          </Text>

          <Section style={box}>
            {students.map((student, idx) => (
              <Text key={idx} style={listItem}>
                • {student.name} - {student.amount} (Due: {student.dueDate})
              </Text>
            ))}
          </Section>

          <Text style={text}>
            Please coordinate with students as needed.
          </Text>

          <Section style={buttonContainer}>
            <Link href={viewLink} style={button}>
              View Details
            </Link>
          </Section>

          <Text style={footer}>
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
