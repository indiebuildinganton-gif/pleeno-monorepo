// Mock for next/server types and functions

export class NextRequest {
  constructor(public url: string, public init?: RequestInit) {}
}

export class NextResponse {
  static json(data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    })
  }
}
