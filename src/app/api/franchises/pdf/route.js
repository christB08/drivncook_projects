import { PrismaClient } from "@prisma/client"
import PDFDocument from "pdfkit"
import { NextResponse } from "next/server"
import path from "path"
import axios from "axios"

const prisma = new PrismaClient()

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  const franchises = id
    ? await prisma.franchise.findMany({
        where: { id: parseInt(id) },
        include: {
          camions: true,
          ventes: true,
          approvisionnements: { include: { entrepot: true } },
        },
      })
    : await prisma.franchise.findMany({
        include: {
          camions: true,
          ventes: true,
          approvisionnements: { include: { entrepot: true } },
        },
        orderBy: { id: "asc" },
      })

  const buffers = []
  const doc = new PDFDocument({ margin: 40, font: null })
  doc.on("data", (chunk) => buffers.push(chunk))
  const endPromise = new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)))
  })

  doc.font(path.join(process.cwd(), "public/fonts/ARIAL.TTF"))

  doc.fontSize(20).text(
    id ? `Rapport de la Franchise #${id}` : "Rapport des Franchises - Driv'n Cook",
    { align: "center" }
  )
  doc.moveDown(2)

  let totalGlobal = 0

  for (const f of franchises) {
    const totalVentes = f.ventes.reduce((sum, v) => sum + v.montant, 0)
    const reversement = (totalVentes * (f.pourcentageCA / 100)).toFixed(2)
    totalGlobal += totalVentes

    doc.fontSize(16).fillColor("#000").text(`Franchise #${f.id} - ${f.nom}`, {
      underline: true,
    })
    doc.moveDown(0.5)

    doc.fontSize(12)
    doc.text(`Adresse : ${f.adresse || "Non renseignée"}`)
    doc.text(`Contact : ${f.contactNom} (${f.contactEmail}, ${f.contactTelephone})`)
    doc.text(`Date de création : ${new Date(f.dateCreation).toLocaleDateString()}`)
    doc.text(`Statut : ${f.statut}`)
    doc.text(`Droit d'entrée : ${f.droitEntree} €`)
    doc.moveDown(0.5)

    doc.text(`Camions attribués : ${f.camions.length}`)
    f.camions.forEach((c) => {
      doc.text(`   - ${c.immatriculation} (${c.etat})`)
    })

    doc.moveDown(0.5)
    doc.text(`Total ventes : ${totalVentes.toFixed(2)} €`)
    doc.text(`Reversement (${f.pourcentageCA}%) : ${reversement} €`)

    // 🔥 Graphique des ventes par mois
    if (f.ventes.length > 0) {
      const ventesParMois = {}
      f.ventes.forEach((v) => {
        const mois = new Date(v.date).toLocaleString("fr-FR", { month: "short", year: "2-digit" })
        ventesParMois[mois] = (ventesParMois[mois] || 0) + v.montant
      })

      const labels = Object.keys(ventesParMois)
      const data = Object.values(ventesParMois)

      const chartConfig = {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Chiffre d'affaires (€)",
              data,
              backgroundColor: "rgba(255, 99, 132, 0.7)",
            },
          ],
        },
      }

      try {
        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(
          JSON.stringify(chartConfig)
        )}`
        const response = await axios.get(chartUrl, { responseType: "arraybuffer" })
        const imgBuffer = Buffer.from(response.data, "binary")

        doc.addPage()
        doc.fontSize(16).text("Graphique des ventes", { align: "center" })
        doc.moveDown(1)
        doc.image(imgBuffer, {
          fit: [500, 300],
          align: "center",
          valign: "center",
        })
      } catch (error) {
        console.error("Erreur génération du graphique:", error)
      }
    }

    doc.moveDown(1.5)
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(1)
  }

  if (!id) {
    doc.fontSize(14).fillColor("#333").text(
      `Chiffre d'affaires global : ${totalGlobal.toFixed(2)} €`,
      { align: "right" }
    )
  }

  doc.end()
  const pdfBuffer = await endPromise

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${
        id ? `franchise_${id}.pdf` : "rapport_franchises.pdf"
      }`,
    },
  })
}
