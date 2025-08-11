/*
  Warnings:

  - A unique constraint covering the columns `[siret]` on the table `Franchise` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Franchise" ADD COLUMN     "capitalSocial" DOUBLE PRECISION,
ADD COLUMN     "cguAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "codePostal" TEXT,
ADD COLUMN     "contactFactEmail" TEXT,
ADD COLUMN     "contactFactNom" TEXT,
ADD COLUMN     "contactFactTelephone" TEXT,
ADD COLUMN     "formeJuridique" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "idCardUrl" TEXT,
ADD COLUMN     "kbisUrl" TEXT,
ADD COLUMN     "pays" TEXT,
ADD COLUMN     "proofAddressUrl" TEXT,
ADD COLUMN     "ribUrl" TEXT,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "tvaIntracom" TEXT,
ADD COLUMN     "ville" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_siret_key" ON "Franchise"("siret");
