import { prisma } from "@/lib/prisma";

export async function GET(_req, { params }) {
  try {
    const id = Number.parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      return new Response(JSON.stringify({ error: "ID invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const franchise = await prisma.franchise.findUnique({
      where: { id },
      include: {
        camions: { include: { entretiens: true } },
        ventes: true,
        approvisionnements: { include: { entrepot: true } },
        utilisateur: true,
      },
    });

    if (!franchise) {
      return new Response(JSON.stringify({ error: "Franchise non trouvée" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(franchise), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur GET /franchises/:id →", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
