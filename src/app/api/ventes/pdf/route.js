import { PrismaClient } from "@prisma/client"
import PDFDocument from "pdfkit"
import { NextResponse } from "next/server"
import path from "path"
import axios from "axios"

const prisma = new PrismaClient()

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const franchiseId = searchParams.get("franchiseId")
  const mois = searchParams.get("mois")

  //  Filtrage conditionnel
  const whereClause = {}
  if (franchiseId) whereClause.franchiseId = parseInt(franchiseId)
  if (mois) {
    const [annee, m] = mois.split("-")
    const start = new Date(annee, m - 1, 1)
    const end = new Date(annee, m, 0, 23, 59, 59)
    whereClause.date = { gte: start, lte: end }
  }

  const ventes = await prisma.vente.findMany({
    where: whereClause,
    include: { franchise: true },
    orderBy: { date: "desc" },
  })

  const buffers = []
  const doc = new PDFDocument({ margin: 40, font: null })
  doc.on("data", (chunk) => buffers.push(chunk))
  const endPromise = new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)))
  })

  // Police Arial
  doc.font(path.join(process.cwd(), "public/fonts/ARIAL.TTF"))

  doc.fontSize(22).text("Rapport des Ventes - Driv'n Cook", { align: "center" })
  doc.moveDown(2)

  if (franchiseId) {
    const f = ventes[0]?.franchise
    if (f) {
      doc.fontSize(16).text(`Franchise : ${f.nom}`, { underline: true })
      doc.text(`Adresse : ${f.adresse || "N/A"}`)
      doc.moveDown()
    }
  }

  let total = 0
  let dataByFranchise = {}

  ventes.forEach((v) => {
    const commission = v.montant * 0.04
    total += v.montant
    dataByFranchise[v.franchise.nom] = (dataByFranchise[v.franchise.nom] || 0) + v.montant

    doc.fontSize(12).text(`Date: ${new Date(v.date).toLocaleDateString()}`)
    doc.text(`Montant: ${v.montant.toFixed(2)} €`)
    doc.text(`Franchise: ${v.franchise.nom}`)
    doc.text(`Commission (4%): ${commission.toFixed(2)} €`)
    doc.moveDown()
  })

  doc.moveDown()
  doc.fontSize(14).text(`Total des ventes : ${total.toFixed(2)} €`)
  doc.text(`Commission totale (4%) : ${(total * 0.04).toFixed(2)} €`)

  // 🔥 Ajout graphique si plusieurs franchises
  if (Object.keys(dataByFranchise).length > 1) {
    const labels = Object.keys(dataByFranchise)
    const data = Object.values(dataByFranchise)

    const chartConfig = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "CA par Franchise (€)",
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
      doc.fontSize(16).text("Graphique CA par Franchise", { align: "center" })
      doc.moveDown(1)
      doc.image(imgBuffer, { fit: [500, 300], align: "center", valign: "center" })
    } catch (error) {
      console.error("Erreur génération graphique:", error)
    }
  }

  doc.end()
  const pdfBuffer = await endPromise

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=ventes.pdf",
    },
  })
}
