// Mock for @pleeno/database/server

export const createServerClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signInWithPassword: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }),
})
