import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

export async function POST(req) {
  const { email, motDePasse } = await req.json()

  const user = await prisma.utilisateur.findUnique({ where: { email } })
  if (!user) {
    return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), { status: 401 })
  }

  const valid = await bcrypt.compare(motDePasse, user.motDePasse)
  if (!valid) {
    return new Response(JSON.stringify({ error: "Mot de passe incorrect" }), { status: 401 })
  }

  // Création d'un cookie de session
  cookies().set("auth", "true", { httpOnly: true })

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
