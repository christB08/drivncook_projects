// src/app/api/franchise/route.js
import { prisma } from "@/lib/prisma";

const FRONT_ORIGIN =
  process.env.NEXT_PUBLIC_FRONT_ORIGIN || "http://localhost:3001";

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONT_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// petite util pour répondre en JSON + CORS
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

// Réponse au preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// util: transforme ""/undefined -> null
const opt = (v) => (v === "" || v === undefined ? null : v);

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

    // stats (reversement selon pourcentageCA de chaque franchise)
    const data = franchises.map((f) => {
      const totalVentes = f.ventes.reduce((sum, v) => sum + v.montant, 0);
      const reversement = totalVentes * ((Number(f.pourcentageCA) || 0) / 100);

      const totalAppro = f.approvisionnements.reduce(
        (sum, a) => sum + a.quantite,
        0
      );
      const obligatoire = f.approvisionnements
        .filter((a) => a.obligatoire)
        .reduce((sum, a) => sum + a.quantite, 0);
      const pourcentageObligatoire =
        totalAppro > 0 ? Math.round((obligatoire / totalAppro) * 100) : 0;

      return { ...f, stats: { totalVentes, reversement, pourcentageObligatoire } };
    });

    return json(data, 200);
  } catch (error) {
    console.error("Erreur GET franchises:", error);
    return json({ error: "Erreur serveur" }, 500);
  }
}

// ✅ POST nouvelle franchise (avec nouveaux champs)
export async function POST(req) {
  try {
    const body = await req.json();

    // validations légères
    if (!body.nom) return json({ error: "Nom requis" }, 400);
    if (!body.contactEmail || !/^\S+@\S+\.\S+$/.test(body.contactEmail)) {
      return json({ error: "Email de contact invalide" }, 400);
    }
    if (body.siret && !/^\d{14}$/.test(String(body.siret))) {
      return json({ error: "SIRET invalide (14 chiffres)" }, 400);
    }

    const franchise = await prisma.franchise.create({
      data: {
        // Base + localisation
        nom: body.nom,
        adresse: opt(body.adresse),
        ville: opt(body.ville),
        codePostal: opt(body.codePostal),
        pays: opt(body.pays),

        // Financier
        droitEntree: Number(body.droitEntree),
        pourcentageCA:
          body.pourcentageCA != null ? Number(body.pourcentageCA) : 4.0,

        // Légal & finances
        formeJuridique: opt(body.formeJuridique),
        siret: opt(body.siret),
        tvaIntracom: opt(body.tvaIntracom),
        capitalSocial:
          body.capitalSocial != null && body.capitalSocial !== ""
            ? Number(body.capitalSocial)
            : null,
        iban: opt(body.iban),
        ribUrl: opt(body.ribUrl),

        // Contacts
        contactNom: body.contactNom,
        contactEmail: body.contactEmail,
        contactTelephone: body.contactTelephone,
        contactFactNom: opt(body.contactFactNom),
        contactFactEmail: opt(body.contactFactEmail),
        contactFactTelephone: opt(body.contactFactTelephone),

        // Pièces jointes
        kbisUrl: opt(body.kbisUrl),
        idCardUrl: opt(body.idCardUrl),
        proofAddressUrl: opt(body.proofAddressUrl),

        // Consentement
        cguAcceptedAt: opt(body.cguAcceptedAt)
          ? new Date(body.cguAcceptedAt)
          : null,

        // Métadonnées
        dateCreation: body.dateCreation
          ? new Date(body.dateCreation)
          : new Date(),
        statut: body.statut || "ACTIF",
      },
    });

    return json(franchise, 201);
  } catch (error) {
    if (error?.code === "P2002" && error?.meta?.target?.includes("siret")) {
      return json({ error: "SIRET déjà enregistré" }, 409);
    }
    console.error("Erreur POST franchises:", error);
    return json({ error: "Erreur serveur" }, 500);
  }
}

// ✅ PUT mise à jour franchise
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
        pourcentageCA:
          body.pourcentageCA != null ? Number(body.pourcentageCA) : undefined,

        formeJuridique: opt(body.formeJuridique),
        siret: opt(body.siret),
        tvaIntracom: opt(body.tvaIntracom),
        capitalSocial:
          body.capitalSocial != null && body.capitalSocial !== ""
            ? Number(body.capitalSocial)
            : null,

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

        cguAcceptedAt: opt(body.cguAcceptedAt)
          ? new Date(body.cguAcceptedAt)
          : null,

        dateCreation: body.dateCreation
          ? new Date(body.dateCreation)
          : undefined,
        statut: body.statut,
      },
    });

    return json(franchise, 200);
  } catch (error) {
    if (error?.code === "P2002" && error?.meta?.target?.includes("siret")) {
      return json({ error: "SIRET déjà enregistré" }, 409);
    }
    console.error("Erreur PUT franchises:", error);
    return json({ error: "Erreur serveur" }, 500);
  }
}

// ✅ DELETE suppression franchise
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const parsed = Number.parseInt(id);
    if (!Number.isFinite(parsed)) return json({ error: "ID invalide" }, 400);

    await prisma.franchise.delete({ where: { id: parsed } });
    return json({ success: true }, 200);
  } catch (error) {
    console.error("Erreur DELETE franchises:", error);
    return json({ error: "Erreur serveur" }, 500);
  }
}
