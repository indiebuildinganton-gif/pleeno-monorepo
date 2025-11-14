/**
 * Test Fixtures for Student Registry Tests
 *
 * Provides reusable test data for students, colleges, branches, and related entities.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing
 */

export const testAgencies = {
  agencyA: {
    id: 'agency-a-uuid',
    name: 'Test Agency A',
    email: 'contact@agencya.com',
  },
  agencyB: {
    id: 'agency-b-uuid',
    name: 'Test Agency B',
    email: 'contact@agencyb.com',
  },
}

export const testUsers = {
  agencyAAdmin: {
    id: 'user-a-admin-uuid',
    email: 'admin@agencya.com',
    app_metadata: {
      agency_id: testAgencies.agencyA.id,
    },
  },
  agencyAUser: {
    id: 'user-a-user-uuid',
    email: 'user@agencya.com',
    app_metadata: {
      agency_id: testAgencies.agencyA.id,
    },
  },
  agencyBAdmin: {
    id: 'user-b-admin-uuid',
    email: 'admin@agencyb.com',
    app_metadata: {
      agency_id: testAgencies.agencyB.id,
    },
  },
}

export const testColleges = {
  universityOfToronto: {
    id: 'college-uoft-uuid',
    name: 'University of Toronto',
    country: 'Canada',
    website: 'https://www.utoronto.ca',
  },
  universityOfMelbourne: {
    id: 'college-uom-uuid',
    name: 'University of Melbourne',
    country: 'Australia',
    website: 'https://www.unimelb.edu.au',
  },
}

export const testBranches = {
  uoftMainCampus: {
    id: 'branch-uoft-main-uuid',
    college_id: testColleges.universityOfToronto.id,
    name: 'Main Campus',
    city: 'Toronto',
    commission_rate_percent: 15,
  },
  uomMainCampus: {
    id: 'branch-uom-main-uuid',
    college_id: testColleges.universityOfMelbourne.id,
    name: 'Parkville Campus',
    city: 'Melbourne',
    commission_rate_percent: 20,
  },
}

export const testStudents = {
  johnDoe: {
    id: 'student-john-uuid',
    agency_id: testAgencies.agencyA.id,
    full_name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1-416-555-0123',
    passport_number: 'AB123456',
    date_of_birth: '1995-06-15',
    nationality: 'Canadian',
    visa_status: 'approved' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  janeDoe: {
    id: 'student-jane-uuid',
    agency_id: testAgencies.agencyA.id,
    full_name: 'Jane Doe',
    email: 'jane.doe@email.com',
    phone: '+1-416-555-0124',
    passport_number: 'CD789012',
    date_of_birth: '1998-03-22',
    nationality: 'Canadian',
    visa_status: 'in_process' as const,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  bobSmith: {
    id: 'student-bob-uuid',
    agency_id: testAgencies.agencyB.id,
    full_name: 'Bob Smith',
    email: 'bob.smith@email.com',
    phone: '+61-3-5555-0123',
    passport_number: 'EF345678',
    date_of_birth: '1997-11-10',
    nationality: 'Australian',
    visa_status: 'approved' as const,
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
  },
}

export const testNotes = {
  note1: {
    id: 'note-1-uuid',
    student_id: testStudents.johnDoe.id,
    user_id: testUsers.agencyAAdmin.id,
    agency_id: testAgencies.agencyA.id,
    content: 'Student is very enthusiastic about the program.',
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z',
  },
  note2: {
    id: 'note-2-uuid',
    student_id: testStudents.johnDoe.id,
    user_id: testUsers.agencyAUser.id,
    agency_id: testAgencies.agencyA.id,
    content: 'Follow up needed on visa documentation.',
    created_at: '2025-01-06T14:30:00Z',
    updated_at: '2025-01-06T14:30:00Z',
  },
}

export const testDocuments = {
  passport: {
    id: 'doc-passport-uuid',
    student_id: testStudents.johnDoe.id,
    agency_id: testAgencies.agencyA.id,
    file_name: 'passport-scan.pdf',
    file_type: 'application/pdf',
    file_size: 245678,
    storage_path: 'students/student-john-uuid/documents/passport-scan.pdf',
    uploaded_by: testUsers.agencyAAdmin.id,
    created_at: '2025-01-05T09:00:00Z',
  },
  diploma: {
    id: 'doc-diploma-uuid',
    student_id: testStudents.johnDoe.id,
    agency_id: testAgencies.agencyA.id,
    file_name: 'diploma.jpg',
    file_type: 'image/jpeg',
    file_size: 512345,
    storage_path: 'students/student-john-uuid/documents/diploma.jpg',
    uploaded_by: testUsers.agencyAAdmin.id,
    created_at: '2025-01-05T09:15:00Z',
  },
}

export const testEnrollments = {
  johnUofT: {
    id: 'enrollment-john-uoft-uuid',
    student_id: testStudents.johnDoe.id,
    branch_id: testBranches.uoftMainCampus.id,
    college_id: testColleges.universityOfToronto.id,
    agency_id: testAgencies.agencyA.id,
    program_name: 'Bachelor of Computer Science',
    enrollment_date: '2025-09-01',
    status: 'active' as const,
    offer_letter_url: 'students/student-john-uuid/offers/offer-letter.pdf',
    created_at: '2025-01-04T00:00:00Z',
    updated_at: '2025-01-04T00:00:00Z',
  },
}

export const testActivityLogs = {
  studentCreated: {
    id: 'activity-1-uuid',
    agency_id: testAgencies.agencyA.id,
    user_id: testUsers.agencyAAdmin.id,
    entity_type: 'student',
    entity_id: testStudents.johnDoe.id,
    action: 'created',
    description: 'added new student John Doe',
    metadata: {
      student_name: 'John Doe',
      student_id: testStudents.johnDoe.id,
      passport_number: 'AB123456',
    },
    created_at: '2025-01-01T00:00:00Z',
  },
  studentUpdated: {
    id: 'activity-2-uuid',
    agency_id: testAgencies.agencyA.id,
    user_id: testUsers.agencyAAdmin.id,
    entity_type: 'student',
    entity_id: testStudents.johnDoe.id,
    action: 'updated',
    description: 'updated student John Doe',
    metadata: {
      student_name: 'John Doe',
      changed_fields: ['visa_status'],
    },
    created_at: '2025-01-10T00:00:00Z',
  },
}

/**
 * Sample CSV data for import tests
 */
export const sampleCSVData = {
  valid: `full_name,passport_number,email,phone,date_of_birth,nationality,visa_status
Alice Johnson,AB111111,alice@email.com,+1-416-555-0001,1996-01-15,Canadian,in_process
Bob Williams,AB222222,bob@email.com,+1-416-555-0002,1997-02-20,American,approved
Carol Davis,AB333333,carol@email.com,+1-416-555-0003,1998-03-25,British,denied`,

  invalidHeaders: `name,passport,email
John Doe,AB123456,john@email.com`,

  invalidData: `full_name,passport_number,email,phone,date_of_birth,nationality,visa_status
Missing Passport,,invalid-email,+1-416-555-0001,1996-01-15,Canadian,in_process
,AB222222,bob@email.com,+1-416-555-0002,1997-02-20,American,invalid_status`,

  duplicatePassport: `full_name,passport_number,email,phone,date_of_birth,nationality,visa_status
Alice Johnson,AB123456,alice@email.com,+1-416-555-0001,1996-01-15,Canadian,in_process
Bob Williams,AB123456,bob@email.com,+1-416-555-0002,1997-02-20,American,approved`,
}

/**
 * Sample file buffers for document upload tests
 */
export const sampleFiles = {
  validPDF: {
    name: 'test-document.pdf',
    type: 'application/pdf',
    size: 100000,
    buffer: Buffer.from('PDF content'),
  },
  validImage: {
    name: 'test-image.jpg',
    type: 'image/jpeg',
    size: 50000,
    buffer: Buffer.from('JPEG content'),
  },
  tooLarge: {
    name: 'large-file.pdf',
    type: 'application/pdf',
    size: 11 * 1024 * 1024, // 11MB (over 10MB limit)
    buffer: Buffer.alloc(11 * 1024 * 1024),
  },
  invalidType: {
    name: 'malicious.exe',
    type: 'application/x-msdownload',
    size: 10000,
    buffer: Buffer.from('EXE content'),
  },
}
