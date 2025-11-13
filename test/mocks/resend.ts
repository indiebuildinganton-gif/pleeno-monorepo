// Mock for Resend
export class Resend {
  constructor(apiKey?: string) {}

  emails = {
    send: async () => ({ id: 'mock-email-id' }),
  }
}

export default Resend
