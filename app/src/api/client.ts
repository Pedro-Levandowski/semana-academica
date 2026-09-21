import { Sala, Atividade, CreateAtividadeDTO, UpdateAtividadeDTO, CodigoDoEncontro, Presenca, RegistrarPresencaDTO, RegistrarPresencaManualDTO, Inscricao, Certificado, Extrato, VerificacaoCertificado, ApiError } from "./types";

const getBaseUrl = () => {
  return (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";
};

const getHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const selectedUserId = localStorage.getItem("selectedUserId");
  if (selectedUserId) {
    headers["X-Usuario"] = selectedUserId;
  }
  return headers;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = `${getBaseUrl()}${path}`;
  const headers = { ...getHeaders(), ...options.headers };
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorData: any;
    try {
      errorData = await res.json();
    } catch {
      errorData = { erro: "ERRO_DESCONHECIDO", mensagem: "Erro desconhecido na API" };
    }
    throw new ApiError(
      res.status,
      errorData.erro || "ERRO_DESCONHECIDO",
      errorData.mensagem || "Erro inesperado"
    );
  }

  return res.json() as Promise<T>;
};

export const api = {
  getSalas: async (): Promise<Sala[]> => {
    return request<Sala[]>("/salas");
  },

  getAtividades: async (filters?: { dia?: string; tipo?: "palestra" | "minicurso" }): Promise<Atividade[]> => {
    let query = "";
    if (filters) {
      const params = new URLSearchParams();
      if (filters.dia) params.append("dia", filters.dia);
      if (filters.tipo) params.append("tipo", filters.tipo);
      const queryString = params.toString();
      if (queryString) {
        query = `?${queryString}`;
      }
    }
    return request<Atividade[]>(`/atividades${query}`);
  },

  getAtividade: async (id: string): Promise<Atividade> => {
    return request<Atividade>(`/atividades/${id}`);
  },

  createAtividade: async (data: CreateAtividadeDTO): Promise<Atividade> => {
    return request<Atividade>("/atividades", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateAtividade: async (id: string, data: UpdateAtividadeDTO): Promise<Atividade> => {
    return request<Atividade>(`/atividades/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  cancelAtividade: async (id: string): Promise<Atividade> => {
    return request<Atividade>(`/atividades/${id}/cancelamento`, {
      method: "POST",
    });
  },

  getCodigoEncontro: async (id: string): Promise<CodigoDoEncontro> => {
    return request<CodigoDoEncontro>(`/encontros/${id}/codigo`);
  },

  registrarPresenca: async (id: string, data: RegistrarPresencaDTO): Promise<{ presenca: Presenca; status: number }> => {
    const url = `${getBaseUrl()}/encontros/${id}/presencas`;
    const headers = { ...getHeaders() };
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let errorData: any;
      try {
        errorData = await res.json();
      } catch {
        errorData = { erro: "ERRO_DESCONHECIDO", mensagem: "Erro desconhecido na API" };
      }
      throw new ApiError(
        res.status,
        errorData.erro || "ERRO_DESCONHECIDO",
        errorData.mensagem || "Erro inesperado"
      );
    }

    const presenca = await res.json() as Presenca;
    return { presenca, status: res.status };
  },

  registrarPresencaManual: async (id: string, data: RegistrarPresencaManualDTO): Promise<{ presenca: Presenca; status: number }> => {
    const url = `${getBaseUrl()}/encontros/${id}/presencas/manual`;
    const headers = { ...getHeaders() };
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let errorData: any;
      try {
        errorData = await res.json();
      } catch {
        errorData = { erro: "ERRO_DESCONHECIDO", mensagem: "Erro desconhecido na API" };
      }
      throw new ApiError(
        res.status,
        errorData.erro || "ERRO_DESCONHECIDO",
        errorData.mensagem || "Erro inesperado"
      );
    }

    const presenca = await res.json() as Presenca;
    return { presenca, status: res.status };
  },

  getPresencas: async (id: string): Promise<Presenca[]> => {
    return request<Presenca[]>(`/encontros/${id}/presencas`);
  },

  getInscricoes: async (filters?: { atividadeId?: string }): Promise<Inscricao[]> => {
    let query = "";
    if (filters?.atividadeId) {
      query = `?atividadeId=${encodeURIComponent(filters.atividadeId)}`;
    }
    return request<Inscricao[]>(`/inscricoes${query}`);
  },

  getInscricao: async (id: string): Promise<Inscricao> => {
    return request<Inscricao>(`/inscricoes/${id}`);
  },

  createInscricao: async (atividadeId: string): Promise<Inscricao> => {
    return request<Inscricao>(`/atividades/${atividadeId}/inscricoes`, {
      method: "POST",
    });
  },

  cancelInscricao: async (id: string): Promise<Inscricao> => {
    return request<Inscricao>(`/inscricoes/${id}/cancelamento`, {
      method: "POST",
    });
  },

  confirmInscricao: async (id: string): Promise<Inscricao> => {
    return request<Inscricao>(`/inscricoes/${id}/confirmacao`, {
      method: "POST",
    });
  },

  getCertificados: async (): Promise<Certificado[]> => {
    return request<Certificado[]>("/certificados");
  },

  getExtrato: async (): Promise<Extrato> => {
    return request<Extrato>("/extrato");
  },

  getCertificadoPorCodigo: async (codigo: string): Promise<VerificacaoCertificado> => {
    return request<VerificacaoCertificado>(`/certificados/${encodeURIComponent(codigo)}`);
  },

  emitirCertificado: async (atividadeId: string): Promise<Certificado> => {
    return request<Certificado>(`/atividades/${encodeURIComponent(atividadeId)}/certificado`, {
      method: "POST",
    });
  },
};