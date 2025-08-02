import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - liste des approvisionnements
export async function GET() {
  try {
    const approvisionnements = await prisma.approvisionnement.findMany({
      include: {
        franchise: true,
        entrepot: true,
      },
      orderBy: { date: "desc" },
    })
    return new Response(JSON.stringify(approvisionnements), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erreur GET approvisionnements:", error)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 })
  }
}

// POST - ajouter un approvisionnement
export async function POST(req) {
  try {
    const body = await req.json()

    if (!body.franchiseId || !body.entrepotId || !body.quantite) {
      return new Response(JSON.stringify({ error: "Champs manquants" }), { status: 400 })
    }

    // Vérifier la cohérence du stock
    const entrepot = await prisma.entrepot.findUnique({
      where: { id: parseInt(body.entrepotId) },
    })

    if (!entrepot) {
      return new Response(JSON.stringify({ error: "Entrepôt introuvable" }), { status: 404 })
    }

    if (entrepot.stockUtilise + parseInt(body.quantite) > entrepot.stockTotal) {
      return new Response(JSON.stringify({
        error: "Stock insuffisant dans l'entrepôt"
      }), { status: 400 })
    }

    // Mettre à jour le stock de l'entrepôt
    await prisma.entrepot.update({
      where: { id: entrepot.id },
      data: {
        stockUtilise: entrepot.stockUtilise + parseInt(body.quantite),
      },
    })

    const appro = await prisma.approvisionnement.create({
      data: {
        franchiseId: parseInt(body.franchiseId),
        entrepotId: parseInt(body.entrepotId),
        quantite: parseInt(body.quantite),
        obligatoire: body.obligatoire || false,
      },
      include: {
        franchise: true,
        entrepot: true,
      },
    })

    return new Response(JSON.stringify(appro), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erreur POST approvisionnement:", error)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 })
  }
}

// DELETE - supprimer un approvisionnement
export async function DELETE(req) {
  try {
    const { id } = await req.json()
    if (!id) {
      return new Response(JSON.stringify({ error: "ID manquant" }), { status: 400 })
    }

    const appro = await prisma.approvisionnement.delete({
      where: { id: parseInt(id) },
    })

    return new Response(JSON.stringify({ success: true, deleted: appro }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erreur DELETE approvisionnement:", error)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 })
  }
}
