export class NextRequest {
  url: string
  method: string
  body: any
  headers: Headers

  constructor(url: string | URL, init?: RequestInit) {
    this.url = url.toString()
    this.method = init?.method || 'GET'
    this.body = init?.body
    this.headers = new Headers(init?.headers || {})
  }

  async json() {
    return JSON.parse(this.body as string)
  }
}

export class NextResponse {
  status: number
  private _body: any

  constructor(body: any, init?: { status?: number }) {
    this.status = init?.status || 200
    this._body = body
  }

  async json() {
    return this._body
  }

  static json(body: any, init?: any) {
    return new NextResponse(body, init)
  }
}
