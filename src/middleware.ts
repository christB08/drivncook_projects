import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("auth")?.value

  // si pas connecté et route différente de /login
  if (!auth && !req.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // si déjà connecté et essaie d'aller sur /login → redirige vers accueil
  if (auth && req.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

// Liste des pages protégées
export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
}
