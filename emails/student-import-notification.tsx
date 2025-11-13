import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components'

interface StudentImportNotificationProps {
  agencyName: string
  totalImported: number
  incompleteStudents: Array<{
    id: string
    full_name: string
    passport_number: string
    missing_fields: string[]
  }>
  appUrl: string
}

/**
 * Email template for student import completion notification
 * Displays import summary and lists incomplete student records with edit links
 */
export function StudentImportNotification({
  agencyName,
  totalImported,
  incompleteStudents,
  appUrl,
}: StudentImportNotificationProps) {
  const hasIncompleteRecords = incompleteStudents.length > 0

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
              Student Import Complete
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
              Your student CSV import for {agencyName} has been completed successfully.
            </Text>

            <Section
              style={{
                backgroundColor: '#f0f4f8',
                padding: '20px',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                }}
              >
                Import Summary
              </Text>
              <Text style={{ fontSize: '14px', margin: '5px 0' }}>
                Total students imported: <strong>{totalImported}</strong>
              </Text>
              {hasIncompleteRecords && (
                <Text style={{ fontSize: '14px', margin: '5px 0', color: '#d97706' }}>
                  Students with incomplete data: <strong>{incompleteStudents.length}</strong>
                </Text>
              )}
            </Section>

            {hasIncompleteRecords && (
              <>
                <Text
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '30px',
                    marginBottom: '10px',
                    color: '#d97706',
                  }}
                >
                  ⚠️ Incomplete Student Records
                </Text>

                <Text
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    marginBottom: '15px',
                    color: '#666666',
                  }}
                >
                  The following students are missing critical information (especially phone
                  numbers). Click the edit link to complete their profiles:
                </Text>

                {incompleteStudents.map((student, index) => (
                  <Section
                    key={student.id}
                    style={{
                      backgroundColor: '#fef3c7',
                      padding: '15px',
                      borderRadius: '6px',
                      marginBottom: '10px',
                      borderLeft: '4px solid #d97706',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        margin: '0 0 5px 0',
                      }}
                    >
                      {student.full_name}
                    </Text>
                    <Text
                      style={{
                        fontSize: '13px',
                        color: '#666666',
                        margin: '0 0 5px 0',
                      }}
                    >
                      Passport: {student.passport_number}
                    </Text>
                    <Text
                      style={{
                        fontSize: '13px',
                        color: '#d97706',
                        margin: '0 0 10px 0',
                      }}
                    >
                      Missing: {student.missing_fields.join(', ')}
                    </Text>
                    <Button
                      href={`${appUrl}/entities/students/${student.id}/edit`}
                      style={{
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        display: 'inline-block',
                        fontSize: '13px',
                      }}
                    >
                      Edit Student Profile
                    </Button>
                  </Section>
                ))}

                <Text
                  style={{
                    fontSize: '13px',
                    color: '#666666',
                    marginTop: '20px',
                    fontStyle: 'italic',
                  }}
                >
                  Note: Phone numbers are critical for student contact. Please complete these
                  profiles as soon as possible.
                </Text>
              </>
            )}

            <Button
              href={`${appUrl}/entities/students`}
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
              View All Students
            </Button>

            <Hr style={{ margin: '30px 0', borderColor: '#e6e6e6' }} />

            <Text style={{ fontSize: '14px', color: '#666666' }}>
              This is an automated notification from Pleeno.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default StudentImportNotification
