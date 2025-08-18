import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* ---------- CORS ---------- */
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

// Preflight
export function OPTIONS(req) {
  const origin = req.headers.get("origin") || undefined;
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

/* ---------- ROUTES ---------- */

// GET - liste des entrepôts
export async function GET(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const entrepots = await prisma.entrepot.findMany();
    return new Response(JSON.stringify(entrepots), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur GET entrepots:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}

// POST - ajouter un entrepôt
export async function POST(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const body = await req.json();
    const stockTotal = parseInt(body.stockTotal);
    const stockUtilise = parseInt(body.stockUtilise);

    if (!body.ville || isNaN(stockTotal) || isNaN(stockUtilise)) {
      return new Response(JSON.stringify({ error: "Champs invalides" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    if (stockUtilise > stockTotal) {
      return new Response(
        JSON.stringify({ error: "Le stock utilisé ne peut pas dépasser le stock total" }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const entrepot = await prisma.entrepot.create({
      data: { ville: body.ville, stockTotal, stockUtilise },
    });

    return new Response(JSON.stringify(entrepot), {
      status: 201,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur POST entrepot:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}

// PUT - modifier un entrepôt
export async function PUT(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const body = await req.json();
    const stockTotal = parseInt(body.stockTotal);
    const stockUtilise = parseInt(body.stockUtilise);

    if (stockUtilise > stockTotal) {
      return new Response(
        JSON.stringify({ error: "Le stock utilisé ne peut pas dépasser le stock total" }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const entrepot = await prisma.entrepot.update({
      where: { id: parseInt(body.id) },
      data: { ville: body.ville, stockTotal, stockUtilise },
    });

    return new Response(JSON.stringify(entrepot), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur PUT entrepot:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}

// DELETE - supprimer un entrepôt
export async function DELETE(req) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const { id } = await req.json();
    await prisma.entrepot.delete({ where: { id: parseInt(id) } });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur DELETE entrepot:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
}
