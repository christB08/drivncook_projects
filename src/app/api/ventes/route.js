import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ===== CORS ===== */
const ALLOWED_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:3001";

function corsHeaders(origin) {
  // si tu utilises des cookies, pas de '*'
  const allow = origin && origin.startsWith("http") ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
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

/* ===== ROUTES ===== */

// ✅ GET - liste des ventes
export async function GET(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const ventes = await prisma.vente.findMany({
      include: { franchise: true },
      orderBy: { date: "desc" },
    });

    return new Response(JSON.stringify(ventes), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur GET ventes:", error);
    return new Response(
      JSON.stringify({ error: "Impossible de récupérer les ventes" }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    );
  }
}

// ✅ POST - ajouter une vente
export async function POST(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const body = await req.json();

    if (!body.montant || body.montant <= 0) {
      return new Response(
        JSON.stringify({ error: "Le montant doit être positif" }),
        {
          status: 400,
          headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        }
      );
    }

    const vente = await prisma.vente.create({
      data: {
        montant: parseFloat(body.montant),
        date: body.date ? new Date(body.date) : new Date(),
        franchiseId: parseInt(body.franchiseId),
      },
      include: { franchise: true },
    });

    return new Response(JSON.stringify(vente), {
      status: 201,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur POST vente:", error);
    return new Response(
        JSON.stringify({ error: "Impossible d'ajouter la vente" }),
        {
          status: 500,
          headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        }
    );
  }
}

// ✅ PUT - modifier une vente
export async function PUT(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const body = await req.json();

    if (!body.id) {
      return new Response(JSON.stringify({ error: "ID requis" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const vente = await prisma.vente.update({
      where: { id: parseInt(body.id) },
      data: {
        montant: parseFloat(body.montant),
        date: body.date ? new Date(body.date) : undefined,
        franchiseId: parseInt(body.franchiseId),
      },
      include: { franchise: true },
    });

    return new Response(JSON.stringify(vente), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur PUT vente:", error);
    return new Response(
      JSON.stringify({ error: "Impossible de modifier la vente" }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    );
  }
}

// ✅ DELETE - supprimer une vente
export async function DELETE(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const { id } = await req.json();

    await prisma.vente.delete({ where: { id: parseInt(id) } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur DELETE vente:", error);
    return new Response(
      JSON.stringify({ error: "Impossible de supprimer la vente" }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    );
  }
}
