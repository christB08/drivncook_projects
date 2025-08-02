import { cookies } from "next/headers"

export async function POST() {
  // Supprime le cookie de connexion
  cookies().set("auth", "", { maxAge: 0 })
  
  return new Response(null, {
    status: 302,
    headers: { Location: "/login" }, // redirection vers login
  })
}
