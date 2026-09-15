## Rodada 1 — Entrevista sem consulta aos requisitos

### Bloco 1

❓ **P-01 — Regras de quantidade e formato de encontros**: Ao criar uma atividade (`POST /atividades`), quais são os limites de quantidade de encontros para palestras e minicursos, e quais validações o contrato (`QUANTIDADE_DE_ENCONTROS` e `ENCONTRO_INVALIDO`) exige?
- **Resposta**: Uma palestra precisa possuir exatamente um encontro. Um minicurso precisa possuir entre dois e cinco encontros, incluindo os limites. Uma quantidade incompatível com o tipo resulta em QUANTIDADE_DE_ENCONTROS. Os encontros também precisam respeitar as regras próprias de duração, período, permanência no mesmo dia e ausência de sobreposição interna; a violação dessas condições resulta em ENCONTRO_INVALIDO.
- **Fonte**: RN-102, RN-103, RN-104, RN-105 e RN-106.

---

❓ **P-02 — Limite de vagas versus capacidade da sala**: A verificação de capacidade (`VAGAS_ACIMA_DA_CAPACIDADE`) permite que o número de vagas seja exatamente igual à capacidade da sala ou exige que seja estritamente menor?
- **Resposta**: A quantidade de vagas pode ser exatamente igual à capacidade da sala. Ela não pode ultrapassar essa capacidade e também não pode ser menor que uma vaga.
- **Fonte**: RN-107.

---

❓ **P-03 — Detecção de conflito de sala**: Como o sistema determina o `CONFLITO_DE_SALA` entre encontros de diferentes atividades na mesma sala? Existe sobreposição exata de horários ou janela de tolerância?
- **Resposta**: Encontros realizados na mesma sala precisam ter pelo menos quinze minutos entre o término de um e o início do seguinte. Um início com intervalo inferior a quinze minutos gera CONFLITO_DE_SALA; com exatamente quinze minutos, é permitido. Encontros pertencentes a atividades canceladas não participam dessa verificação.
- **Fonte**: RN-108.

---

❓ **P-04 — Critérios de transição da situação temporal**: Quais são as regras exatas de relógio para uma atividade passar de `prevista` para `em_andamento` e de `em_andamento` para `encerrada` (considerando início e fim de seus encontros)?
- **Resposta**: Antes do início do primeiro encontro, a atividade fica prevista. No instante exato em que o primeiro encontro começa, passa para em_andamento e permanece assim inclusive nos intervalos entre seus encontros. No instante exato do término do último encontro, passa para encerrada. Esses estados são calculados pelo relógio, não informados pelo cliente.
- **Fonte**: RN-114 e regras gerais de tempo.

---

❓ **P-05 — Restrições de edição (PATCH)**: Quais campos são permitidos no `PATCH /atividades/:id` e em quais situações ocorre `CAMPO_NAO_EDITAVEL` ou `ATIVIDADE_CANCELADA`?
- **Resposta**: Depois da criação, somente título e vagas podem ser alterados. Tipo, sala e encontros não podem mudar e a tentativa gera CAMPO_NAO_EDITAVEL. Uma atividade cancelada não aceita nenhuma alteração e gera ATIVIDADE_CANCELADA. O início da atividade não é indicado como impedimento adicional para o PATCH; ATIVIDADE_JA_INICIADA está associado ao cancelamento.
- **Fonte**: RN-110 e RN-113.

---

### Bloco 2

❓ **P-06 — Regras de cancelamento de atividade**: Quais são as condições e restrições exatas para cancelar uma atividade (`POST /atividades/:id/cancelamento`), incluindo os códigos de erro `ATIVIDADE_JA_INICIADA` e `ATIVIDADE_CANCELADA`?
- **Resposta**: O cancelamento é permitido somente antes do início do primeiro encontro. No instante exato em que a atividade começa, a tentativa já deve retornar ATIVIDADE_JA_INICIADA. O cancelamento é definitivo: uma atividade cancelada não pode ser alterada nem cancelada novamente, retornando ATIVIDADE_CANCELADA nessas tentativas.
- **Fonte**: RN-112 e RN-113.

---

❓ **P-07 — Cálculo da carga horária**: Como o campo `cargaHorariaMinutos` da atividade é calculado exatamente a partir dos encontros (soma da duração de cada encontro e suas condições)?
- **Resposta**: A carga horária é calculada somando a duração de todos os encontros e expressando o total em minutos. Ela não é definida manualmente pela organização. Se o cliente enviar um valor para cargaHorariaMinutos, esse valor não substitui o cálculo do sistema e deve ser ignorado.
- **Fonte**: Não informada.

---

❓ **P-08 — Listagem, filtros e ordenação de atividades**: No `GET /atividades`, como funcionam os filtros `?dia=` e `?tipo=`, a combinação entre eles e qual é a regra de ordenação padrão das atividades retornadas?
- **Resposta**: A listagem é ordenada primeiro pelo início do primeiro encontro e, quando duas atividades possuem o mesmo início, pelo título. Atividades canceladas permanecem na listagem. O filtro dia seleciona atividades que tenham pelo menos um encontro naquele dia do calendário de Brasília. O filtro tipo seleciona palestra ou minicurso, e os dois filtros podem ser combinados.
- **Fonte**: RN-115 e RN-116.

---

❓ **P-09 — Listagem de salas e agenda**: O endpoint `GET /salas` retorna todas as salas fixas dos dados iniciais. Existe endpoint específico para consultar a agenda ou os horários ocupados de uma sala?
- **Resposta**: Pelo `contrato-api.md`, não existe endpoint específico para consultar a agenda de uma sala. O M1 expõe `GET /salas` e os encontros por meio das atividades. Portanto, não deve ser criada uma rota adicional de agenda; quando necessário, os horários são obtidos ou derivados das atividades e de seus encontros.
- **Fonte**: `contrato-api.md`

---

❓ **P-10 — Dados fornecidos aos módulos dependentes**: Quais campos e estados calculados da atividade, encontros e salas definidos no `contrato-api.md` são obrigatoriamente consumidos pelos módulos dependentes?
- **Resposta**: O M1 é a fonte oficial da identificação da atividade, tipo, sala, vagas, encontros, horários, duração, carga horária, situação e cancelamento. O M2 utiliza esses dados para inscrições e fornece ao M1 as contagens usadas em ocupadas, vagasRestantes e emEspera. O M3 utiliza principalmente atividade, encontros, horários, situação e cancelamento. O M4 consome a carga horária, os encontros, a situação e o cancelamento. O M5 consome atividades, vagas, encontros, situação, cancelamento e os dados de ocupação necessários ao painel. O M1 expõe os campos do objeto Atividade, mas não implementa as regras internas desses módulos.
- **Fonte**: contrato-api.md, Issue #1, RN-109, RN-111 e RN-114.

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
- **Resposta**: O mínimo é uma vaga. O máximo é a capacidade cadastrada para a sala. A igualdade entre vagas e capacidade é válida; somente um valor acima da capacidade deve gerar VAGAS_ACIMA_DA_CAPACIDADE.
- **Fonte**: RN-107.

---

❓ **P-14 — Duração e período permitido para os encontros**: Existe duração mínima ou máxima em minutos para um encontro? Os encontros devem obrigatoriamente ocorrer dentro do período do evento (19/10/2026 a 23/10/2026)?
- **Resposta**: Cada encontro deve durar no mínimo sessenta minutos e no máximo duzentos e quarenta minutos, incluindo os dois limites. Além disso, todos os encontros precisam estar dentro do período do evento, de 19 a 23 de outubro de 2026, considerando o calendário de Brasília.
- **Fonte**: RN-104 e RN-105.

---

❓ **P-15 — Encontros multi-dia e sobreposição interna**: Um encontro pode iniciar em um dia e terminar em outro (atravessando a meia-noite)? É permitido que dois encontros de uma mesma atividade tenham sobreposição de horários entre si?
- **Resposta**: Um encontro deve começar e terminar no mesmo dia do calendário de Brasília, portanto não pode atravessar a meia-noite. Também não pode existir sobreposição entre encontros pertencentes à mesma atividade. As duas violações resultam em ENCONTRO_INVALIDO.
- **Fonte**: RN-105 e RN-106.

---

❓ **P-16 — Efeito de atividades canceladas no conflito de sala e listagem**: Atividades que estão com a situação `cancelada` continuam ocupando a sala para efeito de `CONFLITO_DE_SALA` ao criar novas atividades? Como atividades canceladas aparecem na listagem `GET /atividades` e nos filtros?
- **Resposta**: Encontros de atividades canceladas deixam de ocupar a sala para a verificação de conflitos. Entretanto, as atividades canceladas continuam aparecendo em GET /atividades. Quando filtros de dia ou tipo forem usados, elas seguem os mesmos critérios de filtro aplicados às demais atividades.
- **Fonte**: RN-108, RN-115 e RN-116.

---

❓ **P-17 — Comportamento de carga horária informada e redução de vagas**: O que acontece se o cliente enviar o campo `cargaHorariaMinutos` no `POST` ou `PATCH`? Ao reduzir vagas via `PATCH` abaixo do número de inscritos/ocupados, qual erro é retornado (`VAGAS_ABAIXO_DOS_INSCRITOS`)?
- **Resposta**: cargaHorariaMinutos é sempre derivada dos encontros e um valor enviado pelo cliente não substitui o cálculo, devendo ser ignorado. Ao reduzir vagas, o novo total não pode ficar abaixo das inscrições que ocupam vaga, consideradas as confirmadas e convocadas. Se ficar abaixo, a API retorna VAGAS_ABAIXO_DOS_INSCRITOS.
- **Fonte**: RN-109 e RN-111.

---

❓ **P-18 — Aumento de vagas, cancelamento e integração com M2**: Ao aumentar as vagas de uma atividade, qual é o impacto na lista de espera (integração com M2)? E ao cancelar uma atividade, o que acontece com as inscrições e listas de espera existentes?
- **Resposta**: Quando o aumento de vagas cria lugares disponíveis, o M1 deve acionar a integração para que o M2 aplique suas regras de convocação da lista de espera. O M1 não decide nem implementa a fila. Quando uma atividade é cancelada, todas as inscrições ativas associadas a ela devem ser canceladas pelo M2, incluindo as confirmadas, em espera e convocadas. A alteração da atividade e as mudanças das inscrições precisam ocorrer por uma integração consistente entre os módulos.
- **Fonte**: RN-111, RN-211 e RN-217.

---

❓ **P-19 — Situação cancelada e ordenação de encontros**: Como a situação `cancelada` interage com o relógio temporal (`prevista`, `em_andamento`, `encerrada`)? Como os encontros dentro do objeto Atividade devem ser ordenados?
- **Resposta**: Os encontros dentro do objeto Atividade devem ser retornados estritamente em ordem de início. A situação cancelada tem prioridade sobre prevista, em_andamento e encerrada. Depois do cancelamento, a atividade permanece com situação cancelada independentemente do avanço do relógio.
- **Fonte**: RN-114 e contrato-api.md.

---

❓ **P-20 — Campos calculados de ocupação e precedência de erros**: Como são calculados exatamente `ocupadas`, `vagasRestantes` e `emEspera`, e quem é responsável por cada um (M1 vs M2)? Quando múltiplos erros de regra de negócio ocorrem simultaneamente, qual é a precedência de erro retornada pela API?
- **Resposta**: ocupadas corresponde à quantidade de inscrições confirmadas somada à quantidade de inscrições convocadas. emEspera corresponde à quantidade de inscrições com estado em_espera. vagasRestantes corresponde ao total de vagas menos ocupadas. O M2 é responsável pelos estados e contagens das inscrições; o M1 consulta esses valores pela integração e os expõe no objeto Atividade exigido pelo contrato. Quanto à precedência entre erros de recurso do M1, aplica-se a ordem geral do contrato (identificação, perfil, existência, corpo e regras do recurso), não havendo precedência adicional exigida entre regras de negócio simultâneas.
- **Fonte**: contrato-api.md e RN-111.

---

❓ **P-21 — Fronteira de escopo, instantes de fronteira e cenários de verificação**: O que o M1 explicitamente **não** faz (fora de escopo)? Qual é o comportamento do sistema nos instantes exatos de transição de tempo (fronteiras de início/fim)? Quais cenários de teste externo provam o funcionamento de cada regra do M1?
- **Resposta**: O M1 não inclui login e senha, mais de um evento, pagamento, e-mail ou push, certificado em PDF, alteração de encontros ou troca de sala depois da criação, inscrição feita pela organização, check-out ou importação de planilha. Também não implementa as regras internas de inscrições, presença, certificados ou painel. Nas fronteiras temporais, o instante inicial já conta como atividade iniciada e o instante final já conta como atividade encerrada. Um prazo descrito como “até X” aceita o próprio instante X; um prazo que “fecha em X” já está fechado nesse instante. Todas as regras temporais precisam ser demonstradas pelo relógio controlado. Os testes externos devem cobrir valores imediatamente abaixo, exatamente no limite e imediatamente acima dos limites aplicáveis. Para o M1, isso inclui quantidade de encontros; duração; período; travessia de dia; sobreposição; capacidade; intervalo de sala; cálculo de carga; campos editáveis; redução de vagas; cancelamento antes e no início; situação antes, no início e no fim; atividade cancelada; ordenação; filtro por dia e combinação com tipo. A verificação deve ocorrer pela API e pela interface, sem depender da leitura do código.
- **Fonte**: regras gerais de tempo, seções de restrições, fora de escopo e critérios de aceitação, além das RN-102 a RN-116.

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

---

## Fechamento da Rodada 2

- Estado: Rodada 2 concluída.
- Todas as pendências da Rodada 1 foram tratadas.
- As respostas oficiais foram registradas em paráfrase com suas fontes RN-xxx.
- Nenhuma pergunta nova foi criada nesta rodada.
- Nenhuma spec, teste ou implementação foi criada nesta rodada.
- A entrevista está pronta para revisão humana antes da geração da spec.
