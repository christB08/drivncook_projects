/*
  Warnings:

  - The `etat` column on the `Camion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[franchiseId]` on the table `Utilisateur` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contactEmail` to the `Franchise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactNom` to the `Franchise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactTelephone` to the `Franchise` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "EtatCamion" AS ENUM ('DISPONIBLE', 'EN_PANNE', 'EN_ENTRETIEN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'FRANCHISE');

-- AlterTable
ALTER TABLE "Camion" ADD COLUMN     "localisation" TEXT,
DROP COLUMN "etat",
ADD COLUMN     "etat" "EtatCamion" NOT NULL DEFAULT 'DISPONIBLE';

-- AlterTable
ALTER TABLE "Franchise" ADD COLUMN     "contactEmail" TEXT NOT NULL,
ADD COLUMN     "contactNom" TEXT NOT NULL,
ADD COLUMN     "contactTelephone" TEXT NOT NULL,
ADD COLUMN     "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "statut" "Statut" NOT NULL DEFAULT 'ACTIF';

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "franchiseId" INTEGER,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'FRANCHISE';

-- CreateTable
CREATE TABLE "Entretien" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "details" TEXT,
    "camionId" INTEGER NOT NULL,

    CONSTRAINT "Entretien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approvisionnement" (
    "id" SERIAL NOT NULL,
    "franchiseId" INTEGER NOT NULL,
    "entrepotId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "obligatoire" BOOLEAN NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approvisionnement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_franchiseId_key" ON "Utilisateur"("franchiseId");

-- AddForeignKey
ALTER TABLE "Entretien" ADD CONSTRAINT "Entretien_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approvisionnement" ADD CONSTRAINT "Approvisionnement_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approvisionnement" ADD CONSTRAINT "Approvisionnement_entrepotId_fkey" FOREIGN KEY ("entrepotId") REFERENCES "Entrepot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
