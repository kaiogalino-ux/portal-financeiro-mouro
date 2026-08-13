-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "prefixo" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VISUALIZADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "expiraEm" TIMESTAMP(3),
    "ultimoUsoEm" TIMESTAMP(3),
    "revogadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_prefixo_key" ON "api_keys"("prefixo");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_tokenHash_key" ON "api_keys"("tokenHash");

-- CreateIndex
CREATE INDEX "api_keys_ativo_idx" ON "api_keys"("ativo");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
