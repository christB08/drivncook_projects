import { PrismaClient } from "@prisma/client"
import PDFDocument from "pdfkit"
import { NextResponse } from "next/server"
import path from "path"

const prisma = new PrismaClient()

export async function GET() {
  const entrepots = await prisma.entrepot.findMany({
    include: {
      approvisionnements: {
        include: { franchise: true },
      },
    },
    orderBy: { id: "asc" },
  })

  const buffers = []
  const doc = new PDFDocument({ margin: 40, font: null })

  doc.on("data", (chunk) => buffers.push(chunk))
  const endPromise = new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)))
  })

  // Police Arial
  doc.font(path.join(process.cwd(), "public/fonts/ARIAL.TTF"))

  // Titre
  doc.fontSize(22).text("Rapport des Entrepôts - Driv'n Cook", { align: "center" })
  doc.moveDown(2)

  let totalStock = 0
  let totalUtilise = 0

  entrepots.forEach((e) => {
    const utilisation = ((e.stockUtilise / e.stockTotal) * 100).toFixed(1)
    totalStock += e.stockTotal
    totalUtilise += e.stockUtilise

    doc.fontSize(16).fillColor("#000").text(`Entrepôt #${e.id} - ${e.ville}`, { underline: true })
    doc.moveDown(0.5)

    doc.fontSize(12)
    doc.text(`Stock total : ${e.stockTotal} unités`)
    doc.text(`Stock utilisé : ${e.stockUtilise} unités (${utilisation}%)`)

    doc.moveDown(0.5)
    doc.text("Approvisionnements :", { underline: true })
    if (e.approvisionnements.length > 0) {
      e.approvisionnements.forEach((a) => {
        doc.text(
          `   - ${a.franchise.nom} : ${a.quantite} unités [${
            a.obligatoire ? "Obligatoire" : "Libre"
          }]`
        )
      })
    } else {
      doc.text("   Aucun approvisionnement.")
    }

    doc.moveDown(1.5)
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(1)
  })

  const tauxGlobal = totalStock > 0 ? ((totalUtilise / totalStock) * 100).toFixed(1) : 0
  doc.fontSize(14).fillColor("#333").text(
    `Stock global utilisé : ${totalUtilise}/${totalStock} (${tauxGlobal}%)`,
    { align: "right" }
  )

  doc.end()
  const pdfBuffer = await endPromise

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=rapport_entrepots.pdf",
    },
  })
}
