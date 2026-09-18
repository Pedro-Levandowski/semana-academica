# Entrevista — Módulo M2: Inscrições e Lista de Espera

## Rodada 1 — Levantamento de Requisitos e Decisões

### 1. Perguntas de Regra de Negócio (Requisitos do Negócio)

❓ **P-01 — Inscrição Direta vs. Lista de Espera e Encerramento**:
Ao realizar `POST /atividades/:id/inscricoes`, em que condições a inscrição assume o status `confirmada` e quando assume `em_espera`? Quais são as regras exatas que determinam quando as inscrições estão encerradas (`INSCRICOES_ENCERRADAS`)?
- **Resposta**: A inscrição assume o status `confirmada` quando existem vagas disponíveis na atividade. Quando não há vaga livre, a inscrição assume o status `em_espera`. As inscrições para uma atividade são encerradas (`INSCRICOES_ENCERRADAS`) exatamente 30 minutos antes do início do seu primeiro encontro.
- **Fonte**: RN-205, RN-202

---

❓ **P-02 — Restrições e Erros de Inscrição (`JA_INSCRITO`, `INSCRICAO_BLOQUEADA`, `LIMITE_DE_MINICURSOS`, `CONFLITO_DE_HORARIO`)**:
Quais são os critérios e regras exatas para disparar cada um dos erros ao tentar se inscrever?
- `JA_INSCRITO`: participante já possui inscrição ativa (confirmada, convocada ou em espera) nesta atividade?
- `INSCRICAO_BLOQUEADA`: como é verificado o bloqueio oriundo do M5?
- `LIMITE_DE_MINICURSOS`: qual o limite máximo de minicurso por participante na Semana Acadêmica?
- `CONFLITO_DE_HORARIO`: como se define a sobreposição de horário entre encontros de atividades em que o participante já está inscrito/confirmado/convocado?
- **Resposta**:
  - `JA_INSCRITO` (RN-204): disparado se o participante já possui inscrição ativa (`confirmada`, `em_espera` ou `convocada`) na atividade. Quem cancelou pode se inscrever novamente, porém entra no final da fila de espera, sem recuperar a posição anterior.
  - `LIMITE_DE_MINICURSOS` (RN-207): cada participante pode ocupar vaga (`confirmada` ou `convocada`) em no máximo 3 minicursos ao mesmo tempo. Palestras não contam para este limite e inscrições em status `em_espera` também não.
  - `CONFLITO_DE_HORARIO` (RN-206): verificado apenas quando a inscrição ocupa vaga (`confirmada` ou `convocada`), checando se há sobreposição de horário nos encontros com outra atividade em que o participante também ocupe vaga. Horários que apenas se encostam (ex.: um termina às 12:00 e outro começa às 12:00) não geram conflito. Inscrições `em_espera` não geram nem sofrem validação de conflito.
  - `INSCRICAO_BLOQUEADA` (RN-507): verificado via integração com M5 quando o participante possui 2 atividades encerradas com zero presença em ambas. Participante bloqueado não pode realizar novas inscrições nem entrar em lista de espera, mas mantém válidas as inscrições realizadas antes do bloqueio.
- **Fonte**: RN-204, RN-206, RN-207, RN-507

---

❓ **P-03 — Gestão da Lista de Espera e `posicaoNaEspera`**:
Como é atribuída a `posicaoNaEspera` (1, 2, 3...)? Quando um participante em espera cancela, como a fila se reordena? Quando uma vaga é liberada, quem é promovido/convocado?
- **Resposta**: A `posicaoNaEspera` (RN-216) é calculada dinamicamente conforme a ordem de chegada (data/hora em que a inscrição em espera foi criada), onde a posição 1 é sempre a próxima a ser convocada. Quando um participante em espera cancela, a fila se reordena automaticamente, ajustando a posição dos demais conforme a ordem de chegada remanescente. Quando uma vaga é liberada (por cancelamento, expiração de convocação ou aumento de vagas), o primeiro da fila (`posicaoNaEspera` 1) é convocado automaticamente com prazo de 2 horas para confirmar (RN-211). Se uma convocação expirar sem ser confirmada, o próximo da fila é convocado em cascata (RN-213).
- **Fonte**: RN-216, RN-211, RN-213

---

❓ **P-04 — Convocação, Prazo (`convocadaAte`) e Expiração**:
Ao vagar uma vaga, qual o prazo de validade (`convocadaAte`) concedido ao primeiro da lista de espera? O que acontece no instante em que esse prazo expira sem confirmação? O próximo da fila é convocado automaticamente?
- **Resposta**: O prazo de validade padrão da convocação é de 2 horas (RN-211). No entanto, o prazo de convocação nunca pode ultrapassar o momento de encerramento das inscrições (30 minutos antes do 1º encontro da atividade) (RN-212). Se a vaga for liberada faltando menos de 2h para o encerramento, o prazo é truncado no horário limite de encerramento. Se for liberada após o encerramento das inscrições, não há nova convocação e a vaga permanece livre. Ao expirar o prazo sem confirmação, a inscrição muda para o status `expirada`, sai da fila e o próximo participante da espera é convocado automaticamente com novo prazo de 2 horas (respeitando o teto de encerramento) (RN-213).
- **Fonte**: RN-211, RN-212, RN-213, RN-202

---

❓ **P-05 — Confirmação de Convocação (`POST /inscricoes/:id/confirmacao`)**:
Quais validações ocorrem ao confirmar uma convocação? Em que situações exatas retornam os erros `SEM_CONVOCACAO`, `CONVOCACAO_EXPIRADA`, `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS`?
- **Resposta**:
  - `SEM_CONVOCACAO` (RN-215): retornado se a inscrição a ser confirmada não estiver com o status `convocada`.
  - `CONVOCACAO_EXPIRADA` (RN-215): retornado se a tentativa de confirmação ocorrer após o vencimento do prazo `convocadaAte`.
  - `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS` (RN-214): ao confirmar uma convocação, o sistema revalida as regras de conflito de horário (RN-206) e limite de 3 minicursos (RN-207). Se a confirmação for recusada por conflito de horário ou limite de minicursos, a convocação continua válida mantendo o status `convocada` até que o prazo `convocadaAte` expire, permitindo ao participante remover o conflito e tentar confirmar novamente.
- **Fonte**: RN-214, RN-215, RN-206, RN-207

---

❓ **P-06 — Cancelamento de Inscrição (`POST /inscricoes/:id/cancelamento`)**:
Quais são as regras para um participante cancelar sua própria inscrição? Em quais estados (`confirmada`, `em_espera`, `convocada`, `cancelada`, `expirada`) o cancelamento é permitido ou resulta em `INSCRICAO_INATIVA`? A partir de qual momento o cancelamento de inscrição retorna `ATIVIDADE_JA_INICIADA`?
- **Resposta**: O participante pode cancelar sua própria inscrição até o início do primeiro encontro da atividade (RN-209). Se o relógio do sistema for igual ou posterior ao início do primeiro encontro, o cancelamento é recusado retornando `ATIVIDADE_JA_INICIADA`. O cancelamento é permitido apenas para inscrições em estados ativos (`confirmada`, `em_espera` ou `convocada`). Tentar cancelar uma inscrição que já esteja inativa (`cancelada` ou `expirada`) resulta no erro `INSCRICAO_INATIVA` (RN-210).
- **Fonte**: RN-209, RN-210

---

❓ **P-07 — Impacto do Cancelamento de Atividade (M1 -> M2)**:
Quando uma atividade é cancelada no M1 (`POST /atividades/:id/cancelamento`), qual o impacto direto sobre todas as suas inscrições existentes (`confirmada`, `em_espera`, `convocada`)?
- **Resposta**: Quando uma atividade é cancelada no M1, todas as suas inscrições ativas (status `confirmada`, `em_espera` ou `convocada`) passam automaticamente para o status `cancelada`. Inscrições que já estavam inativas (`cancelada` ou `expirada`) não sofrem alteração.
- **Fonte**: RN-217

---

❓ **P-08 — Precedência e Ordem das Validações de Negócio**:
Quando mais de uma regra de negócio recusar a mesma operação no M2 (por exemplo, `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS` ocorrendo juntas), qual é a ordem de precedência dos códigos de erro?
- **Resposta**: Quando múltiplas condições de recusa ocorrerem simultaneamente, a ordem rígida de precedência dos erros é:
  1. Atividade inexistente (`404 NOT_FOUND`)
  2. Atividade cancelada (`ATIVIDADE_CANCELADA`)
  3. Inscrições encerradas (`INSCRICOES_ENCERRADAS`)
  4. Bloqueio por faltas (`INSCRICAO_BLOQUEADA` — via M5)
  5. Já inscrito (`JA_INSCRITO`)
  6. Conflito de horário (`CONFLITO_DE_HORARIO`)
  7. Limite de minicursos (`LIMITE_DE_MINICURSOS`)
- **Fonte**: RN-208, RN-507

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
