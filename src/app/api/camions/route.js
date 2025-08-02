import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - liste tous les camions avec leurs entretiens
export async function GET() {
  const camions = await prisma.camion.findMany({
    include: {
      franchise: true,
      entretiens: true, // ✅ on ajoute cette ligne
    },
  })
  return new Response(JSON.stringify(camions), {
    headers: { "Content-Type": "application/json" },
  })
}

// POST - ajouter un camion
export async function POST(req) {
  const body = await req.json()
  if (!body.immatriculation || !body.etat || !body.franchiseId) {
    return new Response(JSON.stringify({ error: "Champs manquants" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const camion = await prisma.camion.create({
    data: {
      immatriculation: body.immatriculation,
      etat: body.etat,
      franchiseId: parseInt(body.franchiseId),
    },
    include: {
      franchise: true,
      entretiens: true,
    },
  })

  return new Response(JSON.stringify(camion), {
    headers: { "Content-Type": "application/json" },
  })
}

// PUT - modifier un camion
export async function PUT(req) {
  const body = await req.json()
  const camion = await prisma.camion.update({
    where: { id: parseInt(body.id) },
    data: {
      immatriculation: body.immatriculation,
      etat: body.etat,
      franchiseId: parseInt(body.franchiseId),
    },
    include: {
      franchise: true,
      entretiens: true,
    },
  })
  return new Response(JSON.stringify(camion), {
    headers: { "Content-Type": "application/json" },
  })
}

// DELETE - supprimer un camion
export async function DELETE(req) {
  const { id } = await req.json()
  await prisma.camion.delete({ where: { id: parseInt(id) } })
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  })
}
