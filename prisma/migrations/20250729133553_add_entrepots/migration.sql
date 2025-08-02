-- CreateTable
CREATE TABLE "Entrepot" (
    "id" SERIAL NOT NULL,
    "ville" TEXT NOT NULL,
    "stockTotal" INTEGER NOT NULL,
    "stockUtilise" INTEGER NOT NULL,

    CONSTRAINT "Entrepot_pkey" PRIMARY KEY ("id")
);
