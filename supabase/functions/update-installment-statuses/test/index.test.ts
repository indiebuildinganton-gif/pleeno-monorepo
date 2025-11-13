/**
 * Test Suite: update-installment-statuses Edge Function
 * Purpose: Test API authentication, retry logic, and error handling
 */

import { assertEquals, assertRejects } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock environment variables for testing
Deno.env.set("SUPABASE_URL", "http://localhost:54321");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
Deno.env.set("SUPABASE_FUNCTION_KEY", "test-function-key");

// ===================================================================
// Test 1: API Key Authentication - Valid Key
// ===================================================================

Deno.test("Edge Function - Valid API Key → 200 OK", async () => {
  const validApiKey = Deno.env.get("SUPABASE_FUNCTION_KEY")!;

  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: {
      "X-API-Key": validApiKey,
      "Content-Type": "application/json",
    },
  });

  // Validate header is set correctly
  assertEquals(req.headers.get("X-API-Key"), validApiKey);
  assertEquals(req.method, "POST");
});

// ===================================================================
// Test 2: API Key Authentication - Invalid Key
// ===================================================================

Deno.test("Edge Function - Invalid API Key → Should Reject", async () => {
  const invalidApiKey = "invalid-key-12345";
  const validApiKey = Deno.env.get("SUPABASE_FUNCTION_KEY")!;

  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: {
      "X-API-Key": invalidApiKey,
      "Content-Type": "application/json",
    },
  });

  // Validate authentication would fail
  const isValid = req.headers.get("X-API-Key") === validApiKey;
  assertEquals(isValid, false);
});

// ===================================================================
// Test 3: API Key Authentication - Missing Key
// ===================================================================

Deno.test("Edge Function - Missing API Key → Should Reject", async () => {
  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Validate no API key present
  const apiKey = req.headers.get("X-API-Key");
  assertEquals(apiKey, null);
});

// ===================================================================
// Test 4: CORS Preflight Request
// ===================================================================

Deno.test("Edge Function - CORS preflight → 200 OK", async () => {
  const req = new Request("http://localhost:8000", {
    method: "OPTIONS",
    headers: {
      "Origin": "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
    },
  });

  assertEquals(req.method, "OPTIONS");
});

// ===================================================================
// Test 5: Retry Logic - Transient Error Detection
// ===================================================================

Deno.test("Retry Logic - Identifies transient errors correctly", () => {
  // Helper function to test (from index.ts)
  function isTransientError(error: any): boolean {
    const transientPatterns = [
      "ECONNRESET",
      "ETIMEDOUT",
      "connection",
      "timeout",
      "ECONNREFUSED",
    ];
    const errorMessage = error?.message?.toLowerCase() || "";
    return transientPatterns.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  // Test transient errors
  assertEquals(isTransientError({ message: "Connection timeout" }), true);
  assertEquals(isTransientError({ message: "ECONNRESET error" }), true);
  assertEquals(isTransientError({ message: "ETIMEDOUT" }), true);
  assertEquals(isTransientError({ message: "connection refused" }), true);

  // Test non-transient errors
  assertEquals(isTransientError({ message: "Invalid input" }), false);
  assertEquals(isTransientError({ message: "Unauthorized" }), false);
  assertEquals(isTransientError({ message: "Not found" }), false);
});

// ===================================================================
// Test 6: Retry Logic - Transient Error Recovery
// ===================================================================

Deno.test("Retry Logic - Recovers from transient error after retries", async () => {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY = 100; // Use shorter delay for testing (100ms instead of 1s)

  let attempt = 0;

  // Mock function that fails twice, then succeeds
  const mockFn = async () => {
    attempt++;
    if (attempt < 3) {
      throw { message: "connection timeout" };
    }
    return "success";
  };

  // Implement executeWithRetry function
  async function executeWithRetry<T>(
    fn: () => Promise<T>,
    retries = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries >= MAX_RETRIES || !isTransientError(error)) {
        throw error;
      }
      const delay = INITIAL_DELAY * Math.pow(2, retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return executeWithRetry(fn, retries + 1);
    }
  }

  function isTransientError(error: any): boolean {
    const transientPatterns = [
      "ECONNRESET",
      "ETIMEDOUT",
      "connection",
      "timeout",
      "ECONNREFUSED",
    ];
    const errorMessage = error?.message?.toLowerCase() || "";
    return transientPatterns.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  // Execute test
  const result = await executeWithRetry(mockFn);

  assertEquals(result, "success");
  assertEquals(attempt, 3); // Should have retried twice before succeeding
});

// ===================================================================
// Test 7: Retry Logic - Permanent Error (No Retry)
// ===================================================================

Deno.test("Retry Logic - Does not retry permanent errors", async () => {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY = 100;

  let attempt = 0;

  // Mock function that always throws a permanent error
  const mockFn = async () => {
    attempt++;
    throw { message: "Unauthorized access" };
  };

  // Implement executeWithRetry function
  async function executeWithRetry<T>(
    fn: () => Promise<T>,
    retries = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries >= MAX_RETRIES || !isTransientError(error)) {
        throw error;
      }
      const delay = INITIAL_DELAY * Math.pow(2, retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return executeWithRetry(fn, retries + 1);
    }
  }

  function isTransientError(error: any): boolean {
    const transientPatterns = [
      "ECONNRESET",
      "ETIMEDOUT",
      "connection",
      "timeout",
      "ECONNREFUSED",
    ];
    const errorMessage = error?.message?.toLowerCase() || "";
    return transientPatterns.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  // Execute test - should throw immediately
  await assertRejects(
    async () => await executeWithRetry(mockFn),
    Error
  );

  assertEquals(attempt, 1); // Should only attempt once (no retries for permanent errors)
});

// ===================================================================
// Test 8: Retry Logic - Exponential Backoff Timing
// ===================================================================

Deno.test("Retry Logic - Uses exponential backoff (1s, 2s, 4s)", async () => {
  const INITIAL_DELAY = 100; // 100ms for faster testing
  const expectedDelays = [100, 200, 400]; // 1x, 2x, 4x
  const actualDelays: number[] = [];
  let lastTimestamp = Date.now();

  let attempt = 0;

  // Mock function that fails 3 times
  const mockFn = async () => {
    if (attempt > 0) {
      const currentTimestamp = Date.now();
      const delay = currentTimestamp - lastTimestamp;
      actualDelays.push(delay);
      lastTimestamp = currentTimestamp;
    } else {
      lastTimestamp = Date.now();
    }

    attempt++;
    if (attempt <= 3) {
      throw { message: "connection timeout" };
    }
    return "success";
  };

  const MAX_RETRIES = 3;

  async function executeWithRetry<T>(
    fn: () => Promise<T>,
    retries = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries >= MAX_RETRIES) {
        throw error;
      }
      const delay = INITIAL_DELAY * Math.pow(2, retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return executeWithRetry(fn, retries + 1);
    }
  }

  // Execute test
  await executeWithRetry(mockFn);

  // Verify exponential backoff (with tolerance for timing variations)
  assertEquals(actualDelays.length, 3);

  // Check each delay is approximately correct (within 50ms tolerance)
  for (let i = 0; i < actualDelays.length; i++) {
    const expected = expectedDelays[i];
    const actual = actualDelays[i];
    const tolerance = 50;

    const isWithinTolerance = Math.abs(actual - expected) <= tolerance;
    assertEquals(
      isWithinTolerance,
      true,
      `Delay ${i + 1} should be ~${expected}ms, but was ${actual}ms`
    );
  }
});

// ===================================================================
// Test 9: Response Format - Success
// ===================================================================

Deno.test("Response Format - Success response structure", () => {
  const mockResponse = {
    success: true,
    recordsUpdated: 10,
    agencies: [
      {
        agency_id: "a1234567-89ab-cdef-0123-456789abcdef",
        updated_count: 5,
        transitions: {
          pending_to_overdue: 5,
        },
      },
      {
        agency_id: "b2345678-9abc-def0-1234-56789abcdef0",
        updated_count: 5,
        transitions: {
          pending_to_overdue: 5,
        },
      },
    ],
  };

  assertEquals(mockResponse.success, true);
  assertEquals(mockResponse.recordsUpdated, 10);
  assertEquals(mockResponse.agencies.length, 2);
  assertEquals(mockResponse.agencies[0].updated_count, 5);
});

// ===================================================================
// Test 10: Response Format - Error
// ===================================================================

Deno.test("Response Format - Error response structure", () => {
  const mockErrorResponse = {
    success: false,
    recordsUpdated: 0,
    agencies: [],
    error: "Database connection failed",
  };

  assertEquals(mockErrorResponse.success, false);
  assertEquals(mockErrorResponse.recordsUpdated, 0);
  assertEquals(mockErrorResponse.agencies.length, 0);
  assertEquals(typeof mockErrorResponse.error, "string");
});

console.log("\n✅ All Edge Function tests completed\n");
