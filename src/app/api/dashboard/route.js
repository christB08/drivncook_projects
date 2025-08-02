import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  const franchisesCount = await prisma.franchise.count()
  const camionsCount = await prisma.camion.count()
  const entrepotsCount = await prisma.entrepot.count()
  
  const ventes = await prisma.vente.findMany()
  const totalCA = ventes.reduce((sum, v) => sum + v.montant, 0)
  const commission = totalCA * 0.04

  return new Response(JSON.stringify({
    franchisesCount,
    camionsCount,
    entrepotsCount,
    totalCA,
    commission
  }), {
    headers: { "Content-Type": "application/json" },
  })
}
