import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  const ventes = await prisma.vente.findMany({
    include: { franchise: true }
  })

  const stats = ventes.reduce((acc, v) => {
    const nom = v.franchise.nom
    acc[nom] = (acc[nom] || 0) + v.montant
    return acc
  }, {})

  const data = Object.entries(stats).map(([name, value]) => ({
    name,
    value
  }))

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  })
}
