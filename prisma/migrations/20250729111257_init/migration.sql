-- CreateTable
CREATE TABLE "Franchise" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "droitEntree" DOUBLE PRECISION NOT NULL,
    "pourcentageCA" DOUBLE PRECISION NOT NULL DEFAULT 4.00,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camion" (
    "id" SERIAL NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "etat" TEXT NOT NULL,
    "franchiseId" INTEGER NOT NULL,

    CONSTRAINT "Camion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vente" (
    "id" SERIAL NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "franchiseId" INTEGER NOT NULL,

    CONSTRAINT "Vente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Camion_immatriculation_key" ON "Camion"("immatriculation");

-- AddForeignKey
ALTER TABLE "Camion" ADD CONSTRAINT "Camion_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
