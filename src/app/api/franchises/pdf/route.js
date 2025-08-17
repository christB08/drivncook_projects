// app/api/franchises/pdf/route.js
export const runtime = "nodejs"; // pdfkit ne fonctionne pas en edge

import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

// Prisma singleton
const globalForPrisma = globalThis;
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helpers
const formatEuro = (n) =>
  (Number(n) || 0).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });

const maskIban = (iban) => {
  if (!iban) return "—";
  const clean = String(iban).replace(/\s+/g, "");
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 4)} **** **** **** ${clean.slice(-4)}`;
};

// Fonction pour charger Arial
function loadArialFont(doc) {
  const fontPath = path.join(process.cwd(), "public", "fonts", "arial.ttf");
  if (fs.existsSync(fontPath)) {
    doc.font(fontPath);
  } else {
    console.warn("⚠ Police Arial introuvable :", fontPath);
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    let where;
    if (idParam != null) {
      const id = Number.parseInt(idParam, 10);
      if (!Number.isFinite(id)) {
        return NextResponse.json({ error: "Paramètre id invalide" }, { status: 400 });
      }
      where = { id };
    }

    const franchises = await prisma.franchise.findMany({
      where,
      include: {
        camions: true,
        ventes: true,
        approvisionnements: { include: { entrepot: true } },
        utilisateur: true,
      },
      orderBy: { id: "asc" },
    });

    if (!franchises.length) {
      return NextResponse.json({ error: "Aucune franchise trouvée" }, { status: 404 });
    }

    // ---------- PDF
    const buffers = [];
    const doc = new PDFDocument({ margin: 40, font: null }); // 🚫 Pas de Helvetica par défaut
    doc.on("data", (chunk) => buffers.push(chunk));
    const endPromise = new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    // Charger Arial
    loadArialFont(doc);

    doc.fontSize(20).text(
      where ? `Rapport de la Franchise #${franchises[0].id}` : "Rapport des Franchises - Driv'n Cook",
      { align: "center" }
    );
    doc.moveDown(2);

    let totalGlobal = 0;

    for (const f of franchises) {
      const totalVentes = f.ventes.reduce((sum, v) => sum + v.montant, 0);
      const reversement = totalVentes * ((Number(f.pourcentageCA) || 0) / 100);
      totalGlobal += totalVentes;

      doc.fontSize(16).fillColor("#000").text(`Franchise #${f.id} — ${f.nom}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);

      const ligneLoc = [
        f.adresse || "Adresse non renseignée",
        [f.codePostal, f.ville].filter(Boolean).join(" "),
        f.pays || "France",
      ]
        .filter(Boolean)
        .join(" — ");
      doc.text(`Adresse : ${ligneLoc}`);

      doc.text(
        `Contact : ${f.contactNom} (${f.contactEmail}${f.contactTelephone ? ", " + f.contactTelephone : ""})`
      );

      if (f.contactFactNom || f.contactFactEmail || f.contactFactTelephone) {
        doc.text(
          `Facturation : ${f.contactFactNom || "—"}${
            f.contactFactEmail ? " (" + f.contactFactEmail + ")" : ""
          }${f.contactFactTelephone ? " — " + f.contactFactTelephone : ""}`
        );
      }

      const legal = [
        f.formeJuridique ? `Forme : ${f.formeJuridique}` : null,
        f.siret ? `SIRET : ${f.siret}` : null,
        f.tvaIntracom ? `TVA : ${f.tvaIntracom}` : null,
        f.capitalSocial != null ? `Capital social : ${formatEuro(f.capitalSocial)}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      if (legal) doc.text(legal);

      doc.text(`Droit d'entrée : ${formatEuro(f.droitEntree)} — IBAN : ${maskIban(f.iban)}`);
      if (f.ribUrl) doc.text(`RIB : ${f.ribUrl}`);

      doc.text(`Date de création : ${new Date(f.dateCreation).toLocaleDateString("fr-FR")}`);
      doc.text(`Statut : ${f.statut}`);
      doc.moveDown(0.5);

      doc.text(`Camions attribués : ${f.camions.length}`);
      for (const c of f.camions) {
        doc.text(`   - ${c.immatriculation} (${c.etat})`);
      }

      doc.moveDown(0.5);
      doc.text(`Total ventes : ${formatEuro(totalVentes)}`);
      doc.text(`Reversement (${f.pourcentageCA}%): ${formatEuro(reversement)}`);

      if (f.ventes.length > 0) {
        const ventesParMois = {};
        for (const v of f.ventes) {
          const d = new Date(v.date);
          const mois = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" });
          ventesParMois[mois] = (ventesParMois[mois] || 0) + v.montant;
        }
        const labels = Object.keys(ventesParMois);
        const data = Object.values(ventesParMois);

        if (labels.length) {
          const chartConfig = {
            type: "bar",
            data: { labels, datasets: [{ label: "Chiffre d'affaires (€)", data, backgroundColor: "rgba(255,99,132,0.7)" }] },
          };

          try {
            const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
            const response = await axios.get(chartUrl, { responseType: "arraybuffer" });
            const imgBuffer = Buffer.from(response.data, "binary");

            doc.addPage();
            loadArialFont(doc); // 📌 Recharge Arial pour la nouvelle page
            doc.fontSize(16).text(`Graphique des ventes — ${f.nom}`, { align: "center" });
            doc.moveDown(1);
            doc.image(imgBuffer, { fit: [500, 300], align: "center", valign: "center" });
          } catch (e) {
            console.error("Erreur génération du graphique:", e);
          }
        }
      }

      if (f.kbisUrl || f.idCardUrl || f.proofAddressUrl || f.ribUrl) {
        doc.moveDown(0.5);
        doc.text("Pièces jointes :", { underline: true });
        if (f.kbisUrl) doc.text(` • KBIS : ${f.kbisUrl}`);
        if (f.idCardUrl) doc.text(` • Pièce d'identité : ${f.idCardUrl}`);
        if (f.proofAddressUrl) doc.text(` • Justificatif de domicile : ${f.proofAddressUrl}`);
        if (f.ribUrl) doc.text(` • RIB : ${f.ribUrl}`);
      }

      doc.moveDown(1.2);
      doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
    }

    if (!where) {
      doc.fontSize(14).fillColor("#333").text(`CA global : ${formatEuro(totalGlobal)}`, { align: "right" });
    }

    doc.end();
    const pdfBuffer = await endPromise;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${
          where ? `franchise_${franchises[0].id}.pdf` : "rapport_franchises.pdf"
        }`,
      },
    });
  } catch (e) {
    console.error("PDF franchises error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
