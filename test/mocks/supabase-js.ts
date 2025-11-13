// Mock for @supabase/supabase-js
export const createClient = () => ({
  auth: {
    admin: {
      updateUserById: () => ({ data: {}, error: null }),
    },
  },
})

export default {
  createClient,
}
