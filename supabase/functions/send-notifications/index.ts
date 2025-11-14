/**
 * Send Notifications Edge Function
 *
 * This function processes notification rules and sends emails to appropriate stakeholders
 * when installments become overdue. It:
 * 1. Fetches installment details with related data (student, agency, college, branch)
 * 2. Queries notification rules for the relevant agencies
 * 3. Determines recipients based on recipient_type
 * 4. Sends personalized emails using templates
 * 5. Logs all notifications to prevent duplicates
 *
 * Security: Called internally by update-installment-statuses Edge Function
 * API Key: Uses same authentication as other internal functions
 *
 * @see supabase/migrations/004_notifications_domain/001_notification_system.sql
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NotificationEvent {
  installmentIds: string[];
  eventType: 'overdue' | 'due_soon' | 'payment_received';
}

interface NotificationResult {
  installmentId: string;
  recipient: string;
  recipientType: string;
  status: 'sent' | 'failed' | 'skipped';
  messageId?: string;
  error?: string;
  reason?: string;
}

serve(async (req) => {
  try {
    const { installmentIds, eventType }: NotificationEvent = await req.json();

    if (!installmentIds || installmentIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No installments to process', processed: 0, results: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch installment details with related data
    const { data: installments, error: installmentsError } = await supabase
      .from('installments')
      .select(`
        *,
        payment_plan:payment_plans(
          *,
          enrollment:enrollments(
            student:students(
              *,
              assigned_user:users!students_assigned_user_id_fkey(id, name, email)
            )
          ),
          agency:agencies(id, name, contact_email, contact_phone, payment_instructions)
        ),
        branch:branches(
          *,
          college:colleges(id, name, contact_email)
        )
      `)
      .in('id', installmentIds);

    if (installmentsError) {
      console.error('Error fetching installments:', installmentsError);
      throw installmentsError;
    }

    if (!installments || installments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No installments found', processed: 0, results: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing ${installments.length} installments for ${eventType} notifications`);

    // Group installments by agency for efficient processing
    const installmentsByAgency = groupBy(
      installments,
      (inst: any) => inst.payment_plan.agency.id
    );

    const results: NotificationResult[] = [];

    for (const [agencyId, agencyInstallments] of Object.entries(installmentsByAgency)) {
      // Fetch notification rules for this agency
      const { data: rules, error: rulesError } = await supabase
        .from('notification_rules')
        .select('*, email_templates(*)')
        .eq('agency_id', agencyId)
        .eq('event_type', eventType)
        .eq('is_enabled', true);

      if (rulesError) {
        console.error(`Error fetching rules for agency ${agencyId}:`, rulesError);
        continue;
      }

      if (!rules || rules.length === 0) {
        console.log(`No enabled notification rules for agency ${agencyId} and event ${eventType}`);
        for (const installment of agencyInstallments as any[]) {
          results.push({
            installmentId: installment.id,
            recipient: 'N/A',
            recipientType: 'N/A',
            status: 'skipped',
            reason: 'No enabled notification rules',
          });
        }
        continue;
      }

      // Process each notification rule
      for (const rule of rules) {
        const recipients = await getRecipients(
          rule.recipient_type,
          agencyInstallments as any[],
          supabase
        );

        if (recipients.length === 0) {
          console.log(`No recipients found for ${rule.recipient_type} in agency ${agencyId}`);
          continue;
        }

        // Process each installment
        for (const installment of agencyInstallments as any[]) {
          // Process each recipient
          for (const recipient of recipients) {
            try {
              // Check if already notified (using notification_log UNIQUE constraint)
              const { data: existingLog } = await supabase
                .from('notification_log')
                .select('id')
                .eq('installment_id', installment.id)
                .eq('recipient_type', rule.recipient_type)
                .eq('recipient_email', recipient.email)
                .eq('event_type', eventType)
                .maybeSingle();

              if (existingLog) {
                console.log(
                  `Already notified ${recipient.email} (${rule.recipient_type}) for installment ${installment.id}`
                );
                results.push({
                  installmentId: installment.id,
                  recipient: recipient.email,
                  recipientType: rule.recipient_type,
                  status: 'skipped',
                  reason: 'Already notified',
                });
                continue;
              }

              // Prepare email content
              const emailData = prepareEmailData(
                rule.recipient_type,
                installment,
                recipient,
                rule.email_templates
              );

              // Send email via Resend API
              const emailResponse = await sendEmail({
                from: installment.payment_plan.agency.contact_email || 'notifications@pleeno.com',
                to: recipient.email,
                subject: emailData.subject,
                html: emailData.html,
              });

              // Log successful send
              await supabase.from('notification_log').insert({
                installment_id: installment.id,
                recipient_type: rule.recipient_type,
                recipient_email: recipient.email,
                event_type: eventType,
                template_id: rule.template_id,
                email_subject: emailData.subject,
              });

              // Update installment last_notified_date
              await supabase
                .from('installments')
                .update({ last_notified_date: new Date().toISOString() })
                .eq('id', installment.id);

              results.push({
                installmentId: installment.id,
                recipient: recipient.email,
                recipientType: rule.recipient_type,
                status: 'sent',
                messageId: emailResponse.id,
              });

              console.log(
                `Sent ${eventType} notification to ${recipient.email} (${rule.recipient_type}) for installment ${installment.id}`
              );
            } catch (emailError: any) {
              console.error(`Failed to send email to ${recipient.email}:`, emailError);
              results.push({
                installmentId: installment.id,
                recipient: recipient.email,
                recipientType: rule.recipient_type,
                status: 'failed',
                error: emailError.message || String(emailError),
              });
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: installmentIds.length,
        results,
        summary: {
          sent: results.filter((r) => r.status === 'sent').length,
          failed: results.filter((r) => r.status === 'failed').length,
          skipped: results.filter((r) => r.status === 'skipped').length,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Notification job error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get recipients based on recipient type
 */
async function getRecipients(
  recipientType: string,
  installments: any[],
  supabase: any
): Promise<Array<{ email: string; name?: string }>> {
  const firstInstallment = installments[0];
  const agencyId = firstInstallment.payment_plan.agency.id;

  switch (recipientType) {
    case 'agency_user': {
      // Get all agency users with notifications enabled
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('agency_id', agencyId)
        .eq('email_notifications_enabled', true);
      return data || [];
    }

    case 'student': {
      // Get unique students from installments
      const students = new Set<string>();
      return installments
        .map((inst) => inst.payment_plan.enrollment?.student)
        .filter((student) => {
          if (!student || !student.email) return false;
          if (students.has(student.id)) return false;
          students.add(student.id);
          return true;
        })
        .map((student) => ({
          email: student.email,
          name: student.full_name || `${student.first_name} ${student.last_name}`,
        }));
    }

    case 'college': {
      // Get unique colleges from installments
      const colleges = new Set<string>();
      return installments
        .map((inst) => inst.branch?.college)
        .filter((college) => {
          if (!college || !college.contact_email) return false;
          if (colleges.has(college.id)) return false;
          colleges.add(college.id);
          return true;
        })
        .map((college) => ({
          email: college.contact_email,
          name: college.name,
        }));
    }

    case 'sales_agent': {
      // Get unique assigned users (sales agents)
      const agents = new Set<string>();
      return installments
        .map((inst) => inst.payment_plan.enrollment?.student?.assigned_user)
        .filter((agent) => {
          if (!agent || !agent.email) return false;
          if (agents.has(agent.id)) return false;
          agents.add(agent.id);
          return true;
        })
        .map((agent) => ({
          email: agent.email,
          name: agent.name,
        }));
    }

    default:
      return [];
  }
}

/**
 * Prepare email content based on recipient type
 */
function prepareEmailData(
  recipientType: string,
  installment: any,
  recipient: any,
  template: any
): { subject: string; html: string } {
  const student = installment.payment_plan.enrollment?.student;
  const agency = installment.payment_plan.agency;
  const college = installment.branch?.college;
  const branch = installment.branch;

  // Template variables
  const variables = {
    student_name: student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
    student_email: student?.email || 'N/A',
    student_phone: student?.phone || 'N/A',
    amount: formatCurrency(installment.agency_amount || installment.amount),
    due_date: formatDate(installment.student_due_date),
    college_name: college?.name || 'N/A',
    branch_name: branch?.name || 'N/A',
    agency_name: agency?.name || 'N/A',
    agency_email: agency?.contact_email || 'N/A',
    agency_phone: agency?.contact_phone || 'N/A',
    payment_instructions: agency?.payment_instructions || '',
    view_link: `${Deno.env.get('APP_URL') || 'https://pleeno.com'}/payments/${installment.id}`,
  };

  // Default templates if none configured
  const defaultSubject = `Payment Reminder: ${variables.student_name} - ${variables.amount} overdue`;
  const defaultBody = `
    <p>This is a reminder that a payment installment is overdue.</p>
    <p><strong>Student:</strong> ${variables.student_name}</p>
    <p><strong>Amount:</strong> ${variables.amount}</p>
    <p><strong>Due Date:</strong> ${variables.due_date}</p>
    <p><strong>College:</strong> ${variables.college_name}</p>
    ${variables.payment_instructions ? `<p><strong>Payment Instructions:</strong><br/>${variables.payment_instructions}</p>` : ''}
    <p><a href="${variables.view_link}">View Details</a></p>
  `;

  // Use template if available, otherwise use defaults
  let subject = template?.subject || defaultSubject;
  let html = template?.body_html || defaultBody;

  // Render template (simple placeholder replacement)
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(placeholder, value);
    html = html.replace(placeholder, value);
  });

  return { subject, html };
}

/**
 * Send email via Resend API
 */
async function sendEmail(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Utility: Group array by key
 */
function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Utility: Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

/**
 * Utility: Format date
 */
function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}
