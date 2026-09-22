import {
  Sala,
  Atividade,
  PainelAtividade,
  SemChance,
  ArquivoFrequencia,
  Bloqueio,
  CreateAtividadeDTO,
  UpdateAtividadeDTO,
  ApiError,
} from "./types";

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

const apiErrorFromResponse = async (res: Response): Promise<ApiError> => {
  let errorData: any;
  try {
    errorData = await res.json();
  } catch {
    errorData = { erro: "ERRO_DESCONHECIDO", mensagem: "Erro desconhecido na API" };
  }
  return new ApiError(
    res.status,
    errorData.erro || "ERRO_DESCONHECIDO",
    errorData.mensagem || "Erro inesperado"
  );
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = `${getBaseUrl()}${path}`;
  const headers = { ...getHeaders(), ...options.headers };
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
};

const filenameFromDisposition = (disposition: string | null): string => {
  if (!disposition) return "frequencia.csv";

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ""));
    } catch {
      return encoded.replace(/^"|"$/g, "");
    }
  }

  return disposition.match(/filename="([^"]+)"/i)?.[1]
    || disposition.match(/filename=([^;]+)/i)?.[1]?.trim()
    || "frequencia.csv";
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

  getPainelAtividades: async (): Promise<PainelAtividade[]> => {
    return request<PainelAtividade[]>("/painel/atividades");
  },

  getSemChance: async (atividadeId: string): Promise<SemChance[]> => {
    return request<SemChance[]>(`/painel/atividades/${encodeURIComponent(atividadeId)}/sem-chance`);
  },

  downloadFrequenciaCsv: async (atividadeId: string): Promise<ArquivoFrequencia> => {
    const path = `/painel/atividades/${encodeURIComponent(atividadeId)}/frequencia.csv`;
    const res = await fetch(`${getBaseUrl()}${path}`, { headers: getHeaders() });

    if (!res.ok) {
      throw await apiErrorFromResponse(res);
    }

    const contentType = res.headers.get("Content-Type") || "text/csv; charset=utf-8";
    const nomeArquivo = filenameFromDisposition(res.headers.get("Content-Disposition"));
    const bytes = await res.arrayBuffer();

    return {
      blob: new Blob([bytes], { type: contentType }),
      nomeArquivo,
      contentType,
    };
  },

  getBloqueios: async (): Promise<Bloqueio[]> => {
    return request<Bloqueio[]>("/painel/bloqueios");
  },

  deleteBloqueio: async (participanteId: string): Promise<void> => {
    return request<void>(`/painel/bloqueios/${encodeURIComponent(participanteId)}`, {
      method: "DELETE",
    });
  },
};
