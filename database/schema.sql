-- ============================================================
-- TechTransit — Schema PostgreSQL v1.0
-- Ejecutar en Supabase SQL Editor o via psql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE rol_usuario        AS ENUM ('ADMIN', 'SUPERVISOR', 'COLABORADOR');
CREATE TYPE estado_proceso     AS ENUM ('ESTRUCTURACION', 'PRESENTACION', 'GANADO', 'NO_ADJUDICADO', 'DESIERTO');
CREATE TYPE semaforo_contrato  AS ENUM ('VERDE', 'AMARILLO', 'ROJO');
CREATE TYPE estado_hito        AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'VENCIDO');

-- ============================================================
-- Trigger function compartida para updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE entidad (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            VARCHAR(255) NOT NULL,
  nit               VARCHAR(20)  UNIQUE NOT NULL,
  tipo              VARCHAR(100),
  municipio         VARCHAR(100),
  departamento      VARCHAR(100),
  contacto_nombre   VARCHAR(255),
  contacto_email    VARCHAR(255),
  contacto_telefono VARCHAR(50),
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           rol_usuario  NOT NULL DEFAULT 'COLABORADOR',
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  refresh_token TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE aliado (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            VARCHAR(255) NOT NULL,
  nit               VARCHAR(20)  UNIQUE,
  tipo              VARCHAR(100),
  contacto_nombre   VARCHAR(255),
  contacto_email    VARCHAR(255),
  contacto_telefono VARCHAR(50),
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE proceso_precontractual (
  id                  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidad_id          UUID           NOT NULL REFERENCES entidad(id),
  responsable_id      UUID           NOT NULL REFERENCES usuario(id),
  nombre              VARCHAR(500)   NOT NULL,
  numero_proceso      VARCHAR(100),
  objeto              TEXT,
  estado              estado_proceso NOT NULL DEFAULT 'ESTRUCTURACION',
  valor_estimado      NUMERIC(18,2),
  valor_adjudicado    NUMERIC(18,2),
  fecha_apertura      DATE,
  fecha_cierre        DATE,
  fecha_adjudicacion  DATE,
  modalidad           VARCHAR(100),
  notas               TEXT,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE proceso_aliado (
  proceso_id               UUID          NOT NULL REFERENCES proceso_precontractual(id) ON DELETE CASCADE,
  aliado_id                UUID          NOT NULL REFERENCES aliado(id)                 ON DELETE CASCADE,
  rol_consorcio            VARCHAR(100),
  porcentaje_participacion NUMERIC(5,2),
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (proceso_id, aliado_id)
);

CREATE TABLE historial_proceso (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  proceso_id      UUID           NOT NULL REFERENCES proceso_precontractual(id) ON DELETE CASCADE,
  usuario_id      UUID           NOT NULL REFERENCES usuario(id),
  estado_anterior estado_proceso,
  estado_nuevo    estado_proceso NOT NULL,
  comentario      TEXT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
  -- Sin updated_at: es un registro de auditoría inmutable
);

CREATE TABLE contrato (
  id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  proceso_id       UUID              REFERENCES proceso_precontractual(id),
  entidad_id       UUID              NOT NULL REFERENCES entidad(id),
  responsable_id   UUID              NOT NULL REFERENCES usuario(id),
  numero_contrato  VARCHAR(100)      UNIQUE NOT NULL,
  objeto           TEXT              NOT NULL,
  valor_total      NUMERIC(18,2)     NOT NULL,
  valor_ejecutado  NUMERIC(18,2)     NOT NULL DEFAULT 0,
  avance_fisico    NUMERIC(5,2)      NOT NULL DEFAULT 0,   -- porcentaje 0-100
  semaforo         semaforo_contrato NOT NULL DEFAULT 'VERDE',
  fecha_inicio     DATE              NOT NULL,
  fecha_fin        DATE              NOT NULL,
  fecha_fin_real   DATE,
  supervisor_nombre VARCHAR(255),
  supervisor_email  VARCHAR(255),
  notas            TEXT,
  activo           BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TABLE hito_contrato (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id        UUID         NOT NULL REFERENCES contrato(id) ON DELETE CASCADE,
  nombre             VARCHAR(255) NOT NULL,
  descripcion        TEXT,
  fecha_limite       DATE         NOT NULL,
  fecha_cumplimiento DATE,
  estado             estado_hito  NOT NULL DEFAULT 'PENDIENTE',
  valor_asociado     NUMERIC(18,2),
  observaciones      TEXT,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_entidad_activo             ON entidad(activo);

CREATE INDEX idx_usuario_email              ON usuario(email);
CREATE INDEX idx_usuario_rol               ON usuario(rol);
CREATE INDEX idx_usuario_activo            ON usuario(activo);

CREATE INDEX idx_aliado_activo             ON aliado(activo);

CREATE INDEX idx_proceso_entidad           ON proceso_precontractual(entidad_id);
CREATE INDEX idx_proceso_responsable       ON proceso_precontractual(responsable_id);
CREATE INDEX idx_proceso_estado            ON proceso_precontractual(estado);
CREATE INDEX idx_proceso_fecha_cierre      ON proceso_precontractual(fecha_cierre);

CREATE INDEX idx_proceso_aliado_aliado     ON proceso_aliado(aliado_id);

CREATE INDEX idx_historial_proceso         ON historial_proceso(proceso_id);
CREATE INDEX idx_historial_usuario         ON historial_proceso(usuario_id);
CREATE INDEX idx_historial_created_at      ON historial_proceso(created_at DESC);

CREATE INDEX idx_contrato_entidad          ON contrato(entidad_id);
CREATE INDEX idx_contrato_responsable      ON contrato(responsable_id);
CREATE INDEX idx_contrato_proceso          ON contrato(proceso_id);
CREATE INDEX idx_contrato_semaforo         ON contrato(semaforo);
CREATE INDEX idx_contrato_activo           ON contrato(activo);
CREATE INDEX idx_contrato_fecha_fin        ON contrato(fecha_fin);

CREATE INDEX idx_hito_contrato             ON hito_contrato(contrato_id);
CREATE INDEX idx_hito_estado               ON hito_contrato(estado);
CREATE INDEX idx_hito_fecha_limite         ON hito_contrato(fecha_limite);

-- ============================================================
-- Triggers updated_at
-- ============================================================

CREATE TRIGGER trg_entidad_updated_at
  BEFORE UPDATE ON entidad
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_usuario_updated_at
  BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_aliado_updated_at
  BEFORE UPDATE ON aliado
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_proceso_updated_at
  BEFORE UPDATE ON proceso_precontractual
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_proceso_aliado_updated_at
  BEFORE UPDATE ON proceso_aliado
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_contrato_updated_at
  BEFORE UPDATE ON contrato
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_hito_updated_at
  BEFORE UPDATE ON hito_contrato
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
