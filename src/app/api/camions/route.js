import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const FRONT_ORIGIN = process.env.FRONT_ORIGIN || "http://localhost:3001";
const cors = (extra = {}) => ({
  "Access-Control-Allow-Origin": FRONT_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  ...extra,
});

// Preflight
export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

// GET
export async function GET() {
  const camions = await prisma.camion.findMany({
    include: { franchise: true, entretiens: true },
  });
  return new Response(JSON.stringify(camions), {
    status: 200,
    headers: cors({ "Content-Type": "application/json" }),
  });
}

// POST
export async function POST(req) {
  const body = await req.json();
  if (!body.immatriculation || !body.etat || !body.franchiseId) {
    return new Response(JSON.stringify({ error: "Champs manquants" }), {
      status: 400,
      headers: cors({ "Content-Type": "application/json" }),
    });
  }
  const camion = await prisma.camion.create({
    data: {
      immatriculation: body.immatriculation,
      etat: body.etat,
      franchiseId: parseInt(body.franchiseId),
    },
    include: { franchise: true, entretiens: true },
  });
  return new Response(JSON.stringify(camion), {
    status: 200,
    headers: cors({ "Content-Type": "application/json" }),
  });
}

// PUT
export async function PUT(req) {
  const body = await req.json();
  const camion = await prisma.camion.update({
    where: { id: parseInt(body.id) },
    data: {
      immatriculation: body.immatriculation,
      etat: body.etat,
      franchiseId: parseInt(body.franchiseId),
    },
    include: { franchise: true, entretiens: true },
  });
  return new Response(JSON.stringify(camion), {
    status: 200,
    headers: cors({ "Content-Type": "application/json" }),
  });
}

// DELETE
export async function DELETE(req) {
  const { id } = await req.json();
  await prisma.camion.delete({ where: { id: parseInt(id) } });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: cors({ "Content-Type": "application/json" }),
  });
}
