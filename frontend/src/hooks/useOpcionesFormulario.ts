import { useEffect, useState } from 'react';
import { type SelectOption } from '../components/ui/Select';
import { api } from '../lib/api';
import {
  entidadesApi,
  type PaginatedResponse,
} from '../lib/api.catalogos';

type UsuarioListado = {
  id: string;
  nombre: string;
};

export function useOpcionesFormulario() {
  const [entidades, setEntidades] = useState<SelectOption[]>([]);
  const [usuarios, setUsuarios] = useState<SelectOption[]>([]);
  const [errorEntidades, setErrorEntidades] = useState('');
  const [errorResponsables, setErrorResponsables] = useState('');

  useEffect(() => {
    let activo = true;

    const cargarEntidades = async () => {
      try {
        const res = await entidadesApi.list(false, 200);
        if (!activo) return;

        setEntidades(res.items.map((x) => ({ value: x.id, label: x.nombre })));
        setErrorEntidades('');
      } catch {
        if (!activo) return;

        setEntidades([]);
        setErrorEntidades('No se pudieron cargar las entidades.');
      }
    };

    const cargarResponsables = async () => {
      try {
        const res = await api.get<PaginatedResponse<UsuarioListado>>('/usuarios', {
          params: { limit: 200 },
        });
        if (!activo) return;

        setUsuarios(res.data.items.map((x) => ({ value: x.id, label: x.nombre })));
        setErrorResponsables('');
      } catch {
        if (!activo) return;

        setUsuarios([]);
        setErrorResponsables('No se pudieron cargar los responsables.');
      }
    };

    void cargarEntidades();
    void cargarResponsables();

    return () => {
      activo = false;
    };
  }, []);

  return {
    entidades,
    usuarios,
    errorEntidades,
    errorResponsables,
  };
}
