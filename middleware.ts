import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const isApi = req.nextUrl.pathname.startsWith("/api")
    const isAuth = !!req.nextauth.token

    if (isApi && !isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isApi = req.nextUrl.pathname.startsWith("/api")
        if (isApi) return true
        return !!token
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
)

export const config = {
  matcher: [
    "/((?!api/auth|api/backup|login|_next/static|_next/image|favicon.ico).*)",
  ],
}
