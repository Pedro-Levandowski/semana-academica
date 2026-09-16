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
  tipo?: "palestra" | "minicurso";
  salaId?: string;
  vagas?: number;
  encontros?: EncontroInput[];
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
