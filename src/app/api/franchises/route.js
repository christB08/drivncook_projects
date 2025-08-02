import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

// ✅ GET toutes les franchises avec camions + ventes + approvisionnements
export async function GET() {
  try {
    const franchises = await prisma.franchise.findMany({
      include: {
        camions: {
          include: { entretiens: true },
        },
        ventes: true,
        approvisionnements: {
          include: { entrepot: true },
        },
      },
      orderBy: { id: "asc" },
    })

    // ➕ Calculer les stats pour chaque franchise
    const data = franchises.map((f) => {
      const totalVentes = f.ventes.reduce((sum, v) => sum + v.montant, 0)
      const reversement = totalVentes * 0.04

      const totalAppro = f.approvisionnements.reduce(
        (sum, a) => sum + a.quantite,
        0
      )
      const obligatoire = f.approvisionnements
        .filter((a) => a.obligatoire)
        .reduce((sum, a) => sum + a.quantite, 0)
      const pourcentageObligatoire =
        totalAppro > 0 ? Math.round((obligatoire / totalAppro) * 100) : 0

      return {
        ...f,
        stats: {
          totalVentes,
          reversement,
          pourcentageObligatoire,
        },
      }
    })

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Erreur GET franchises:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}

// ✅ POST nouvelle franchise
export async function POST(req) {
  try {
    const body = await req.json()
    const franchise = await prisma.franchise.create({
      data: {
        nom: body.nom,
        adresse: body.adresse,
        droitEntree: parseFloat(body.droitEntree),
        contactNom: body.contactNom,
        contactEmail: body.contactEmail,
        contactTelephone: body.contactTelephone,
        dateCreation: body.dateCreation
          ? new Date(body.dateCreation)
          : new Date(),
        statut: body.statut || "ACTIF",
      },
    })
    return new Response(JSON.stringify(franchise), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}

// ✅ PUT mise à jour franchise
export async function PUT(req) {
  try {
    const body = await req.json()
    const franchise = await prisma.franchise.update({
      where: { id: parseInt(body.id) },
      data: {
        nom: body.nom,
        adresse: body.adresse,
        droitEntree: parseFloat(body.droitEntree),
        contactNom: body.contactNom,
        contactEmail: body.contactEmail,
        contactTelephone: body.contactTelephone,
        dateCreation: body.dateCreation
          ? new Date(body.dateCreation)
          : undefined,
        statut: body.statut,
      },
    })
    return new Response(JSON.stringify(franchise), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}

// ✅ DELETE suppression franchise
export async function DELETE(req) {
  try {
    const { id } = await req.json()
    await prisma.franchise.delete({
      where: { id: parseInt(id) },
    })
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}
