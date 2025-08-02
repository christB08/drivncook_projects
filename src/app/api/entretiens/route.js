import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// POST - ajouter un entretien
export async function POST(req) {
  const body = await req.json()

  if (!body.type || !body.camionId) {
    return new Response(JSON.stringify({ error: "Type et CamionId requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const entretien = await prisma.entretien.create({
    data: {
      type: body.type,
      details: body.details || null,
      camionId: parseInt(body.camionId),
    },
  })

  return new Response(JSON.stringify(entretien), {
    headers: { "Content-Type": "application/json" },
  })
}

// DELETE - supprimer un entretien (optionnel)
export async function DELETE(req) {
  const { id } = await req.json()
  await prisma.entretien.delete({ where: { id: parseInt(id) } })
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  })
}
