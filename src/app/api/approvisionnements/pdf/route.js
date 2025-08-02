import { PrismaClient } from "@prisma/client"
import PDFDocument from "pdfkit"
import { NextResponse } from "next/server"
import path from "path"
import axios from "axios"

const prisma = new PrismaClient()

export async function GET(req) {
  try {
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

    //  Récupération des approvisionnements
    const approvisionnements = await prisma.approvisionnement.findMany({
      where: whereClause,
      include: { franchise: true, entrepot: true },
      orderBy: { date: "desc" },
    })

    const buffers = []
    const doc = new PDFDocument({ margin: 40, font: null })
    doc.on("data", (chunk) => buffers.push(chunk))
    const endPromise = new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)))
    })

    // 🖋️ Police personnalisée
    doc.font(path.join(process.cwd(), "public/fonts/ARIAL.TTF"))

    doc.fontSize(22).text("Rapport des Approvisionnements - Driv'n Cook", { align: "center" })
    doc.moveDown(2)

    // Affichage infos franchise si filtrée
    if (franchiseId) {
      const f = approvisionnements[0]?.franchise
      if (f) {
        doc.fontSize(16).text(`Franchise : ${f.nom}`, { underline: true })
        doc.text(`Adresse : ${f.adresse || "N/A"}`)
        doc.moveDown()
      }
    }

    let totalQuantite = 0
    let dataByFranchise = {}

    //  Liste des approvisionnements
    approvisionnements.forEach((a) => {
      totalQuantite += a.quantite
      dataByFranchise[a.franchise.nom] =
        (dataByFranchise[a.franchise.nom] || 0) + a.quantite

      doc.fontSize(12).text(`Date: ${new Date(a.date).toLocaleDateString()}`)
      doc.text(`Franchise: ${a.franchise?.nom || "Inconnue"}`)
      doc.text(`Entrepôt: ${a.entrepot?.ville || "Inconnu"}`)
      doc.text(`Quantité: ${a.quantite}`)
      doc.text(`Type: ${a.obligatoire ? "Obligatoire (Quota)" : "Libre"}`)
      doc.moveDown()
    })

    doc.moveDown()
    doc.fontSize(14).text(`Total des approvisionnements : ${totalQuantite}`)

    //  Graphique si plusieurs franchises
    if (Object.keys(dataByFranchise).length > 1) {
      const labels = Object.keys(dataByFranchise)
      const data = Object.values(dataByFranchise)

      const chartConfig = {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Quantité par Franchise",
              data,
              backgroundColor: "rgba(54, 162, 235, 0.7)",
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
        doc.fontSize(16).text("Graphique des Approvisionnements", { align: "center" })
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
        "Content-Disposition": "attachment; filename=approvisionnements.pdf",
      },
    })
  } catch (error) {
    console.error("Erreur génération PDF approvisionnements:", error)
    return new NextResponse(
      JSON.stringify({ error: "Erreur génération PDF" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
