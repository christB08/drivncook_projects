import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ------------ CORS ------------- */
const ALLOWED_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:3001";

function corsHeaders(origin) {
  const allow = origin && origin.startsWith("http") ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allow,        // pas de * si credentials
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// Réponse au préflight
export function OPTIONS(req) {
  const origin = req.headers.get("origin") || undefined;
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

/* ------------ ROUTES ------------- */

// POST - ajouter un entretien
export async function POST(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const body = await req.json();

    if (!body?.type || !body?.camionId) {
      return new Response(JSON.stringify({ error: "Type et camionId requis" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const entretien = await prisma.entretien.create({
      data: {
        type: String(body.type),
        details: body.details ? String(body.details) : null,
        camionId: parseInt(body.camionId),
        // date auto si tu as un champ dans le modèle (sinon ignore)
      },
    });

    return new Response(JSON.stringify(entretien), {
      status: 201,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Erreur POST entretien:", e);
    return new Response(JSON.stringify({ error: "Impossible d'ajouter l'entretien" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}

// DELETE - supprimer un entretien
export async function DELETE(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const { id } = await req.json();
    await prisma.entretien.delete({ where: { id: parseInt(id) } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Erreur DELETE entretien:", e);
    return new Response(JSON.stringify({ error: "Impossible de supprimer l'entretien" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}
