// src/app/api/me/route.js
export const runtime = "nodejs";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const FRONT_ORIGIN =
  process.env.NEXT_PUBLIC_FRONT_ORIGIN || "http://localhost:3001";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const CORS = {
  "Access-Control-Allow-Origin": FRONT_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
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

export async function GET() {
  try {
    // ⚠️ Next 15 : cookies() doit être await
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return json({ error: "Non authentifié." }, 401);

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET); // { uid, role, fid }
    } catch {
      return json({ error: "Token invalide." }, 401);
    }

    // On récupère l’utilisateur + sa franchise (si liée)
    const user = await prisma.utilisateur.findUnique({
      where: { id: payload.uid },
      include: {
        franchise: {
          include: {
            ventes: true,
            camions: true,
            approvisionnements: { include: { entrepot: true } },
          },
        },
      },
    });

    if (!user) return json({ error: "Utilisateur introuvable." }, 404);

    // Résumé/statistiques si une franchise existe
    let franchise = null;
    let stats = null;

    if (user.franchise) {
      const f = user.franchise;
      const totalVentes = f.ventes.reduce((s, v) => s + v.montant, 0);
      const reversement = totalVentes * ((Number(f.pourcentageCA) || 0) / 100);
      const totalAppro = f.approvisionnements.reduce((s, a) => s + a.quantite, 0);
      const obligatoire = f.approvisionnements
        .filter((a) => a.obligatoire)
        .reduce((s, a) => s + a.quantite, 0);
      const pourcentageObligatoire =
        totalAppro > 0 ? Math.round((obligatoire / totalAppro) * 100) : 0;

      franchise = {
        id: f.id,
        nom: f.nom,
        adresse: f.adresse,
        ville: f.ville,
        codePostal: f.codePostal,
        pays: f.pays,
        droitEntree: f.droitEntree,
        pourcentageCA: f.pourcentageCA,
        statut: f.statut,
        dateCreation: f.dateCreation,
        camions: f.camions,
        ventes: f.ventes,
        approvisionnements: f.approvisionnements,
      };

      stats = {
        totalVentes,
        reversement,
        pourcentageObligatoire,
        nbCamions: f.camions.length,
        nbAppro: f.approvisionnements.length,
      };
    }

    return json({
      user: { id: user.id, email: user.email, role: user.role, franchiseId: user.franchiseId },
      franchise,
      stats,
    });
  } catch (e) {
    console.error("/api/me error:", e);
    return json({ error: "Erreur serveur." }, 500);
  }
}
