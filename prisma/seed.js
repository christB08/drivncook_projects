import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("5E0DzkzaWL2UNu", 10)

  // Supprimer l'ancien utilisateur si besoin
  await prisma.utilisateur.deleteMany({})

  await prisma.utilisateur.create({
    data: {
      email: "admin@drivncook.com",
      motDePasse: hashedPassword,
    },
  })

  console.log("✅ Utilisateur admin créé : admin@drivncook.com / 5E0DzkzaWL2UNu")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
