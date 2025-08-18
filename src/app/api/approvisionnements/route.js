import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ---------- CORS ---------- */
const ALLOWED_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:3001";

function corsHeaders(origin) {
  const allow = origin && origin.startsWith("http") ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allow,        // pas de * si credentials
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// Preflight
export function OPTIONS(req) {
  const origin = req.headers.get("origin") || undefined;
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

/* ---------- ROUTES ---------- */

// GET - liste des approvisionnements
export async function GET(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const approvisionnements = await prisma.approvisionnement.findMany({
      include: { franchise: true, entrepot: true },
      orderBy: { date: "desc" }, // ton modèle a un champ date (default now)
    });

    return new Response(JSON.stringify(approvisionnements), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur GET approvisionnements:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}

// POST - ajouter un approvisionnement
export async function POST(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const body = await req.json();

    if (!body.franchiseId || !body.entrepotId || !body.quantite) {
      return new Response(JSON.stringify({ error: "Champs manquants" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const entrepot = await prisma.entrepot.findUnique({
      where: { id: parseInt(body.entrepotId) },
    });
    if (!entrepot) {
      return new Response(JSON.stringify({ error: "Entrepôt introuvable" }), {
        status: 404,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const qte = parseInt(body.quantite);
    if (entrepot.stockUtilise + qte > entrepot.stockTotal) {
      return new Response(
        JSON.stringify({ error: "Stock insuffisant dans l'entrepôt" }),
        {
          status: 400,
          headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        }
      );
    }

    // maj stock
    await prisma.entrepot.update({
      where: { id: entrepot.id },
      data: { stockUtilise: entrepot.stockUtilise + qte },
    });

    const appro = await prisma.approvisionnement.create({
      data: {
        franchiseId: parseInt(body.franchiseId),
        entrepotId: parseInt(body.entrepotId),
        quantite: qte,
        obligatoire: !!body.obligatoire,
        // date: valeur par défaut Prisma (now) si ton modèle la définit
      },
      include: { franchise: true, entrepot: true },
    });

    return new Response(JSON.stringify(appro), {
      status: 201,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur POST approvisionnement:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}

// DELETE - supprimer un approvisionnement
export async function DELETE(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "ID manquant" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const appro = await prisma.approvisionnement.delete({
      where: { id: parseInt(id) },
    });

    // NOTE: ici on ne décrémente pas le stock de l'entrepôt.
    // Si tu veux rollback le stock, on peut l'ajouter.

    return new Response(JSON.stringify({ success: true, deleted: appro }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur DELETE approvisionnement:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}
