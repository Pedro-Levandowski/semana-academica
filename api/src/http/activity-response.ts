import { M2IntegrationPort } from '../integrations/m2-port.js';
import { ActivityData, sortEncontros, calculateActivityStatus } from '../domain/activity.js';
import { DateTime } from 'luxon';

export function mapActivityResponse(
  atv: ActivityData,
  m2Port: M2IntegrationPort,
  now: DateTime
) {
  const ocupadas = m2Port.getOcupadas(atv.id);
  const emEspera = m2Port.getEmEspera(atv.id);
  return {
    id: atv.id,
    titulo: atv.titulo,
    tipo: atv.tipo,
    salaId: atv.salaId,
    vagas: atv.vagas,
    cargaHorariaMinutos: atv.cargaHorariaMinutos,
    situacao: calculateActivityStatus(atv, now),
    ocupadas,
    vagasRestantes: atv.vagas - ocupadas,
    emEspera,
    encontros: sortEncontros(atv.encontros)
  };
}
