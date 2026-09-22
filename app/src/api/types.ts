export interface SemChance {
  participanteId: string;
  nome: string;
  faltas: number;
  faltasPermitidas: number;
}

export interface ArquivoFrequencia {
  blob: Blob;
  nomeArquivo: string;
  contentType: string;
}

export interface Bloqueio {
  participanteId: string;
  nome: string;
  atividades: string[];
  bloqueadoDesde: string;
}

export interface PainelAtividade {
  atividadeId: string;
  titulo: string;
  vagas: number;
  ocupadas: number;
  emEspera: number;
  ocupacaoPercentual: number;
  frequenciaPercentual: number | null;
}

export interface Sala {
  id: string;
  nome: string;
  capacidade: number;
}

export interface EncontroInput {
  inicio: string;
  fim: string;
}

export interface Encontro extends EncontroInput {
  id: string;
}

export interface CodigoDoEncontro {
  encontroId: string;
  codigo: string;
  trocaEm: string;
  validoAte: string;
}

export interface Presenca {
  id: string;
  encontroId: string;
  participanteId: string;
  origem: "qr" | "qr_offline" | "manual";
  lidoEm: string;
  registradaEm: string;
  justificativa: string | null;
}

export interface RegistrarPresencaDTO {
  codigo: string;
  lidoEm?: string;
}

export interface RegistrarPresencaManualDTO {
  participanteId: string;
  justificativa: string;
}

export interface AtividadeInput {
  titulo?: string;
  tipo?: "palestra" | "minicurso";
  salaId?: string;
  vagas?: number;
  encontros?: EncontroInput[];
}

export interface CreateAtividadeDTO {
  titulo: string;
  tipo: "palestra" | "minicurso";
  salaId: string;
  vagas: number;
  encontros: EncontroInput[];
}

export interface UpdateAtividadeDTO {
  titulo?: string;
  vagas?: number;
}

export interface Atividade {
  id: string;
  titulo: string;
  tipo: "palestra" | "minicurso";
  salaId: string;
  vagas: number;
  encontros: Encontro[];
  cargaHorariaMinutos: number;
  situacao: "prevista" | "em_andamento" | "encerrada" | "cancelada";
  ocupadas: number;
  vagasRestantes: number;
  emEspera: number;
}

export interface Inscricao {
  id: string;
  atividadeId: string;
  participanteId: string;
  status: "confirmada" | "em_espera" | "convocada" | "cancelada" | "expirada";
  posicaoNaEspera: number | null;
  convocadaAte: string | null;
  criadaEm: string;
}

export interface ApiErrorResponse {
  erro: string;
  mensagem: string;
}

export class ApiError extends Error {
  erro: string;
  mensagem: string;
  status: number;

  constructor(status: number, erro: string, mensagem: string) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.erro = erro;
    this.mensagem = mensagem;
  }
}
