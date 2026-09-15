import { M2IntegrationPort } from '../integrations/m2-port.js';
import { ActivityData } from '../domain/activity.js';

export function mapActivityResponse(
  atv: ActivityData,
  m2Port: M2IntegrationPort
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
    situacao: atv.cancelada ? 'cancelada' : 'prevista',
    ocupadas,
    vagasRestantes: atv.vagas - ocupadas,
    emEspera,
    encontros: atv.encontros
  };
}
