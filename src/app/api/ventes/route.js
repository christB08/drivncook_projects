import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ✅ GET - liste des ventes
export async function GET() {
  try {
    const ventes = await prisma.vente.findMany({
      include: { franchise: true },
      orderBy: { date: "desc" },
    })

    return new Response(JSON.stringify(ventes), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Erreur GET ventes:", error)
    return new Response(JSON.stringify({ error: "Impossible de récupérer les ventes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// ✅ POST - ajouter une vente
export async function POST(req) {
  try {
    const body = await req.json()

    if (!body.montant || body.montant <= 0) {
      return new Response(JSON.stringify({ error: "Le montant doit être positif" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const vente = await prisma.vente.create({
      data: {
        montant: parseFloat(body.montant),
        date: body.date ? new Date(body.date) : new Date(),
        franchiseId: parseInt(body.franchiseId),
      },
      include: { franchise: true },
    })

    return new Response(JSON.stringify(vente), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    })
  } catch (error) {
    console.error("Erreur POST vente:", error)
    return new Response(JSON.stringify({ error: "Impossible d'ajouter la vente" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// ✅ PUT - modifier une vente
export async function PUT(req) {
  try {
    const body = await req.json()

    if (!body.id) {
      return new Response(JSON.stringify({ error: "ID requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const vente = await prisma.vente.update({
      where: { id: parseInt(body.id) },
      data: {
        montant: parseFloat(body.montant),
        date: body.date ? new Date(body.date) : undefined,
        franchiseId: parseInt(body.franchiseId),
      },
      include: { franchise: true },
    })

    return new Response(JSON.stringify(vente), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Erreur PUT vente:", error)
    return new Response(JSON.stringify({ error: "Impossible de modifier la vente" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// ✅ DELETE - supprimer une vente
export async function DELETE(req) {
  try {
    const { id } = await req.json()

    await prisma.vente.delete({
      where: { id: parseInt(id) },
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Erreur DELETE vente:", error)
    return new Response(JSON.stringify({ error: "Impossible de supprimer la vente" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
