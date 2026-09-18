# Entrevista — Módulo M2: Inscrições e Lista de Espera

## Rodada 1 — Levantamento de Requisitos e Decisões

### 1. Perguntas de Regra de Negócio (Requisitos do Negócio)

❓ **P-01 — Inscrição Direta vs. Lista de Espera e Encerramento**:
Ao realizar `POST /atividades/:id/inscricoes`, em que condições a inscrição assume o status `confirmada` e quando assume `em_espera`? Quais são as regras exatas que determinam quando as inscrições estão encerradas (`INSCRICOES_ENCERRADAS`)?
- **Resposta**: Consultar requisitos (pendente para a Rodada 2).
- **Fonte**: Pendente

---

❓ **P-02 — Restrições e Erros de Inscrição (`JA_INSCRITO`, `INSCRICAO_BLOQUEADA`, `LIMITE_DE_MINICURSOS`, `CONFLITO_DE_HORARIO`)**:
Quais são os critérios e regras exatas para disparar cada um dos erros ao tentar se inscrever?
- `JA_INSCRITO`: participante já possui inscrição ativa (confirmada, convocada ou em espera) nesta atividade?
- `INSCRICAO_BLOQUEADA`: como é verificado o bloqueio oriundo do M5?
- `LIMITE_DE_MINICURSOS`: qual o limite máximo de minicurso por participante na Semana Acadêmica?
- `CONFLITO_DE_HORARIO`: como se define a sobreposição de horário entre encontros de atividades em que o participante já está inscrito/confirmado/convocado?
- **Resposta**: Consultar requisitos (pendente para a Rodada 2).
- **Fonte**: Pendente

---

❓ **P-03 — Gestão da Lista de Espera e `posicaoNaEspera`**:
Como é atribuída a `posicaoNaEspera` (1, 2, 3...)? Quando um participante em espera cancela, como a fila se reordena? Quando uma vaga é liberada, quem é promovido/convocado?
- **Resposta**: Consultar requisitos (pendente para a Rodada 2).
- **Fonte**: Pendente

---

❓ **P-04 — Convocação, Prazo (`convocadaAte`) e Expiração**:
Ao vagar uma vaga, qual o prazo de validade (`convocadaAte`) concedido ao primeiro da lista de espera? O que acontece no instante em que esse prazo expira sem confirmação? O próximo da fila é convocado automaticamente?
- **Resposta**: Consultar requisitos (pendente para a Rodada 2).
- **Fonte**: Pendente

---

❓ **P-05 — Confirmação de Convocação (`POST /inscricoes/:id/confirmacao`)**:
Quais validações ocorrem ao confirmar uma convocação? Em que situações exatas retornam os erros `SEM_CONVOCACAO`, `CONVOCACAO_EXPIRADA`, `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS`?
- **Resposta**: Consultar requisitos (pendente para a Rodada 2).
- **Fonte**: Pendente

---

❓ **P-06 — Cancelamento de Inscrição (`POST /inscricoes/:id/cancelamento`)**:
Quais são as regras para um participante cancelar sua própria inscrição? Em quais estados (`confirmada`, `em_espera`, `convocada`, `cancelada`, `expirada`) o cancelamento é permitido ou resulta em `INSCRICAO_INATIVA`? A partir de qual momento o cancelamento de inscrição retorna `ATIVIDADE_JA_INICIADA`?
- **Resposta**: Consultar requisitos (pendente para a Rodada 2).
- **Fonte**: Pendente

---

❓ **P-07 — Impacto do Cancelamento de Atividade (M1 -> M2)**:
Quando uma atividade é cancelada no M1 (`POST /atividades/:id/cancelamento`), qual o impacto direto sobre todas as suas inscrições existentes (`confirmada`, `em_espera`, `convocada`)?
- **Resposta**: Consultar requisitos (pendente para a Rodada 2).
- **Fonte**: Pendente

---

❓ **P-08 — Precedência e Ordem das Validações de Negócio**:
Quando mais de uma regra de negócio recusar a mesma operação no M2 (por exemplo, `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS` ocorrendo juntas), qual é a ordem de precedência dos códigos de erro?
- **Resposta**: Consultar requisitos (pendente para a Rodada 2).
- **Fonte**: Pendente

---

### 2. Perguntas Técnicas, de UX e de Contrato (Outras)

❓ **P-09 — Autorização e Visibilidade das Inscrições (`GET /inscricoes` e `GET /inscricoes/:id`)**:
Como é aplicada a regra de autorização? O participante só pode visualizar as suas próprias inscrições no `GET /inscricoes` e `GET /inscricoes/:id`? A organização pode visualizar as inscrições de qualquer participante? Como funciona o filtro `?atividadeId=`?
- **Resposta**: No `GET /inscricoes`, se o usuário for participante, o sistema filtra e retorna apenas as inscrições pertencentes a ele. Se for organização, retorna todas as inscrições. O parâmetro `?atividadeId=` filtra os resultados por atividade. Em `GET /inscricoes/:id`, um participante só pode ver sua própria inscrição (se tentar ver a inscrição de outro participante, retorna 404 NAO_ENCONTRADO para não expor a existência de IDs alheios, ou 403 conforme regra de autorização).
- **Fonte**: `contrato-api.md` e convenções do projeto.

---

❓ **P-10 — Telas e Fluxo da Interface Web (UX do M2)**:
Quais componentes e fluxos visuais do M2 devem estar presentes na interface web?
- **Resposta**: A interface do M2 deve oferecer:
  1. Aba/Seção "Minhas Inscrições" para o participante visualizar suas inscrições ativas (confirmadas, em espera com sua posição na fila, convocadas exibindo a contagem regressiva do prazo de convocação `convocadaAte` com botão de confirmar vaga, e histórico de canceladas/expiradas).
  2. Botões de ação contextual na tela de detalhes da atividade do M1 e na lista de inscrições: "Inscrever-se" (se não inscrito), "Confirmar Vaga" (se convocado), "Cancelar Inscrição" (se confirmada, convocada ou em espera).
  3. Visualização da lista de inscritos e fila de espera para o perfil de organização.
- **Fonte**: Decisão técnica de UX, alinhamento da equipe e integração com a interface.

---

❓ **P-11 — Integração de Módulos (M1, M2 e M5)**:
Como deve ser feita a comunicação entre o M2 e os demais módulos para manter a separação de camadas sem acoplamento direto?
- **Resposta**: M2 consumirá interfaces/portas do M1 para obter dados públicos da atividade (encontros, horários, situação e total de vagas) e do M5 para verificar se o participante possui bloqueios vigentes. O M2 fornecerá ao M1 uma interface de consulta que retorna `ocupadas`, `vagasRestantes` e `emEspera` para serem exibidos no objeto `Atividade`.
- **Fonte**: `AGENTS.md` (Organização dos módulos) e `contrato-api.md`.

---

❓ **P-12 — Testes Automatizados da Interface e API Falsa**:
Como os testes do M2 na interface web (`app`) devem ser implementados sem depender da API real?
- **Resposta**: Conforme definido no `AGENTS.md` do repositório e no `app/AGENTS.md`, a stack da interface do projeto é React, Vite com Vitest e Testing Library. O cliente HTTP centralizado será substituído por uma implementação falsa/mock nos testes, cobrindo os cenários de inscrição, convocação, contagem regressiva do prazo, fila de espera, cancelamento e exibição dos erros retornados pela API (como `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS`).
- **Fonte**: `AGENTS.md`, `app/AGENTS.md` e `projeto.json`.
