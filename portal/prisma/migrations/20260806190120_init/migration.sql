-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'FINANCEIRO', 'CONTABILIDADE', 'DIRETORIA', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "TituloTipo" AS ENUM ('PAGAR', 'RECEBER');

-- CreateEnum
CREATE TYPE "TituloStatus" AS ENUM ('PREVISTO', 'REALIZADO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EntidadeTipo" AS ENUM ('CLIENTE', 'FORNECEDOR', 'TRANSPORTADORA', 'FUNCIONARIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "CategoriaTipo" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "ImpostoSituacao" AS ENUM ('ESTIMADO', 'CONFIRMADO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "SyncTrigger" AS ENUM ('MANUAL', 'AGENDADO');

-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('PENDENTE', 'EM_EXECUCAO', 'SUCESSO', 'PARCIAL', 'FALHOU');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USUARIO', 'SINCRONIZACAO');

-- CreateEnum
CREATE TYPE "StatusConciliacao" AS ENUM ('PENDENTE', 'CONCILIADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VISUALIZADOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "raw" JSONB NOT NULL,
    "erpCriadoEm" TIMESTAMP(3),
    "erpModificadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportadoras" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transportadoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_financeiras" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "CategoriaTipo" NOT NULL DEFAULT 'DESPESA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_custo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formas_pagamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_bancarias_erp" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_bancarias_erp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titulos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TituloTipo" NOT NULL,
    "erpId" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT NOT NULL,
    "valorOriginal" DECIMAL(14,2) NOT NULL,
    "juros" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxaBanco" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxaOperadora" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(14,2) NOT NULL,
    "categoriaId" TEXT,
    "centroCustoId" TEXT,
    "contaBancariaId" TEXT,
    "formaPagamentoId" TEXT,
    "entidadeTipo" "EntidadeTipo" NOT NULL,
    "clienteId" TEXT,
    "fornecedorId" TEXT,
    "transportadoraId" TEXT,
    "funcionarioErpId" TEXT,
    "nomeFuncionario" TEXT,
    "lojaErpId" TEXT,
    "nomeLoja" TEXT,
    "liquidado" BOOLEAN NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataLiquidacao" TIMESTAMP(3),
    "dataCompetencia" TIMESTAMP(3) NOT NULL,
    "canceladoEm" TIMESTAMP(3),
    "statusConciliacao" "StatusConciliacao" NOT NULL DEFAULT 'PENDENTE',
    "conciliadoLancamentoId" TEXT,
    "conciliadoEm" TIMESTAMP(3),
    "raw" JSONB NOT NULL,
    "erpCriadoEm" TIMESTAMP(3),
    "erpModificadoEm" TIMESTAMP(3),
    "lastSyncRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "numero" TEXT,
    "serie" TEXT,
    "situacao" TEXT,
    "valor" DECIMAL(14,2),
    "dataEmissao" TIMESTAMP(3),
    "clienteId" TEXT,
    "fornecedorId" TEXT,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impostos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valorEstimado" DECIMAL(14,2) NOT NULL,
    "valorConfirmado" DECIMAL(14,2),
    "valorPago" DECIMAL(14,2),
    "dataPagamento" TIMESTAMP(3),
    "situacao" "ImpostoSituacao" NOT NULL DEFAULT 'ESTIMADO',
    "codigoGuia" TEXT,
    "comprovanteUrl" TEXT,
    "observacoes" TEXT,
    "categoriaId" TEXT,
    "centroCustoId" TEXT,
    "createdByUserId" TEXT,
    "confirmedByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impostos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extrato_bancario_lancamentos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "contaBancariaId" TEXT,
    "dataMovimento" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "origemImportacao" TEXT NOT NULL,
    "raw" JSONB,
    "status" "StatusConciliacao" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extrato_bancario_lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp_raw_records" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncRunId" TEXT,

    CONSTRAINT "erp_raw_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "trigger" "SyncTrigger" NOT NULL,
    "triggeredByUserId" TEXT,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'PENDENTE',
    "resourcesRequested" TEXT[],
    "erpAdapterName" TEXT NOT NULL,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "totalFetched" INTEGER NOT NULL DEFAULT 0,
    "totalCreated" INTEGER NOT NULL DEFAULT 0,
    "totalUpdated" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_run_resources" (
    "id" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'PENDENTE',
    "dataInicioFiltro" TIMESTAMP(3),
    "dataFimFiltro" TIMESTAMP(3),
    "paginasTotais" INTEGER,
    "ultimaPaginaProcessada" INTEGER,
    "registrosTotal" INTEGER,
    "criados" INTEGER NOT NULL DEFAULT 0,
    "atualizados" INTEGER NOT NULL DEFAULT 0,
    "ignorados" INTEGER NOT NULL DEFAULT 0,
    "falhas" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "sync_run_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log_entries" (
    "id" TEXT NOT NULL,
    "syncRunId" TEXT NOT NULL,
    "syncRunResource" TEXT,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_providerAccountId_key" ON "auth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_sessionToken_key" ON "auth_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_token_key" ON "auth_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_identifier_token_key" ON "auth_verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresaId_erpId_key" ON "clientes"("empresaId", "erpId");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_empresaId_erpId_key" ON "fornecedores"("empresaId", "erpId");

-- CreateIndex
CREATE UNIQUE INDEX "transportadoras_empresaId_erpId_key" ON "transportadoras"("empresaId", "erpId");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_financeiras_empresaId_erpId_key" ON "categorias_financeiras"("empresaId", "erpId");

-- CreateIndex
CREATE UNIQUE INDEX "centros_custo_empresaId_erpId_key" ON "centros_custo"("empresaId", "erpId");

-- CreateIndex
CREATE UNIQUE INDEX "formas_pagamento_empresaId_erpId_key" ON "formas_pagamento"("empresaId", "erpId");

-- CreateIndex
CREATE UNIQUE INDEX "contas_bancarias_erp_empresaId_erpId_key" ON "contas_bancarias_erp"("empresaId", "erpId");

-- CreateIndex
CREATE INDEX "titulos_empresaId_tipo_dataVencimento_idx" ON "titulos"("empresaId", "tipo", "dataVencimento");

-- CreateIndex
CREATE INDEX "titulos_empresaId_tipo_liquidado_idx" ON "titulos"("empresaId", "tipo", "liquidado");

-- CreateIndex
CREATE INDEX "titulos_empresaId_tipo_dataCompetencia_idx" ON "titulos"("empresaId", "tipo", "dataCompetencia");

-- CreateIndex
CREATE UNIQUE INDEX "titulos_empresaId_tipo_erpId_key" ON "titulos"("empresaId", "tipo", "erpId");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_empresaId_erpId_key" ON "notas_fiscais"("empresaId", "erpId");

-- CreateIndex
CREATE INDEX "impostos_empresaId_competencia_idx" ON "impostos"("empresaId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "erp_raw_records_empresaId_resource_erpId_key" ON "erp_raw_records"("empresaId", "resource", "erpId");

-- CreateIndex
CREATE UNIQUE INDEX "sync_run_resources_syncRunId_resource_key" ON "sync_run_resources"("syncRunId", "resource");

-- CreateIndex
CREATE INDEX "sync_log_entries_syncRunId_level_idx" ON "sync_log_entries"("syncRunId", "level");

-- CreateIndex
CREATE INDEX "audit_logs_empresaId_entityType_entityId_idx" ON "audit_logs"("empresaId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportadoras" ADD CONSTRAINT "transportadoras_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_financeiras" ADD CONSTRAINT "categorias_financeiras_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros_custo" ADD CONSTRAINT "centros_custo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formas_pagamento" ADD CONSTRAINT "formas_pagamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_bancarias_erp" ADD CONSTRAINT "contas_bancarias_erp_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "contas_bancarias_erp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "formas_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_transportadoraId_fkey" FOREIGN KEY ("transportadoraId") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_conciliadoLancamentoId_fkey" FOREIGN KEY ("conciliadoLancamentoId") REFERENCES "extrato_bancario_lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_lastSyncRunId_fkey" FOREIGN KEY ("lastSyncRunId") REFERENCES "sync_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impostos" ADD CONSTRAINT "impostos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impostos" ADD CONSTRAINT "impostos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impostos" ADD CONSTRAINT "impostos_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impostos" ADD CONSTRAINT "impostos_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impostos" ADD CONSTRAINT "impostos_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extrato_bancario_lancamentos" ADD CONSTRAINT "extrato_bancario_lancamentos_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "contas_bancarias_erp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_raw_records" ADD CONSTRAINT "erp_raw_records_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erp_raw_records" ADD CONSTRAINT "erp_raw_records_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "sync_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_run_resources" ADD CONSTRAINT "sync_run_resources_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "sync_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_log_entries" ADD CONSTRAINT "sync_log_entries_syncRunId_fkey" FOREIGN KEY ("syncRunId") REFERENCES "sync_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
