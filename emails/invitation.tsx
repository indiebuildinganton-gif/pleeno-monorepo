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

interface InvitationEmailProps {
  agencyName: string
  inviterName: string
  assignedTasks: Array<{ task_name: string; description: string }>
  acceptUrl: string
}

/**
 * Email template for user invitations
 * Displays agency name, inviter name, assigned tasks, and acceptance link
 */
export function InvitationEmail({
  agencyName,
  inviterName,
  assignedTasks,
  acceptUrl,
}: InvitationEmailProps) {
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
              }}
            >
              You're invited to join {agencyName}
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                marginBottom: '20px',
              }}
            >
              Hi,
            </Text>

            <Text
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                marginBottom: '20px',
              }}
            >
              {inviterName} has invited you to join {agencyName} on Pleeno, the
              intelligent financial command center for international study agencies.
            </Text>

            {assignedTasks.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '30px',
                    marginBottom: '10px',
                  }}
                >
                  You've been assigned the following responsibilities:
                </Text>
                <ul style={{ marginLeft: '20px', lineHeight: '28px' }}>
                  {assignedTasks.map((task, index) => (
                    <li key={index}>
                      <strong>{task.task_name}</strong> - {task.description}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Button
              href={acceptUrl}
              style={{
                backgroundColor: '#0066ff',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '30px',
              }}
            >
              Accept Invitation
            </Button>

            <Hr style={{ margin: '30px 0', borderColor: '#e6e6e6' }} />

            <Text style={{ fontSize: '14px', color: '#666666' }}>
              This invitation expires in 7 days.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default InvitationEmail
