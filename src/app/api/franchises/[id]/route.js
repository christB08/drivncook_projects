import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req, context) {
  try {
    const { params } = await context // ⚡ attend l’objet context
    const id = parseInt(params.id)

    const franchise = await prisma.franchise.findUnique({
      where: { id },
      include: {
        camions: { include: { entretiens: true } },
        ventes: true,
        approvisionnements: { include: { entrepot: true } },
        utilisateur: true,
      },
    })

    if (!franchise) {
      return new Response(JSON.stringify({ error: "Franchise non trouvée" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify(franchise), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Erreur GET franchise detail:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
}
