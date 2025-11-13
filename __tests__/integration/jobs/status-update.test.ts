/**
 * Integration Test Suite: Status Update Job
 * Purpose: Test end-to-end flow of automated status detection job
 * Tests: Edge Function invocation, database updates, jobs_log entries
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FUNCTION_API_KEY = process.env.SUPABASE_FUNCTION_KEY || '';

describe('Status Update Job Integration Tests', () => {
  let supabase: SupabaseClient;
  let testAgencyIds: string[] = [];
  let testPaymentPlanIds: string[] = [];
  let testInstallmentIds: string[] = [];

  beforeAll(() => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData();
  });

  // ===================================================================
  // Helper Functions
  // ===================================================================

  async function cleanupTestData() {
    // Delete test installments
    if (testInstallmentIds.length > 0) {
      await supabase
        .from('installments')
        .delete()
        .in('id', testInstallmentIds);
    }

    // Delete test payment plans
    if (testPaymentPlanIds.length > 0) {
      await supabase
        .from('payment_plans')
        .delete()
        .in('id', testPaymentPlanIds);
    }

    // Delete test agencies
    if (testAgencyIds.length > 0) {
      await supabase
        .from('agencies')
        .delete()
        .in('id', testAgencyIds);
    }

    // Reset arrays
    testAgencyIds = [];
    testPaymentPlanIds = [];
    testInstallmentIds = [];
  }

  async function createTestAgency(name: string, timezone: string) {
    const { data, error } = await supabase
      .from('agencies')
      .insert({
        name,
        timezone,
        overdue_cutoff_time: '17:00:00',
      })
      .select()
      .single();

    if (error) throw error;
    testAgencyIds.push(data.id);
    return data;
  }

  async function createTestPaymentPlan(agencyId: string, status: string = 'active') {
    const { data, error } = await supabase
      .from('payment_plans')
      .insert({
        agency_id: agencyId,
        status,
        expected_commission: 1000,
      })
      .select()
      .single();

    if (error) throw error;
    testPaymentPlanIds.push(data.id);
    return data;
  }

  async function createTestInstallment(
    paymentPlanId: string,
    status: string,
    daysOffset: number
  ) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysOffset);

    const { data, error } = await supabase
      .from('installments')
      .insert({
        payment_plan_id: paymentPlanId,
        status,
        student_due_date: dueDate.toISOString().split('T')[0],
        amount: 100,
      })
      .select()
      .single();

    if (error) throw error;
    testInstallmentIds.push(data.id);
    return data;
  }

  // ===================================================================
  // Test 1: Update Overdue Installments
  // ===================================================================

  it('should update overdue installments and create jobs_log entry', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Integration Agency', 'Australia/Brisbane');
    const plan = await createTestPaymentPlan(agency.id, 'active');

    // Create installments with different due dates
    const overdueInstallment = await createTestInstallment(plan.id, 'pending', -1); // Yesterday
    const futureInstallment = await createTestInstallment(plan.id, 'pending', 7); // Next week

    // Execute: Call Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': FUNCTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    // Assert: Response structure
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.recordsUpdated).toBeGreaterThan(0);
    expect(Array.isArray(result.agencies)).toBe(true);

    // Assert: Overdue installment status changed
    const { data: overdueCheck } = await supabase
      .from('installments')
      .select('status')
      .eq('id', overdueInstallment.id)
      .single();

    expect(overdueCheck?.status).toBe('overdue');

    // Assert: Future installment status unchanged
    const { data: futureCheck } = await supabase
      .from('installments')
      .select('status')
      .eq('id', futureInstallment.id)
      .single();

    expect(futureCheck?.status).toBe('pending');

    // Assert: jobs_log entry created
    const { data: logs } = await supabase
      .from('jobs_log')
      .select('*')
      .eq('job_name', 'update-installment-statuses')
      .order('started_at', { ascending: false })
      .limit(1);

    expect(logs).toBeDefined();
    expect(logs!.length).toBeGreaterThan(0);
    expect(logs![0].status).toBe('success');
    expect(logs![0].records_updated).toBeGreaterThan(0);
    expect(logs![0].completed_at).toBeDefined();
  }, 30000); // 30 second timeout for integration test

  // ===================================================================
  // Test 2: Reject Invalid API Key
  // ===================================================================

  it('should reject request with invalid API key', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': 'invalid-api-key-12345',
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(401);

    const result = await response.json();
    expect(result.error).toBeDefined();
  }, 10000);

  // ===================================================================
  // Test 3: Reject Request Without API Key
  // ===================================================================

  it('should reject request without API key', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(401);
  }, 10000);

  // ===================================================================
  // Test 4: Multi-Agency Processing
  // ===================================================================

  it('should process multiple agencies with different timezones', async () => {
    // Setup: Create multiple agencies
    const brisbaneAgency = await createTestAgency(
      'Test Brisbane Agency',
      'Australia/Brisbane'
    );
    const laAgency = await createTestAgency('Test LA Agency', 'America/Los_Angeles');

    // Create payment plans for each agency
    const brisbanePlan = await createTestPaymentPlan(brisbaneAgency.id, 'active');
    const laPlan = await createTestPaymentPlan(laAgency.id, 'active');

    // Create overdue installments for both agencies
    await createTestInstallment(brisbanePlan.id, 'pending', -2); // 2 days ago
    await createTestInstallment(laPlan.id, 'pending', -3); // 3 days ago

    // Execute: Call Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': FUNCTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    // Assert: Both agencies processed
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.agencies.length).toBeGreaterThanOrEqual(2);

    // Verify both agencies have results
    const brisbaneResult = result.agencies.find(
      (a: any) => a.agency_id === brisbaneAgency.id
    );
    const laResult = result.agencies.find((a: any) => a.agency_id === laAgency.id);

    expect(brisbaneResult).toBeDefined();
    expect(brisbaneResult.updated_count).toBeGreaterThan(0);
    expect(laResult).toBeDefined();
    expect(laResult.updated_count).toBeGreaterThan(0);
  }, 30000);

  // ===================================================================
  // Test 5: Inactive Payment Plans Not Processed
  // ===================================================================

  it('should not update installments for inactive payment plans', async () => {
    // Setup: Create agency with inactive plan
    const agency = await createTestAgency('Test Cancelled Plan Agency', 'Australia/Brisbane');
    const inactivePlan = await createTestPaymentPlan(agency.id, 'cancelled');

    // Create overdue installment for inactive plan
    const installment = await createTestInstallment(inactivePlan.id, 'pending', -5); // 5 days ago

    // Execute: Call Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': FUNCTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    expect(response.status).toBe(200);

    // Assert: Installment status should still be pending
    const { data: installmentCheck } = await supabase
      .from('installments')
      .select('status')
      .eq('id', installment.id)
      .single();

    expect(installmentCheck?.status).toBe('pending');
  }, 30000);

  // ===================================================================
  // Test 6: Jobs Log Metadata Structure
  // ===================================================================

  it('should create jobs_log entry with correct metadata structure', async () => {
    // Setup: Create test data
    const agency = await createTestAgency('Test Metadata Agency', 'Australia/Brisbane');
    const plan = await createTestPaymentPlan(agency.id, 'active');
    await createTestInstallment(plan.id, 'pending', -1);

    // Execute: Call Edge Function
    await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': FUNCTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Assert: jobs_log entry has correct metadata
    const { data: logs } = await supabase
      .from('jobs_log')
      .select('*')
      .eq('job_name', 'update-installment-statuses')
      .order('started_at', { ascending: false })
      .limit(1);

    expect(logs).toBeDefined();
    expect(logs!.length).toBeGreaterThan(0);

    const log = logs![0];
    expect(log.metadata).toBeDefined();
    expect(log.metadata.agencies).toBeDefined();
    expect(Array.isArray(log.metadata.agencies)).toBe(true);
    expect(log.metadata.total_agencies_processed).toBeDefined();
    expect(typeof log.metadata.total_agencies_processed).toBe('number');
  }, 30000);

  // ===================================================================
  // Test 7: Already Overdue Installments Remain Overdue
  // ===================================================================

  it('should not change status of already overdue installments', async () => {
    // Setup: Create installment that's already overdue
    const agency = await createTestAgency('Test Already Overdue Agency', 'Australia/Brisbane');
    const plan = await createTestPaymentPlan(agency.id, 'active');
    const installment = await createTestInstallment(plan.id, 'overdue', -10); // 10 days ago, already overdue

    // Execute: Call Edge Function
    await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': FUNCTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Assert: Status should still be overdue
    const { data: installmentCheck } = await supabase
      .from('installments')
      .select('status')
      .eq('id', installment.id)
      .single();

    expect(installmentCheck?.status).toBe('overdue');
  }, 30000);

  // ===================================================================
  // Test 8: Paid Installments Remain Paid
  // ===================================================================

  it('should not change status of paid installments', async () => {
    // Setup: Create paid installment
    const agency = await createTestAgency('Test Paid Agency', 'Australia/Brisbane');
    const plan = await createTestPaymentPlan(agency.id, 'active');
    const installment = await createTestInstallment(plan.id, 'paid', -5); // 5 days ago, but paid

    // Execute: Call Edge Function
    await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': FUNCTION_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Assert: Status should still be paid
    const { data: installmentCheck } = await supabase
      .from('installments')
      .select('status')
      .eq('id', installment.id)
      .single();

    expect(installmentCheck?.status).toBe('paid');
  }, 30000);

  // ===================================================================
  // Test 9: CORS Headers
  // ===================================================================

  it('should handle CORS preflight requests', async () => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-installment-statuses`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  }, 10000);
});
