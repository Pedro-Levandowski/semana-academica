## Rodada 1 — Entrevista sem consulta aos requisitos

### Bloco 1

❓ **P-01 — Regras de quantidade e formato de encontros**: Ao criar uma atividade (`POST /atividades`), quais são os limites de quantidade de encontros para palestras e minicursos, e quais validações o contrato (`QUANTIDADE_DE_ENCONTROS` e `ENCONTRO_INVALIDO`) exige?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-02 — Limite de vagas versus capacidade da sala**: A verificação de capacidade (`VAGAS_ACIMA_DA_CAPACIDADE`) permite que o número de vagas seja exatamente igual à capacidade da sala ou exige que seja estritamente menor?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-03 — Detecção de conflito de sala**: Como o sistema determina o `CONFLITO_DE_SALA` entre encontros de diferentes atividades na mesma sala? Existe sobreposição exata de horários ou janela de tolerância?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-04 — Critérios de transição da situação temporal**: Quais são as regras exatas de relógio para uma atividade passar de `prevista` para `em_andamento` e de `em_andamento` para `encerrada` (considerando início e fim de seus encontros)?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-05 — Restrições de edição (PATCH)**: Quais campos são permitidos no `PATCH /atividades/:id` e em quais situações ocorre `CAMPO_NAO_EDITAVEL` ou `ATIVIDADE_CANCELADA`?
- **Resposta**: PENDENTE (consultar requisitos)

---

### Bloco 2

❓ **P-06 — Regras de cancelamento de atividade**: Quais são as condições e restrições exatas para cancelar uma atividade (`POST /atividades/:id/cancelamento`), incluindo os códigos de erro `ATIVIDADE_JA_INICIADA` e `ATIVIDADE_CANCELADA`?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-07 — Cálculo da carga horária**: Como o campo `cargaHorariaMinutos` da atividade é calculado exatamente a partir dos encontros (soma da duração de cada encontro e suas condições)?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-08 — Listagem, filtros e ordenação de atividades**: No `GET /atividades`, como funcionam os filtros `?dia=` e `?tipo=`, a combinação entre eles e qual é a regra de ordenação padrão das atividades retornadas?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-09 — Listagem de salas e agenda**: O endpoint `GET /salas` retorna todas as salas fixas dos dados iniciais. Existe endpoint específico para consultar a agenda ou os horários ocupados de uma sala?
- **Resposta**: Pelo `contrato-api.md`, não existe endpoint específico para consultar a agenda de uma sala. O M1 expõe `GET /salas` e os encontros por meio das atividades. Portanto, não deve ser criada uma rota adicional de agenda; quando necessário, os horários são obtidos ou derivados das atividades e de seus encontros.
- **Fonte**: `contrato-api.md`

---

❓ **P-10 — Dados fornecidos aos módulos dependentes**: Quais campos e estados calculados da atividade, encontros e salas definidos no `contrato-api.md` são obrigatoriamente consumidos pelos módulos dependentes?
- **Resposta**: PENDENTE (consultar requisitos)

---

### Bloco 3

❓ **P-11 — Autorização de acesso às rotas do M1**: Quais papéis de usuário são permitidos em cada rota do M1 (`GET /salas`, `GET /atividades`, `GET /atividades/:id`, `POST /atividades`, `PATCH /atividades/:id`, `POST /atividades/:id/cancelamento`)?
- **Resposta**: Exige cabeçalho `X-Usuario` (401 se ausente ou inválido). `GET /salas`, `GET /atividades`, `GET /atividades/:id` abertos a todos os usuários identificados. `POST /atividades`, `PATCH /atividades/:id`, `POST /atividades/:id/cancelamento` restritos ao perfil `organizacao` (403 `SOMENTE_ORGANIZACAO` caso contrário).
- **Fonte**: `contrato-api.md`

---

❓ **P-12 — Validações estruturais e ordem de verificação**: Como o sistema trata campos obrigatórios ausentes, tipos de dados errados, corpo não-JSON e sala inexistente (`salaId`), e qual é a ordem geral de validação segundo o contrato?
- **Resposta**: Corpo não-JSON, campo obrigatório ausente ou tipo errado → `422 DADOS_INVALIDOS`. Sala inexistente → `404 NAO_ENCONTRADO`. Ordem de verificação: identificação (401) → perfil (403) → existência (404) → corpo (422) → regras do recurso.
- **Fonte**: `contrato-api.md`

---

❓ **P-13 — Limites de vagas (mínimo, máximo e igualdade com capacidade)**: Qual é o número mínimo de vagas permitido para uma atividade? O número de vagas pode ser exatamente igual à capacidade da sala (`vagas === capacidade`) ou apenas estritamente menor?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-14 — Duração e período permitido para os encontros**: Existe duração mínima ou máxima em minutos para um encontro? Os encontros devem obrigatoriamente ocorrer dentro do período do evento (19/10/2026 a 23/10/2026)?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-15 — Encontros multi-dia e sobreposição interna**: Um encontro pode iniciar em um dia e terminar em outro (atravessando a meia-noite)? É permitido que dois encontros de uma mesma atividade tenham sobreposição de horários entre si?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-16 — Efeito de atividades canceladas no conflito de sala e listagem**: Atividades que estão com a situação `cancelada` continuam ocupando a sala para efeito de `CONFLITO_DE_SALA` ao criar novas atividades? Como atividades canceladas aparecem na listagem `GET /atividades` e nos filtros?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-17 — Comportamento de carga horária informada e redução de vagas**: O que acontece se o cliente enviar o campo `cargaHorariaMinutos` no `POST` ou `PATCH`? Ao reduzir vagas via `PATCH` abaixo do número de inscritos/ocupados, qual erro é retornado (`VAGAS_ABAIXO_DOS_INSCRITOS`)?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-18 — Aumento de vagas, cancelamento e integração com M2**: Ao aumentar as vagas de uma atividade, qual é o impacto na lista de espera (integração com M2)? E ao cancelar uma atividade, o que acontece com as inscrições e listas de espera existentes?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-19 — Situação cancelada e ordenação de encontros**: Como a situação `cancelada` interage com o relógio temporal (`prevista`, `em_andamento`, `encerrada`)? Como os encontros dentro do objeto Atividade devem ser ordenados?
- **Resposta (parcial)**: Os encontros dentro do objeto Atividade devem ser retornados estritamente em ordem de início. (**Fonte**: `contrato-api.md`).
- **Resposta (restante)**: PENDENTE (consultar requisitos quanto à interação da situação cancelada com os estados temporais).

---

❓ **P-20 — Campos calculados de ocupação e precedência de erros**: Como são calculados exatamente `ocupadas`, `vagasRestantes` e `emEspera`, e quem é responsável por cada um (M1 vs M2)? Quando múltiplos erros de regra de negócio ocorrem simultaneamente, qual é a precedência de erro retornada pela API?
- **Resposta**: PENDENTE (consultar requisitos)

---

❓ **P-21 — Fronteira de escopo, instantes de fronteira e cenários de verificação**: O que o M1 explicitamente **não** faz (fora de escopo)? Qual é o comportamento do sistema nos instantes exatos de transição de tempo (fronteiras de início/fim)? Quais cenários de teste externo provam o funcionamento de cada regra do M1?
- **Resposta**: PENDENTE (consultar requisitos)

---

### Bloco 4

❓ **P-22 — Identificadores, datas, erros e dados iniciais**: Qual o formato dos IDs gerados, formato de datas, envelope de erro da API e quais são os dados iniciais do evento, salas e usuários?
- **Resposta**: IDs com prefixo + 8 hexadecimais minúsculos (`atv_...`, `enc_...`, `ins_...`, `pre_...`). Datas em ISO 8601 com fuso. Erro no formato `{"erro": "CODIGO", "mensagem": "..."}`. Dados iniciais compostos por 10 usuários (2 da organização: `org-ana`, `org-bruno`; 8 participantes: `p-carla`, `p-diego`, `p-elisa`, `p-fabio`, `p-gabriela`, `p-heitor`, `p-isadora`, `p-joao`), 4 salas e evento de 19/10/2026 a 23/10/2026.
- **Fonte**: `contrato-api.md`

---

❓ **P-23 — Modo de teste, reset, relógio e porta**: Como funciona o `MODO_TESTE`, o relógio controlado, o reset e a porta da API? E se `MODO_TESTE` não estiver ativo?
- **Resposta**: Com `MODO_TESTE=1`, `POST /_teste/reset` reseta dados e relógio para `2026-10-13T09:00:00-03:00`, relógio fica parado exceto por `PUT /_teste/relogio`. Sem `MODO_TESTE`, rotas `/_teste/*` respondem 404. Escuta na porta `PORT` (padrão 3000).
- **Fonte**: `contrato-api.md` e `projeto.json`

---

❓ **P-24 — Telas mínimas e ações da interface do M1**: Quais são as telas mínimas esperadas para o M1 na interface web (programação, filtros, detalhe, formulário da organização) e quais ações (criar, editar, cancelar) devem estar disponíveis na interface para a organização e participantes?
- **Resposta**: A interface mínima do M1 deve possuir programação com navegação ou seleção por dia; filtro por tipo; identificação visual de atividade cancelada quando ela estiver na listagem; acesso ao detalhe da atividade; detalhe com os campos definidos no contrato, incluindo sala, encontros, horários, vagas, carga horária e situação; formulário da organização para criar atividade; controles da organização para editar os campos permitidos e cancelar quando aplicável. Participantes e organização podem consultar programação e detalhes. Somente a organização visualiza e utiliza ações de criar, editar e cancelar. A interface não decide se a operação é válida: envia para a API e apresenta o resultado.
- **Fonte**: Issue #1 e `contrato-api.md`

---

❓ **P-25 — Estados visuais e tratamento de erros na interface**: Como a interface deve apresentar os estados de carregamento, lista vazia, sucesso, erro e os códigos/mensagens de erro retornados pela API?
- **Resposta**: Durante requisições, apresentar indicador de carregamento e impedir envio duplicado da mesma ação. Quando a listagem estiver vazia, apresentar mensagem explícita. Após criação, edição ou cancelamento bem-sucedido, apresentar confirmação e atualizar os dados exibidos. Em caso de erro, apresentar mensagem compreensível usando o código e a mensagem devolvidos pela API, sem substituir a decisão da API por validação apenas visual. Formulários podem fazer validações básicas de preenchimento e formato para UX, mas a resposta da API continua sendo a autoridade.
- **Fonte**: Decisão técnica da equipe e Issue #1

---

❓ **P-26 — Identificação de usuário na interface (`X-Usuario`)**: Como a interface permite a seleção ou identificação do usuário atual para envio do cabeçalho `X-Usuario` em todas as requisições autenticadas?
- **Resposta**: A interface terá um seletor visível do usuário de demonstração, alimentado pelos usuários iniciais definidos no contrato-api.md. Nenhum usuário será escolhido silenciosamente na primeira utilização; o usuário deverá selecionar uma identidade. A seleção poderá ser mantida no localStorage para recarregamentos posteriores. Um cliente HTTP centralizado adicionará `X-Usuario` a todas as requisições do M1. Os componentes não montarão esse cabeçalho diretamente.
- **Fonte**: `contrato-api.md` e decisão técnica da equipe

---

❓ **P-27 — Testes automatizados da interface e API falsa**: Como devem ser estruturados os testes automatizados da interface utilizando uma API falsa ou mock conforme exigido pelas regras globais?
- **Resposta**: Os testes da interface usarão Vitest e Testing Library. O acesso à API ficará atrás de uma interface ou cliente centralizado que poderá ser substituído por uma implementação falsa nos testes. Os testes não iniciarão a API real nem farão requisições de rede. Serão cobertos, conforme aplicável: carregamento, sucesso, lista vazia, erro, filtros, detalhe, criação, edição, cancelamento, atualização da tela e diferenças de ações visíveis entre organização e participante.
- **Fonte**: `README.md`, `AGENTS.md` e decisão técnica da equipe

---

❓ **P-28 — Integração da tela de detalhes com o M2**: Na tela de detalhes da atividade do M1, qual é o ponto de integração visual ou funcional com o M2 (ex: botão de inscrição/cancelamento de inscrição), sem implementar as ações de inscrição no M1?
- **Resposta**: A página de detalhes pertence ao M1 e exibirá os dados da atividade. Ela terá uma região ou ponto de extensão identificado para que o M2 conecte posteriormente suas ações. O M1 poderá fornecer `atividadeId` e os dados públicos da atividade para esse ponto, mas não implementará botão, estado, chamada HTTP ou regra de inscrição, cancelamento de inscrição, espera ou convocação. Esses componentes e comportamentos pertencem ao M2.
- **Fonte**: Issues #1 e #2

---

❓ **P-29 — Critérios de demonstração do M1**: Quais são os critérios práticos de demonstração do funcionamento do M1 (tanto via API quanto via interface web)?
- **Resposta**: O M1 será demonstrado externamente, sem leitura do código. Pela API, a demonstração deve usar o modo de teste, reset e relógio controlado para executar os critérios de aceite da spec, incluindo consultas, criação, alteração, cancelamento, filtros, situações temporais e erros. Pela interface, deve demonstrar seleção de usuário, programação, filtros, detalhe, formulário da organização, edição, cancelamento e apresentação dos estados de carregamento, vazio, sucesso e erro. Cada regra da spec deve ter cenário automatizado correspondente e deve ser possível repetir a demonstração depois de `POST /_teste/reset`.
- **Fonte**: `contrato-api.md` e Issue #1

## Fechamento da Rodada 1

- Estado: entrevista concluída sem consulta ao documento oficial de requisitos.
- Total: 29 perguntas.
- Resolvidas nesta rodada: P-09, P-11, P-12, P-22, P-23, P-24, P-25, P-26, P-27, P-28 e P-29.
- Pendentes para a Rodada 2 oficial: P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-10, P-13, P-14, P-15, P-16, P-17, P-18, parte de P-19, P-20 e P-21.
- Nenhum documento externo de requisitos foi consultado nesta rodada.
- Nenhuma spec, teste ou implementação foi criada nesta rodada.
