import { Sala, Atividade, CreateAtividadeDTO, UpdateAtividadeDTO, CodigoDoEncontro, Presenca, RegistrarPresencaDTO, RegistrarPresencaManualDTO, ApiError } from "./types";

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

  registrarPresencaManual: async (id: string, data: RegistrarPresencaManualDTO): Promise<Presenca> => {
    return request<Presenca>(`/encontros/${id}/presencas/manual`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPresencas: async (id: string): Promise<Presenca[]> => {
    return request<Presenca[]>(`/encontros/${id}/presencas`);
  },
};
