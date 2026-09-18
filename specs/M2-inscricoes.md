# Spec — M2-inscricoes

## 1. Objetivo
Gerenciar o ciclo de vida completo de inscrições em palestras e minicursos da Semana Acadêmica, englobando inscrições diretas, controle de capacidade de vagas, lista de espera com convocação automática e prazos de validade, gerenciamento dinâmico de posições na fila, confirmação e cancelamento de inscrições, revalidações de restrições de negócio (limite de minicursos, conflito de horários e bloqueio por faltas do M5) e disponibilização de consultas para participantes e organização.

## 2. Fora de escopo
O módulo M2 **não** inclui e está estritamente proibido de implementar:
- Criação, edição, cancelamento ou alteração da grade de atividades ou salas (pertencentes ao M1).
- Controle e registro de presença por QR code, leitura offline ou chamada manual (pertencentes ao M3).
- Emissão e verificação pública de certificados ou geração de extrato de horas (pertencentes ao M4).
- Determinação de regras de faltas, cálculo da condição "sem chance", download de frequência CSV ou remoção de bloqueios (pertencentes ao M5).
- Funcionalidades de login, cadastro, gerenciamento de senhas ou autenticação por token JWT.
- Processamento de pagamentos, taxas de inscrição, envio de e-mails ou notificações push (convocações e prazos são consultados via API/interface).
- Realização de inscrições fora do sistema ou importação de inscrições via planilhas.

## 3. Modelo
Entidades e objetos gerenciados ou expostos pelo M2:
- **Inscricao**:
  - `id`: string, prefixo `ins_` + 8 hexadecimais minúsculos (gerado pelo sistema)
  - `atividadeId`: string (referência à atividade do M1)
  - `participanteId`: string (id do participante, extraído do cabeçalho `X-Usuario`)
  - `status`: string, `"confirmada"`, `"em_espera"`, `"convocada"`, `"cancelada"` ou `"expirada"` (atribuído pelo sistema)
  - `posicaoNaEspera`: número inteiro (`1`, `2`, `3`...) somente quando `status` for `"em_espera"`; `null` nos demais status (calculado dinamicamente pela ordem de criação `criadaEm`)
  - `convocadaAte`: string ISO 8601 com fuso, somente quando `status` for `"convocada"`; `null` nos demais status (calculado pelo sistema com base no instante de convocação + 2 horas, limitado ao horário de encerramento das inscrições)
  - `criadaEm`: string ISO 8601 com fuso (instante em que a inscrição foi realizada no sistema)

- **Contagens de Ocupação da Atividade** (expostas ao M1 via porta de integração):
  - `ocupadas`: número inteiro de inscrições que ocupam vaga (`confirmada` + `convocada`)
  - `emEspera`: número inteiro de inscrições ativas com status `"em_espera"`
  - `vagasRestantes`: número inteiro (`vagas - ocupadas`)

## 4. Endpoints
Métodos, caminhos, papéis, corpos e códigos de sucesso conforme `contrato-api.md`:
- `POST /atividades/:id/inscricoes` (participante) → 201 `Inscricao` (sem corpo na entrada)
- `GET /inscricoes` (todos) → 200 `[Inscricao]` (participante recebe apenas as suas; organização recebe todas; suporte ao filtro `?atividadeId=`)
- `GET /inscricoes/:id` (todos) → 200 `Inscricao` (participante visualiza apenas a sua própria inscrição)
- `POST /inscricoes/:id/cancelamento` (participante) → 200 `Inscricao` (sem corpo na entrada)
- `POST /inscricoes/:id/confirmacao` (participante) → 200 `Inscricao` (sem corpo na entrada)

## 5. Regras
- **R1** (Status inicial de inscrição e vagas): Ao realizar `POST /atividades/:id/inscricoes`, se a atividade possuir vaga livre (`vagasRestantes > 0`), a inscrição é criada com status `"confirmada"` e `posicaoNaEspera: null`. Se não houver vaga livre (`vagasRestantes == 0`), a inscrição é criada com status `"em_espera"`. *(Origem: P-01; RN-205)*
- **R2** (Encerramento de inscrições): Inscrições para uma atividade são encerradas no instante em que faltam exatamente 30 minutos para o início do seu primeiro encontro. Tentativas de inscrição (`POST /atividades/:id/inscricoes`) realizadas quando o relógio for maior ou igual a esse horário limite (`agora >= inicio_1o_encontro - 30 minutos`) retornam 422 `INSCRICOES_ENCERRADAS`. *(Origem: P-01, P-04; RN-202)*
- **R3** (Prevenção de inscrição duplicada): Participante com inscrição ativa (`confirmada`, `em_espera` ou `convocada`) na mesma atividade não pode realizar nova inscrição. Tentativas retornam 409 `JA_INSCRITO`. Participantes com inscrição inativa (`cancelada` ou `expirada`) podem se inscrever novamente, sem prioridade ou recuperação de posição anterior. *(Origem: P-02; RN-204)*
- **R4** (Bloqueio por faltas acumuladas): Participante com bloqueio vigente oriundo do M5 (2 atividades encerradas com zero presença em ambas) não pode realizar novas inscrições nem entrar em lista de espera. Tentativas retornam 422 `INSCRICAO_BLOQUEADA`. Inscrições realizadas antes do bloqueio permanecem válidas. *(Origem: P-02; RN-507)*
- **R5** (Limite de minicursos): Cada participante pode ocupar vaga (`confirmada` ou `convocada`) em no máximo 3 minicursos ao mesmo tempo. Tentativa de inscrição que ocuparia vaga no 4º minicurso retorna 422 `LIMITE_DE_MINICURSOS`. Palestras e inscrições com status `"em_espera"` não contam para esse limite. *(Origem: P-02; RN-207)*
- **R6** (Conflito de horários): A verificação de sobreposição de horários aplica-se somente quando a inscrição ocupa vaga (`confirmada` ou `convocada`). Retorna 409 `CONFLITO_DE_HORARIO` se houver sobreposição nos horários dos encontros entre a nova atividade e outra atividade na qual o participante já ocupe vaga (`confirmada` ou `convocada`). Encontros que apenas se encostam (ex: um termina às 12:00 e outro começa às 12:00) não geram conflito. Inscrições `"em_espera"` não geram nem sofrem validação de conflito. *(Origem: P-02; RN-206)*
- **R7** (Ordem de precedência de validações no POST /inscricoes): Conforme a ordem global do contrato (identificação 401 → perfil 403 → existência 404 → regras), a verificação do cabeçalho `X-Usuario` (401) e do papel de participante (403, R20) ocorre antes de qualquer validação do recurso. Quando a requisição for realizada por participante autenticado e múltiplas condições de recusa ocorrerem simultaneamente, a ordem rígida de precedência dos erros é:
  1. Atividade inexistente (404 `NAO_ENCONTRADO`)
  2. Atividade cancelada (422 `ATIVIDADE_CANCELADA`)
  3. Inscrições encerradas (422 `INSCRICOES_ENCERRADAS`)
  4. Bloqueio por faltas (422 `INSCRICAO_BLOQUEADA`)
  5. Já inscrito (409 `JA_INSCRITO`)
  6. Conflito de horário (409 `CONFLITO_DE_HORARIO`)
  7. Limite de minicursos (422 `LIMITE_DE_MINICURSOS`)
  *(Origem: P-08; RN-208, RN-507, `contrato-api.md`)*
- **R8** (Posição na fila de espera e reordenação): Inscrições `"em_espera"` recebem `posicaoNaEspera` inteira sequencial (1, 2, 3...) estritamente baseada na ordem de criação (`criadaEm`). Quando uma inscrição em espera é cancelada, as posições dos participantes remanescentes na fila são reordenadas automaticamente mantendo a ordem de chegada. *(Origem: P-03; RN-216)*
- **R9** (Convocação automática de vaga liberada): Quando uma vaga é liberada (por cancelamento de inscrição confirmada/convocada, expiração de convocação ou aumento de vagas pelo M1), o primeiro participante da lista de espera (`posicaoNaEspera: 1`) é convocado automaticamente se o momento da liberação for anterior ao encerramento das inscrições (`agora < inicio_1o_encontro - 30 minutos`). A inscrição passa para status `"convocada"`, `posicaoNaEspera` torna-se `null` e é atribuído o prazo `convocadaAte`. *(Origem: P-03, P-04; RN-211, RN-212)*
- **R10** (Cálculo do prazo convocadaAte): O prazo padrão de convocação é de 2 horas a partir do momento da convocação (`convocadaAte = agora + 2h`). Se o tempo restante até o encerramento das inscrições for menor que 2 horas, o prazo é truncado no limite exato de encerramento (`convocadaAte = inicio_1o_encontro - 30 minutos`). Se a vaga for liberada após o encerramento das inscrições (`agora >= inicio_1o_encontro - 30 minutos`), não há convocação e a vaga permanece livre. *(Origem: P-04; RN-211, RN-212)*
- **R11** (Expiração de convocação e convocação em cascata): Quando o relógio do sistema atinge ou ultrapassa `convocadaAte` sem confirmação, a inscrição passa automaticamente para o status `"expirada"` (`convocadaAte` torna-se `null`). Em seguida, se ainda for anterior ao encerramento das inscrições, o próximo participante da fila (`posicaoNaEspera: 1`) é convocado em cascata aplicando as regras R9 e R10. *(Origem: P-03, P-04; RN-213)*
- **R12** (Confirmação de convocação válida): Ao executar `POST /inscricoes/:id/confirmacao` dentro do prazo (`agora <= convocadaAte`), se as validações de `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS` passarem, a inscrição assume status `"confirmada"` e `convocadaAte` torna-se `null`. *(Origem: P-05; RN-214)*
- **R13** (Recusa de confirmação sem convocação ou expirada): Tentativa de confirmação (`POST /inscricoes/:id/confirmacao`) em inscrição com status diferente de `"convocada"` retorna 422 `SEM_CONVOCACAO`. Se a inscrição estiver convocada porém o prazo já tiver expirado (`agora > convocadaAte`), retorna 422 `CONVOCACAO_EXPIRADA`. *(Origem: P-05; RN-215)*
- **R14** (Revalidação de regras e manutenção do status na confirmação): Ao confirmar uma convocação, o sistema revalida as regras de `CONFLITO_DE_HORARIO` (R6) e `LIMITE_DE_MINICURSOS` (R5). Se a revalidação falhar, a requisição é recusada com 409 `CONFLITO_DE_HORARIO` ou 422 `LIMITE_DE_MINICURSOS`, e a convocação MANTÉM o status `"convocada"` e o prazo `convocadaAte` inalterados, permitindo que o participante resolva o conflito antes da expiração. *(Origem: P-05; RN-206, RN-207, RN-214)*
- **R15** (Cancelamento pelo participante e limite temporal): Participante pode cancelar sua inscrição ativa (`confirmada`, `"em_espera"` ou `"convocada"`) via `POST /inscricoes/:id/cancelamento`. O cancelamento é recusado com 422 `ATIVIDADE_JA_INICIADA` se o relógio for maior ou igual ao início do primeiro encontro da atividade (`agora >= inicio_1o_encontro`). *(Origem: P-06; RN-209)*
- **R16** (Cancelamento de inscrição inativa): Tentativa de cancelar inscrição com status `"cancelada"` ou `"expirada"` retorna 422 `INSCRICAO_INATIVA`. *(Origem: P-06; RN-210)*
- **R17** (Impacto do cancelamento de atividade do M1): Quando uma atividade é cancelada no M1 (`POST /atividades/:id/cancelamento`), o M2 altera automaticamente todas as inscrições ativas (`confirmada`, `"em_espera"`, `"convocada"`) dessa atividade para status `"cancelada"`. Inscrições inativas (`cancelada` ou `expirada`) não sofrem alteração. *(Origem: P-07; RN-217)*
- **R18** (Listagem de inscrições por perfil e filtro): `GET /inscricoes` retorna lista de inscrições. Se requisitado por participante (`papel === "participante"`), retorna apenas as suas inscrições. Se requisitado por organização (`papel === "organizacao"`), retorna todas as inscrições. Parâmetro opcional `?atividadeId=` filtra apenas as inscrições da atividade informada. *(Origem: P-09; `contrato-api.md`)*
- **R19** (Consulta individual de inscrição por ID): `GET /inscricoes/:id` retorna os detalhes de uma inscrição. Participantes só podem visualizar inscrições próprias; tentativas de consultar inscrição de outro participante retornam 404 `NAO_ENCONTRADO`. A organização pode consultar qualquer inscrição. *(Origem: P-09; `contrato-api.md`)*
- **R20** (Autenticação e controle de acesso por papel): Todas as rotas de mutação de inscrição (`POST /atividades/:id/inscricoes`, `POST /inscricoes/:id/cancelamento`, `POST /inscricoes/:id/confirmacao`) são exclusivas de participantes. Tentativas feitas por usuários do papel `organizacao` retornam 403 `SOMENTE_PARTICIPANTE`. Cabeçalho `X-Usuario` ausente ou com ID desconhecido retorna 401 `USUARIO_DESCONHECIDO`. *(Origem: P-09, P-11; `contrato-api.md`)*
- **R21** (Porta de integração de ocupação para o M1): O M2 expõe porta de consulta ao M1 para retornar `ocupadas` (total de `confirmada` + `convocada`), `emEspera` (total de `em_espera`) e `vagasRestantes` (`vagas - ocupadas`). *(Origem: P-11; `contrato-api.md`, RN-111)*
- **R22** (Validações estruturais do contrato): Corpo não-JSON ou recurso inexistente (`atividadeId` em `/atividades/:id/inscricoes` ou `id` em `/inscricoes/:id/*`) respondem com 404 `NAO_ENCONTRADO` se o recurso não existir ou 422 `DADOS_INVALIDOS` se o corpo for malformado. *(Origem: P-12; `contrato-api.md`)*
- **R23** (Requisitos da interface web — Minhas Inscrições e Ações Visuais): A interface web deve exibir a seção "Minhas Inscrições" com as inscrições do participante (confirmadas, em espera com posição na fila, convocadas com contagem regressiva e botão de confirmação, e histórico de canceladas/expiradas), botões contextuais de "Inscrever-se", "Confirmar Vaga" e "Cancelar Inscrição", e visualização da lista de inscritos/espera para a organização. *(Origem: P-10; decisão de UX, `contrato-api.md`)*
- **R24** (Testes automatizados da interface com API falsa): Os testes do M2 na interface (`app`) usam Vitest e Testing Library com cliente HTTP falso/mock, cobrindo os cenários de inscrição, convocação com contagem regressiva, confirmação, fila de espera, cancelamento e exibição de mensagens de erro. *(Origem: P-12; `AGENTS.md`, `app/AGENTS.md`)*

## 6. Critérios de aceite
1. (R1) Dado um `POST /atividades/:id/inscricoes` por um participante em atividade com vagas livres, a API cria a inscrição com status `"confirmada"` e `posicaoNaEspera: null`.
2. (R1) Dado um `POST /atividades/:id/inscricoes` por um participante em atividade sem vagas livres, a API cria a inscrição com status `"em_espera"` e `posicaoNaEspera` igual a `1` (se primeira na fila).
3. (R2) Dado um `POST /atividades/:id/inscricoes` faltando exatamente 30 minutos ou menos para o início do primeiro encontro, a API responde com status 422 e corpo `{"erro": "INSCRICOES_ENCERRADAS", "mensagem": "..."}`.
4. (R2) Dado um `POST /atividades/:id/inscricoes` faltando 30 minutos e 1 segundo para o início do primeiro encontro, a API processa e aceita a inscrição.
5. (R3) Dado um `POST /atividades/:id/inscricoes` de um participante com inscrição ativa (`confirmada`, `em_espera` ou `convocada`) na mesma atividade, a API responde com status 409 e corpo `{"erro": "JA_INSCRITO", "mensagem": "..."}`.
6. (R3) Dado um `POST /atividades/:id/inscricoes` de um participante que havia cancelado ou cuja convocação havia expirado na atividade, a API aceita a nova inscrição e a insere ao final da fila (se sem vagas) ou como confirmada (se com vagas).
7. (R4) Dado um `POST /atividades/:id/inscricoes` por um participante bloqueado pelo M5 (2 atividades encerradas com zero presença em ambas), a API responde com status 422 e corpo `{"erro": "INSCRICAO_BLOQUEADA", "mensagem": "..."}`.
8. (R5) Dado um participante com vaga ocupada (`confirmada` ou `convocada`) em 3 minicursos, ao tentar se inscrever num 4º minicurso com vaga livre, a API responde com status 422 e corpo `{"erro": "LIMITE_DE_MINICURSOS", "mensagem": "..."}`.
9. (R5) Dado um participante com 3 minicursos em estado `"em_espera"`, ao tentar se inscrever em outro minicurso, a API aceita a inscrição sem disparar `LIMITE_DE_MINICURSOS`.
10. (R5) Dado um participante com 3 palestras em estado `"confirmada"`, ao tentar se inscrever num minicurso, a API aceita a inscrição sem disparar `LIMITE_DE_MINICURSOS`.
11. (R6) Dado um participante com vaga em uma atividade A, ao tentar se inscrever em atividade B com sobreposição de horários nos encontros, a API responde com status 409 e corpo `{"erro": "CONFLITO_DE_HORARIO", "mensagem": "..."}`.
12. (R6) Dado um participante com vaga em atividade A terminando às 14:00, ao se inscrever em atividade B iniciando às 14:00, a API aceita a inscrição sem conflito.
13. (R6) Dado um participante com inscrição `"em_espera"` em atividade A, ao se inscrever em atividade B no mesmo horário, a API aceita a inscrição sem conflito.
14. (R7) Dado um pedido de inscrição que viole `CONFLITO_DE_HORARIO` e `LIMITE_DE_MINICURSOS` simultaneamente, a API responde com status 409 `CONFLITO_DE_HORARIO` (devido à precedência).
15. (R7) Dado um pedido de inscrição para atividade cancelada que também violaria `JA_INSCRITO`, a API responde com status 422 `ATIVIDADE_CANCELADA`.
16. (R7) Dado um pedido de inscrição com inscrições encerradas que também violaria `INSCRICAO_BLOQUEADA`, a API responde com status 422 `INSCRICOES_ENCERRADAS`.
17. (R8) Dada uma fila de espera com 3 inscritos nas posições 1, 2 e 3, quando o participante da posição 1 cancela sua inscrição, o participante anteriormente na posição 2 passa para a posição 1 e o da posição 3 passa para a 2.
18. (R9, R10) Quando uma vaga é liberada (ex: por cancelamento de confirmada às 10:00, com 1º encontro às 15:00 do mesmo dia), o participante na `posicaoNaEspera: 1` é convocado com status `"convocada"`, `posicaoNaEspera: null` e `convocadaAte: "12:00:00"` (2 horas após).
19. (R10) Quando uma vaga é liberada às 14:00 para uma atividade cujo 1º encontro começa às 16:00 (encerramento das inscrições às 15:30), o participante é convocado com `convocadaAte: "15:30:00"` (truncado no limite de encerramento).
20. (R10) Quando uma vaga é liberada às 15:31 (após o encerramento das inscrições às 15:30), nenhum participante da fila é convocado e a vaga permanece livre.
21. (R11) Quando o relógio do sistema atinge/ultrapassa o horário `convocadaAte` de uma convocação não confirmada, o status da inscrição muda para `"expirada"` e o próximo da fila de espera é convocado automaticamente.
22. (R12) Dado `POST /inscricoes/:id/confirmacao` realizado por participante convocado dentro do prazo e sem conflitos, a API atualiza o status para `"confirmada"` e define `convocadaAte: null`.
23. (R13) Dado `POST /inscricoes/:id/confirmacao` em uma inscrição com status `"confirmada"` ou `"em_espera"`, a API responde com status 422 e corpo `{"erro": "SEM_CONVOCACAO", "mensagem": "..."}`.
24. (R13) Dado `POST /inscricoes/:id/confirmacao` em uma convocação cujo prazo `convocadaAte` já expirou, a API responde com status 422 e corpo `{"erro": "CONVOCACAO_EXPIRADA", "mensagem": "..."}`.
25. (R14) Dado `POST /inscricoes/:id/confirmacao` por um participante que adquiriu conflito de horário em outra atividade após ser convocado, a API responde com status 409 `CONFLITO_DE_HORARIO` e mantém a inscrição no status `"convocada"` com o mesmo `convocadaAte`.
26. (R15) Dado `POST /inscricoes/:id/cancelamento` antes do início do primeiro encontro, a API atualiza o status da inscrição para `"cancelada"`.
27. (R15) Dado `POST /inscricoes/:id/cancelamento` no instante exato do início do primeiro encontro ou após, a API responde com status 422 e corpo `{"erro": "ATIVIDADE_JA_INICIADA", "mensagem": "..."}`.
28. (R16) Dado `POST /inscricoes/:id/cancelamento` em uma inscrição que já está com status `"cancelada"` ou `"expirada"`, a API responde com status 422 e corpo `{"erro": "INSCRICAO_INATIVA", "mensagem": "..."}`.
29. (R17) Quando uma atividade é cancelada no M1 via `POST /atividades/:id/cancelamento`, todas as suas inscrições ativas (`confirmada`, `em_espera`, `convocada`) passam automaticamente para status `"cancelada"`.
30. (R18) Dado `GET /inscricoes` autenticado como participante `p-carla`, a API retorna somente as inscrições de `p-carla`.
31. (R18) Dado `GET /inscricoes` autenticado como organização `org-ana`, a API retorna todas as inscrições do sistema.
32. (R18) Dado `GET /inscricoes?atividadeId=atv_12345678`, a API retorna apenas as inscrições associadas a essa atividade.
33. (R19) Dado `GET /inscricoes/:id` por um participante consultando a própria inscrição, a API responde status 200 com a `Inscricao`.
34. (R19) Dado `GET /inscricoes/:id` por um participante tentando consultar a inscrição de outro participante, a API responde status 404 e corpo `{"erro": "NAO_ENCONTRADO", "mensagem": "..."}`.
35. (R20) Dado `POST /atividades/:id/inscricoes` autenticado como organização `org-ana`, a API responde com status 403 e corpo `{"erro": "SOMENTE_PARTICIPANTE", "mensagem": "..."}`.
36. (R20) Dado `POST /inscricoes/:id/confirmacao` autenticado como organização `org-ana`, a API responde com status 403 e corpo `{"erro": "SOMENTE_PARTICIPANTE", "mensagem": "..."}`.
37. (R20) Dado `POST /inscricoes/:id/cancelamento` autenticado como organização `org-ana`, a API responde com status 403 e corpo `{"erro": "SOMENTE_PARTICIPANTE", "mensagem": "..."}`.
38. (R21) O M1 consulta a porta de ocupação do M2 e obtém `ocupadas`, `emEspera` e `vagasRestantes` calculados corretamente a partir das inscrições registradas.
39. (R22) Dado `POST /atividades/atv_inexistente/inscricoes`, a API responde com status 404 e corpo `{"erro": "NAO_ENCONTRADO", "mensagem": "..."}`.
40. (R23) A interface exibe a seção "Minhas Inscrições", contagem regressiva para convocações e botões de "Inscrever-se", "Confirmar Vaga" e "Cancelar Inscrição" conforme o status.
41. (R24) Os testes da interface no `app` utilizam mock de API e exercitam todas as ações e mensagens de erro do M2.
42. (R7, R20) Dado um `POST /atividades/atv_inexistente/inscricoes` autenticado como organização (`org-ana`), a API responde com status 403 e corpo `{"erro": "SOMENTE_PARTICIPANTE", "mensagem": "..."}` (a verificação de perfil 403 prevalece sobre recurso inexistente 404).

## 7. Como isto será verificado
A verificação será realizada externamente (sem leitura de código):
- Pela API: utilizando testes automatizados (Supertest/Vitest) com `MODO_TESTE=1`, exercitando a criação de inscrições, transições de lista de espera, convocação automática, prazos de expiração por avanço do relógio (`PUT /_teste/relogio`), revalidações de conflito e limites, cancelamentos e a ordem de precedência de erros.
- Pela interface web: utilizando testes automatizados (Vitest + Testing Library com mock API) e validação manual cobrindo a exibição de "Minhas Inscrições", botões de ação dinâmica na página de detalhes e lista de inscrições, cálculo e contagem do tempo de convocação e tratamento de erros retornados pela API.

## 8. Fatias de entrega
1. **Fatia 1 — Inscrições Diretas e Consultas (API)**
   - `POST /atividades/:id/inscricoes` para inscrições confirmadas (quando há vagas), validações básicas (`JA_INSCRITO`, `INSCRICOES_ENCERRADAS`), `GET /inscricoes` e `GET /inscricoes/:id` por perfil e filtro `?atividadeId=`, e porta de integração de ocupação para o M1 (`ocupadas`, `emEspera`, `vagasRestantes`).
2. **Fatia 2 — Validações de Negócio e Conflitos (API)**
   - Validações de `CONFLITO_DE_HORARIO` (R6), `LIMITE_DE_MINICURSOS` (R5), `INSCRICAO_BLOQUEADA` via porta do M5 (R4) e ordem de precedência rigorosa (R7).
3. **Fatia 3 — Lista de Espera, Convocações e Tempo (API)**
   - Inscrição em status `"em_espera"` (R1), cálculo dinâmico de `posicaoNaEspera` (R8), convocação automática e cálculo de `convocadaAte` (R9, R10), expiração por relógio e convocação em cascata (R11), e confirmação de vaga (`POST /inscricoes/:id/confirmacao`) com revalidações (R12, R13, R14).
4. **Fatia 4 — Cancelamentos e Integrações de Eventos (API)**
   - Cancelamento pelo participante (`POST /inscricoes/:id/cancelamento`) com liberação de vaga (R15, R16), e integração com cancelamento de atividade pelo M1 (R17).
5. **Fatia 5 — Interface Web e Testes (App)**
   - Aba "Minhas Inscrições", botões contextuais na página de detalhes e lista, contagem regressiva de convocação, fluxo da organização para visualizar inscritos/espera, tratamento de mensagens de erro e testes automatizados da interface com API falsa (R23, R24).

---

## Apêndice A: Matriz Regra → Critério de aceite
- R1 → Critérios 1, 2
- R2 → Critérios 3, 4
- R3 → Critérios 5, 6
- R4 → Critério 7
- R5 → Critérios 8, 9, 10
- R6 → Critérios 11, 12, 13
- R7 → Critérios 14, 15, 16, 42
- R8 → Critério 17
- R9 → Critério 18
- R10 → Critérios 18, 19, 20
- R11 → Critério 21
- R12 → Critério 22
- R13 → Critérios 23, 24
- R14 → Critério 25
- R15 → Critérios 26, 27
- R16 → Critério 28
- R17 → Critério 29
- R18 → Critérios 30, 31, 32
- R19 → Critérios 33, 34
- R20 → Critérios 35, 36, 37, 42
- R21 → Critério 38
- R22 → Critério 39
- R23 → Critério 40
- R24 → Critério 41

## Apêndice B: Matriz Origem → Regra/Seção
- P-01 → R1, R2
- P-02 → R3, R4, R5, R6
- P-03 → R8, R9, R11
- P-04 → R2, R9, R10, R11
- P-05 → R12, R13, R14
- P-06 → R15, R16
- P-07 → R17
- P-08 → R7
- P-09 → R18, R19, R20
- P-10 → R23
- P-11 → R20, R21
- P-12 → R22, R24
- RN-202 → R2
- RN-204 → R3
- RN-205 → R1
- RN-206 → R6, R14
- RN-207 → R5, R14
- RN-208 → R7
- RN-209 → R15
- RN-210 → R16
- RN-211 → R9, R10
- RN-212 → R9, R10
- RN-213 → R11
- RN-214 → R12, R14
- RN-215 → R13
- RN-216 → R8
- RN-217 → R17
- RN-507 → R4, R7
- contrato-api.md → Endpoints, Modelo, R18, R19, R20, R21, R22
