-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'SUPERVISOR', 'COLABORADOR');

-- CreateEnum
CREATE TYPE "EstadoProceso" AS ENUM ('ESTRUCTURACION', 'PRESENTACION', 'GANADO', 'NO_ADJUDICADO', 'DESIERTO');

-- CreateEnum
CREATE TYPE "SemaforoContrato" AS ENUM ('VERDE', 'AMARILLO', 'ROJO');

-- CreateEnum
CREATE TYPE "EstadoHito" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'VENCIDO');

-- CreateTable
CREATE TABLE "entidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "tipo" TEXT,
    "municipio" TEXT,
    "departamento" TEXT,
    "contacto_nombre" TEXT,
    "contacto_email" TEXT,
    "contacto_telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'COLABORADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aliado" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "tipo" TEXT,
    "contacto_nombre" TEXT,
    "contacto_email" TEXT,
    "contacto_telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aliado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceso_precontractual" (
    "id" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "responsable_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numero_proceso" TEXT,
    "objeto" TEXT,
    "estado" "EstadoProceso" NOT NULL DEFAULT 'ESTRUCTURACION',
    "valor_estimado" DECIMAL(18,2),
    "valor_adjudicado" DECIMAL(18,2),
    "fecha_apertura" DATE,
    "fecha_cierre" DATE,
    "fecha_adjudicacion" DATE,
    "modalidad" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proceso_precontractual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceso_aliado" (
    "proceso_id" TEXT NOT NULL,
    "aliado_id" TEXT NOT NULL,
    "rol_consorcio" TEXT,
    "porcentaje_participacion" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proceso_aliado_pkey" PRIMARY KEY ("proceso_id","aliado_id")
);

-- CreateTable
CREATE TABLE "historial_proceso" (
    "id" TEXT NOT NULL,
    "proceso_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "estado_anterior" "EstadoProceso",
    "estado_nuevo" "EstadoProceso" NOT NULL,
    "comentario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_proceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato" (
    "id" TEXT NOT NULL,
    "proceso_id" TEXT,
    "entidad_id" TEXT NOT NULL,
    "responsable_id" TEXT NOT NULL,
    "numero_contrato" TEXT NOT NULL,
    "objeto" TEXT NOT NULL,
    "valor_total" DECIMAL(18,2) NOT NULL,
    "valor_ejecutado" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "avance_fisico" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "semaforo" "SemaforoContrato" NOT NULL DEFAULT 'VERDE',
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "fecha_fin_real" DATE,
    "supervisor_nombre" TEXT,
    "supervisor_email" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hito_contrato" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_limite" DATE NOT NULL,
    "fecha_cumplimiento" DATE,
    "estado" "EstadoHito" NOT NULL DEFAULT 'PENDIENTE',
    "valor_asociado" DECIMAL(18,2),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hito_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entidad_nit_key" ON "entidad"("nit");

-- CreateIndex
CREATE INDEX "entidad_activo_idx" ON "entidad"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_rol_idx" ON "usuario"("rol");

-- CreateIndex
CREATE INDEX "usuario_activo_idx" ON "usuario"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "aliado_nit_key" ON "aliado"("nit");

-- CreateIndex
CREATE INDEX "aliado_activo_idx" ON "aliado"("activo");

-- CreateIndex
CREATE INDEX "proceso_precontractual_entidad_id_idx" ON "proceso_precontractual"("entidad_id");

-- CreateIndex
CREATE INDEX "proceso_precontractual_responsable_id_idx" ON "proceso_precontractual"("responsable_id");

-- CreateIndex
CREATE INDEX "proceso_precontractual_estado_idx" ON "proceso_precontractual"("estado");

-- CreateIndex
CREATE INDEX "proceso_precontractual_fecha_cierre_idx" ON "proceso_precontractual"("fecha_cierre");

-- CreateIndex
CREATE INDEX "proceso_aliado_aliado_id_idx" ON "proceso_aliado"("aliado_id");

-- CreateIndex
CREATE INDEX "historial_proceso_proceso_id_idx" ON "historial_proceso"("proceso_id");

-- CreateIndex
CREATE INDEX "historial_proceso_usuario_id_idx" ON "historial_proceso"("usuario_id");

-- CreateIndex
CREATE INDEX "historial_proceso_created_at_idx" ON "historial_proceso"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "contrato_numero_contrato_key" ON "contrato"("numero_contrato");

-- CreateIndex
CREATE INDEX "contrato_entidad_id_idx" ON "contrato"("entidad_id");

-- CreateIndex
CREATE INDEX "contrato_responsable_id_idx" ON "contrato"("responsable_id");

-- CreateIndex
CREATE INDEX "contrato_semaforo_idx" ON "contrato"("semaforo");

-- CreateIndex
CREATE INDEX "contrato_activo_idx" ON "contrato"("activo");

-- CreateIndex
CREATE INDEX "contrato_fecha_fin_idx" ON "contrato"("fecha_fin");

-- CreateIndex
CREATE INDEX "hito_contrato_contrato_id_idx" ON "hito_contrato"("contrato_id");

-- CreateIndex
CREATE INDEX "hito_contrato_estado_idx" ON "hito_contrato"("estado");

-- CreateIndex
CREATE INDEX "hito_contrato_fecha_limite_idx" ON "hito_contrato"("fecha_limite");

-- AddForeignKey
ALTER TABLE "proceso_precontractual" ADD CONSTRAINT "proceso_precontractual_entidad_id_fkey" FOREIGN KEY ("entidad_id") REFERENCES "entidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proceso_precontractual" ADD CONSTRAINT "proceso_precontractual_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proceso_aliado" ADD CONSTRAINT "proceso_aliado_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "proceso_precontractual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proceso_aliado" ADD CONSTRAINT "proceso_aliado_aliado_id_fkey" FOREIGN KEY ("aliado_id") REFERENCES "aliado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_proceso" ADD CONSTRAINT "historial_proceso_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "proceso_precontractual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_proceso" ADD CONSTRAINT "historial_proceso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "proceso_precontractual"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_entidad_id_fkey" FOREIGN KEY ("entidad_id") REFERENCES "entidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hito_contrato" ADD CONSTRAINT "hito_contrato_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
