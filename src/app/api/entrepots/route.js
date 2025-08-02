import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - liste des entrepôts
export async function GET() {
  try {
    const entrepots = await prisma.entrepot.findMany()
    return new Response(JSON.stringify(entrepots), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Erreur GET entrepots:", err)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// POST - ajouter un entrepôt
export async function POST(req) {
  try {
    const body = await req.json()
    const stockTotal = parseInt(body.stockTotal)
    const stockUtilise = parseInt(body.stockUtilise)

    if (!body.ville || isNaN(stockTotal) || isNaN(stockUtilise)) {
      return new Response(JSON.stringify({ error: "Champs invalides" }), { status: 400 })
    }

    if (stockUtilise > stockTotal) {
      return new Response(JSON.stringify({ error: "Le stock utilisé ne peut pas dépasser le stock total" }), {
        status: 400,
      })
    }

    const entrepot = await prisma.entrepot.create({
      data: { ville: body.ville, stockTotal, stockUtilise },
    })

    return new Response(JSON.stringify(entrepot), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Erreur POST entrepot:", err)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 })
  }
}

// PUT - modifier un entrepôt
export async function PUT(req) {
  try {
    const body = await req.json()
    const stockTotal = parseInt(body.stockTotal)
    const stockUtilise = parseInt(body.stockUtilise)

    if (stockUtilise > stockTotal) {
      return new Response(JSON.stringify({ error: "Le stock utilisé ne peut pas dépasser le stock total" }), {
        status: 400,
      })
    }

    const entrepot = await prisma.entrepot.update({
      where: { id: parseInt(body.id) },
      data: { ville: body.ville, stockTotal, stockUtilise },
    })

    return new Response(JSON.stringify(entrepot), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Erreur PUT entrepot:", err)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 })
  }
}

// DELETE - supprimer un entrepôt
export async function DELETE(req) {
  try {
    const { id } = await req.json()
    await prisma.entrepot.delete({ where: { id: parseInt(id) } })
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Erreur DELETE entrepot:", err)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 })
  }
}
