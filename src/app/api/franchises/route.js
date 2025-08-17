// src/app/api/franchises/route.js
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ---- CORS
const FRONT_ORIGIN = process.env.NEXT_PUBLIC_FRONT_ORIGIN || "http://localhost:3001";
const corsHeaders = {
  "Access-Control-Allow-Origin": FRONT_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// util: ""/undefined -> null
const opt = (v) => (v === "" || v === undefined ? null : v);

// ================= GET =================
export async function GET() {
  try {
    const franchises = await prisma.franchise.findMany({
      include: {
        camions: { include: { entretiens: true } },
        ventes: true,
        approvisionnements: { include: { entrepot: true } },
      },
      orderBy: { id: "asc" },
    });

    const data = franchises.map((f) => {
      const totalVentes = f.ventes.reduce((s, v) => s + v.montant, 0);
      const reversement = totalVentes * ((Number(f.pourcentageCA) || 0) / 100);

      const totalAppro = f.approvisionnements.reduce((s, a) => s + a.quantite, 0);
      const obligatoire = f.approvisionnements
        .filter((a) => a.obligatoire)
        .reduce((s, a) => s + a.quantite, 0);
      const pourcentageObligatoire = totalAppro > 0 ? Math.round((obligatoire / totalAppro) * 100) : 0;

      return { ...f, stats: { totalVentes, reversement, pourcentageObligatoire } };
    });

    return json(data);
  } catch (e) {
    console.error("GET /franchises:", e);
    return json({ error: "Erreur serveur" }, 500);
  }
}

// ================= POST =================
// crée la Franchise ET (optionnel) l'utilisateur lié si userEmail + userPassword fournis
export async function POST(req) {
  try {
    const body = await req.json();

    // validations légères
    if (!body.nom) return json({ error: "Nom requis" }, 400);
    if (!body.contactEmail || !/^\S+@\S+\.\S+$/.test(body.contactEmail))
      return json({ error: "Email de contact invalide" }, 400);
    if (body.siret && !/^\d{14}$/.test(String(body.siret)))
      return json({ error: "SIRET invalide (14 chiffres)" }, 400);

    const userEmail = body.userEmail?.trim();
    const userPassword = body.userPassword;

    const result = await prisma.$transaction(async (tx) => {
      // 1) Franchise
      const franchise = await tx.franchise.create({
        data: {
          // base + localisation
          nom: body.nom,
          adresse: opt(body.adresse),
          ville: opt(body.ville),
          codePostal: opt(body.codePostal),
          pays: opt(body.pays),

          // financier
          droitEntree: Number(body.droitEntree),
          pourcentageCA: body.pourcentageCA != null ? Number(body.pourcentageCA) : 4.0,

          // légal/financier
          formeJuridique: opt(body.formeJuridique),
          siret: opt(body.siret),
          tvaIntracom: opt(body.tvaIntracom),
          capitalSocial:
            body.capitalSocial != null && body.capitalSocial !== "" ? Number(body.capitalSocial) : null,
          iban: opt(body.iban),
          ribUrl: opt(body.ribUrl),

          // contacts
          contactNom: body.contactNom,
          contactEmail: body.contactEmail,
          contactTelephone: body.contactTelephone,
          contactFactNom: opt(body.contactFactNom),
          contactFactEmail: opt(body.contactFactEmail),
          contactFactTelephone: opt(body.contactFactTelephone),

          // pièces jointes
          kbisUrl: opt(body.kbisUrl),
          idCardUrl: opt(body.idCardUrl),
          proofAddressUrl: opt(body.proofAddressUrl),

          // consentement & méta
          cguAcceptedAt: opt(body.cguAcceptedAt) ? new Date(body.cguAcceptedAt) : null,
          dateCreation: body.dateCreation ? new Date(body.dateCreation) : new Date(),
          statut: body.statut || "ACTIF",
        },
      });

      // 2) Utilisateur lié (si fourni)
      let user = null;
      if (userEmail && userPassword) {
        const exists = await tx.utilisateur.findUnique({ where: { email: userEmail } });
        if (exists) throw new Error("EMAIL_TAKEN");

        const hash = await bcrypt.hash(userPassword, 10);
        user = await tx.utilisateur.create({
          data: {
            email: userEmail,
            motDePasse: hash,
            role: "FRANCHISE",
            franchiseId: franchise.id, // ⚠️ @unique => 1 user / franchise
          },
        });
      }

      return { franchise, user };
    });

    return json(result, 201);
  } catch (e) {
    if (e?.code === "P2002" && e?.meta?.target?.includes("siret"))
      return json({ error: "SIRET déjà enregistré" }, 409);
    if (String(e?.message) === "EMAIL_TAKEN")
      return json({ error: "Email utilisateur déjà utilisé" }, 409);

    console.error("POST /franchises:", e);
    return json({ error: "Erreur serveur" }, 500);
  }
}

// ================= PUT =================
export async function PUT(req) {
  try {
    const body = await req.json();
    const id = Number.parseInt(body.id);
    if (!Number.isFinite(id)) return json({ error: "ID requis" }, 400);

    const franchise = await prisma.franchise.update({
      where: { id },
      data: {
        nom: body.nom,
        adresse: opt(body.adresse),
        ville: opt(body.ville),
        codePostal: opt(body.codePostal),
        pays: opt(body.pays),

        droitEntree: Number(body.droitEntree),
        pourcentageCA: body.pourcentageCA != null ? Number(body.pourcentageCA) : undefined,

        formeJuridique: opt(body.formeJuridique),
        siret: opt(body.siret),
        tvaIntracom: opt(body.tvaIntracom),
        capitalSocial:
          body.capitalSocial != null && body.capitalSocial !== "" ? Number(body.capitalSocial) : null,

        iban: opt(body.iban),
        ribUrl: opt(body.ribUrl),

        contactNom: body.contactNom,
        contactEmail: body.contactEmail,
        contactTelephone: body.contactTelephone,
        contactFactNom: opt(body.contactFactNom),
        contactFactEmail: opt(body.contactFactEmail),
        contactFactTelephone: opt(body.contactFactTelephone),

        kbisUrl: opt(body.kbisUrl),
        idCardUrl: opt(body.idCardUrl),
        proofAddressUrl: opt(body.proofAddressUrl),

        cguAcceptedAt: opt(body.cguAcceptedAt) ? new Date(body.cguAcceptedAt) : null,

        dateCreation: body.dateCreation ? new Date(body.dateCreation) : undefined,
        statut: body.statut,
      },
    });

    return json(franchise);
  } catch (e) {
    if (e?.code === "P2002" && e?.meta?.target?.includes("siret"))
      return json({ error: "SIRET déjà enregistré" }, 409);
    console.error("PUT /franchises:", e);
    return json({ error: "Erreur serveur" }, 500);
  }
}

// ================= DELETE =================
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const parsed = Number.parseInt(id);
    if (!Number.isFinite(parsed)) return json({ error: "ID invalide" }, 400);

    await prisma.franchise.delete({ where: { id: parsed } });
    return json({ success: true });
  } catch (e) {
    console.error("DELETE /franchises:", e);
    return json({ error: "Erreur serveur" }, 500);
  }
}
