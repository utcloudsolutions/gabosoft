import { prisma } from '../../db/prisma';

export async function getKpis() {
  const [
    totalProcesos,
    procesosPorEstado,
    procesosVencenProximo,
    contratosActivos,
    contratosValores,
    semaforos,
  ] = await Promise.all([
    // Total procesos activos (no terminales)
    prisma.procesoPrecontractual.count({
      where: { estado: { in: ['ESTRUCTURACION', 'PRESENTACION'] } },
    }),

    // Conteo por cada estado
    prisma.procesoPrecontractual.groupBy({
      by: ['estado'],
      _count: { id: true },
    }),

    // Procesos cuya fechaCierre es en los próximos 30 días
    prisma.procesoPrecontractual.count({
      where: {
        estado: { in: ['ESTRUCTURACION', 'PRESENTACION'] },
        fechaCierre: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Contratos activos
    prisma.contrato.count({ where: { activo: true } }),

    // Suma valor total y ejecutado de contratos activos
    prisma.contrato.aggregate({
      where: { activo: true },
      _sum: { valorTotal: true, valorEjecutado: true },
    }),

    // Distribución de semáforos en contratos activos
    prisma.contrato.groupBy({
      by: ['semaforo'],
      where: { activo: true },
      _count: { id: true },
    }),
  ]);

  // Valor estimado en pipeline (procesos activos)
  const pipeline = await prisma.procesoPrecontractual.aggregate({
    where: { estado: { in: ['ESTRUCTURACION', 'PRESENTACION'] } },
    _sum: { valorEstimado: true },
  });

  const estadoMap = Object.fromEntries(
    procesosPorEstado.map((r) => [r.estado, r._count.id]),
  );

  const semaforoMap = Object.fromEntries(
    semaforos.map((r) => [r.semaforo, r._count.id]),
  );

  const valorTotal = Number(contratosValores._sum.valorTotal ?? 0);
  const valorEjecutado = Number(contratosValores._sum.valorEjecutado ?? 0);

  return {
    procesos: {
      total: totalProcesos,
      porEstado: {
        ESTRUCTURACION: estadoMap['ESTRUCTURACION'] ?? 0,
        PRESENTACION: estadoMap['PRESENTACION'] ?? 0,
        GANADO: estadoMap['GANADO'] ?? 0,
        NO_ADJUDICADO: estadoMap['NO_ADJUDICADO'] ?? 0,
        DESIERTO: estadoMap['DESIERTO'] ?? 0,
      },
      proximos30dias: procesosVencenProximo,
      valorPipeline: Number(pipeline._sum.valorEstimado ?? 0),
    },
    contratos: {
      total: contratosActivos,
      valorTotal,
      valorEjecutado,
      avanceFinanciero: valorTotal > 0 ? (valorEjecutado / valorTotal) * 100 : 0,
      semaforos: {
        VERDE: semaforoMap['VERDE'] ?? 0,
        AMARILLO: semaforoMap['AMARILLO'] ?? 0,
        ROJO: semaforoMap['ROJO'] ?? 0,
      },
    },
  };
}
