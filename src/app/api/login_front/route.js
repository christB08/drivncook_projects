export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const FRONT_ORIGIN = process.env.NEXT_PUBLIC_FRONT_ORIGIN || "http://localhost:3001";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const CORS = {
  "Access-Control-Allow-Origin": FRONT_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body?.email || "").trim();
    const motDePasse = body?.motDePasse || "";

    console.log("[LOGIN] payload:", { email, hasPwd: !!motDePasse });

    if (!email || !motDePasse) return json({ error: "Email et mot de passe requis." }, 400);

    const user = await prisma.utilisateur.findUnique({
      where: { email },
      include: { franchise: true },
    });

    if (!user) {
      console.warn("[LOGIN] user not found for email:", email);
      return json({ error: "Utilisateur introuvable." }, 404);
    }

    // motDePasse en base doit être un hash bcrypt ($2a$ ou $2b$…)
    console.log("[LOGIN] stored hash:", user.motDePasse?.slice(0, 7));

    const ok = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!ok) {
      console.warn("[LOGIN] bad password for:", email);
      return json({ error: "Mot de passe incorrect." }, 401);
    }

    const token = jwt.sign(
      { uid: user.id, role: user.role, fid: user.franchiseId ?? null },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
     httpOnly: true,
     sameSite: "lax",
     secure: process.env.NODE_ENV === "production",
     path: "/",
     maxAge: 60 * 60 * 24 * 7,
});


    console.log("[LOGIN] success:", { id: user.id, role: user.role, fid: user.franchiseId });

    return json({
      user: { id: user.id, email: user.email, role: user.role, franchiseId: user.franchiseId },
    });
  } catch (e) {
    console.error("[LOGIN] error:", e);
    return json({ error: "Erreur serveur." }, 500);
  }
}
