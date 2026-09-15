# Spec — M1-grade

## 1. Objetivo
Gerenciar as salas, a criação, alteração, consulta, listagem, cancelamento e o ciclo de vida temporal de palestras e minicursos da Semana Acadêmica, servindo como a fonte oficial de dados de atividades e salas para os demais módulos. Inclui também a coordenação da estrutura técnica inicial do projeto (estrutura de diretórios, banco SQLite embutido, isolamento de testes, relógio controlado e configuração em `projeto.json`).

## 2. Fora de escopo
O módulo M1 **não** inclui e está estritamente proibido de implementar:
- Regras internas de inscrições e lista de espera (pertencentes ao M2).
- Regras de controle de presença por QR code, leitura offline ou chamada manual (pertencentes ao M3).
- Regras de emissão de certificados, extrato e verificação pública de certificados (pertencentes ao M4).
- Regras do painel da organização, contagens de sem chance, download de CSV de frequência ou gerenciamento de bloqueios de participantes (pertencentes ao M5).
- Funcionalidades de login e senha, autenticação por token ou cadastro de novos usuários.
- Suporte a mais de um evento simultâneo.
- Processamento de pagamentos, envio de e-mails ou notificações push.
- Alteração de encontros ou troca de sala de uma atividade após a sua criação.
- Realização de inscrições em nome da organização ou importação de planilhas.
- Rotas ou lógicas de check-out.

### Lacunas e decisões não especificadas
- **Precedência entre regras de recurso simultâneas**: Os documentos fornecidos e as entrevistas não definem qual código de erro do M1 deve prevalecer quando múltiplas regras de recurso (ex: conflito de sala, capacidade, formato de encontros) forem violadas simultaneamente na mesma requisição. Esta lacuna não bloqueia a especificação individual de cada regra, sendo cada regra verificada isoladamente em cenários onde os demais dados permanecem válidos.

## 3. Modelo
Entidades gerenciadas ou expostas pelo M1:
- **Sala**:
  - `id`: string (`auditorio`, `sala-101`, `sala-102`, `lab-3`)
  - `nome`: string (`Auditório Central`, `Sala 101`, `Sala 102`, `Laboratório 3`)
  - `capacidade`: número inteiro (`200`, `40`, `40`, `20`)
- **Atividade**:
  - `id`: string, prefixo `atv_` + 8 hexadecimais (gerado pelo sistema)
  - `titulo`: string (informado pelo cliente)
  - `tipo`: string, `"palestra"` ou `"minicurso"` (informado pelo cliente)
  - `salaId`: string (informado pelo cliente)
  - `vagas`: número inteiro (informado pelo cliente)
  - `encontros`: lista de objetos de Encontro (informado pelo cliente)
  - `cargaHorariaMinutos`: número inteiro (calculado pelo sistema a partir da soma da duração dos encontros; valor enviado pelo cliente é ignorado)
  - `situacao`: string, `"prevista"`, `"em_andamento"`, `"encerrada"` ou `"cancelada"` (calculado pelo sistema com base no relógio e no cancelamento)
  - `ocupadas`: número inteiro (calculado pelo M2 e consultado pelo M1 via integração; antes do M2, adaptador neutro retorna `0`)
  - `vagasRestantes`: número inteiro (calculado pelo M1: `vagas - ocupadas`)
  - `emEspera`: número inteiro (calculado pelo M2 e consultado pelo M1 via integração; antes do M2, adaptador neutro retorna `0`)
- **Encontro**:
  - `id`: string, prefixo `enc_` + 8 hexadecimais (gerado pelo sistema)
  - `inicio`: string ISO 8601 com fuso (informado pelo cliente)
  - `fim`: string ISO 8601 com fuso (informado pelo cliente)

## 4. Endpoints
Métodos, caminhos, papéis, corpos e códigos de sucesso conforme `contrato-api.md`:
- `GET /salas` (todos) → 200 `[Sala]`
- `GET /atividades` (todos) → 200 `[Atividade]` (filtros `?dia=AAAA-MM-DD` e `?tipo=palestra|minicurso`)
- `GET /atividades/:id` (todos) → 200 `Atividade`
- `POST /atividades` (organização) → 201 `Atividade` (corpo: `titulo`, `tipo`, `salaId`, `vagas`, `encontros`)
- `PATCH /atividades/:id` (organização) → 200 `Atividade` (corpo: qualquer subconjunto dos campos de entrada do POST, observando que somente `titulo` e `vagas` são editáveis; a presença de `tipo`, `salaId` ou `encontros` é recusada com `CAMPO_NAO_EDITAVEL`, e `cargaHorariaMinutos`, se enviado, é ignorado)
- `POST /atividades/:id/cancelamento` (organização) → 200 `Atividade`
- Rotas de teste (quando `MODO_TESTE=1`):
  - `POST /_teste/reset` → 204
  - `PUT /_teste/relogio` → 200 (corpo: `{"agora": "<ISO>"}`)
  - `GET /_teste/relogio` → 200 (`{"agora": "<ISO>"}`)

## 5. Regras
- **R1** (Quantidade de encontros de palestra): Uma palestra deve possuir exatamente 1 encontro. Quantidade incompatível gera 422 `QUANTIDADE_DE_ENCONTROS`. *(Origem: P-01; RN-102)*
- **R2** (Quantidade de encontros de minicurso): Um minicurso deve possuir entre 2 e 5 encontros inclusos. Quantidade incompatível gera 422 `QUANTIDADE_DE_ENCONTROS`. *(Origem: P-01; RN-103)*
- **R3** (Duração dos encontros): Cada encontro deve durar no mínimo 60 minutos e no máximo 240 minutos inclusos. Duração fora dos limites gera 422 `ENCONTRO_INVALIDO`. *(Origem: P-14; RN-104)*
- **R4** (Período inclusivo do evento): Todos os encontros devem ocorrer entre os dias 19/10/2026 e 23/10/2026, inclusive, considerando o calendário de Brasília. Encontros fora desse período geram 422 `ENCONTRO_INVALIDO`. *(Origem: P-14; RN-105)*
- **R5** (Proibição de atravessar a meia-noite): Cada encontro deve começar e terminar no mesmo dia do calendário de Brasília (permanência no mesmo dia, sem atravessar a meia-noite). Violações geram 422 `ENCONTRO_INVALIDO`. *(Origem: P-15; RN-105)*
- **R6** (Ausência de sobreposição interna): Não é permitida sobreposição de horários entre encontros pertencentes a uma mesma atividade. Violações geram 422 `ENCONTRO_INVALIDO`. *(Origem: P-15; RN-106)*
- **R7** (Limites de vagas): O número de vagas de uma atividade deve ser no mínimo 1 e no máximo igual à capacidade da sala cadastrada. Vagas acima da capacidade geram 422 `VAGAS_ACIMA_DA_CAPACIDADE`. A igualdade entre vagas e capacidade é válida. *(Origem: P-02, P-13; RN-107)*
- **R8** (Conflito de sala e intervalo): Encontros realizados na mesma sala precisam ter pelo menos 15 minutos entre o término de um encontro e o início do seguinte. Intervalo exato de 15 minutos é permitido; intervalo menor gera 409 `CONFLITO_DE_SALA`. Encontros de atividades canceladas não participam dessa verificação. *(Origem: P-03, P-16; RN-108)*
- **R9** (Cálculo da carga horária): O campo `cargaHorariaMinutos` é calculado exclusivamente pela soma da duração de todos os encontros em minutos. *(Origem: P-07; RN-109)*
- **R10** (Ignorar carga horária enviada pelo cliente): Caso o cliente envie `cargaHorariaMinutos` na criação ou alteração, o valor enviado é ignorado e substituído pelo cálculo do sistema. *(Origem: P-07, P-17; RN-109)*
- **R11** (Campos editáveis no PATCH): Após a criação, somente `titulo` e `vagas` podem ser alterados via `PATCH /atividades/:id`. Tentativas de alterar `tipo`, `salaId` ou `encontros` geram 422 `CAMPO_NAO_EDITAVEL`. *(Origem: P-05; RN-110)*
- **R12** (Redução de vagas): Ao reduzir vagas via `PATCH`, o novo total não pode ficar abaixo da quantidade de inscrições que ocupam vaga (confirmadas + convocadas). Caso fique abaixo, retorna 409 `VAGAS_ABAIXO_DOS_INSCRITOS`. *(Origem: P-17; RN-111)*
- **R13** (Cancelamento antes do início): O cancelamento (`POST /atividades/:id/cancelamento`) é permitido somente antes do início do primeiro encontro. No instante exato em que a atividade começa, a tentativa retorna 422 `ATIVIDADE_JA_INICIADA`. *(Origem: P-06; RN-112)*
- **R14** (Cancelamento definitivo): O cancelamento é definitivo: uma atividade cancelada não pode ser alterada nem cancelada novamente, retornando 422 `ATIVIDADE_CANCELADA` nessas tentativas. *(Origem: P-05, P-06; RN-113)*
- **R15** (Transições temporais): A situação da atividade é calculada pelo relógio do sistema: antes do início do primeiro encontro é `prevista`; no instante exato do início do primeiro encontro passa para `em_andamento` (permanecendo assim inclusive nos intervalos); no instante exato do término do último encontro passa para `encerrada`. *(Origem: P-04; RN-114)*
- **R16** (Prevalência de cancelada): A situação `cancelada` tem prioridade sobre prevista, em_andamento e encerrada. Após o cancelamento, a atividade permanece com situação cancelada independentemente do avanço do relógio. *(Origem: P-19; RN-114)*
- **R17** (Ordenação da listagem): A listagem `GET /atividades` é ordenada primeiro pelo início do primeiro encontro e, em caso de empate, pelo título. *(Origem: P-08; RN-115)*
- **R18** (Presença de canceladas na listagem): Atividades canceladas continuam aparecendo na listagem `GET /atividades`. *(Origem: P-16; RN-115)*
- **R19** (Filtro por dia): O filtro `?dia=AAAA-MM-DD` seleciona atividades que tenham pelo menos um encontro naquele dia do calendário de Brasília. *(Origem: P-08; RN-116)*
- **R20** (Filtro por tipo e combinação): O filtro `?tipo=palestra|minicurso` seleciona pelo tipo, e os filtros de dia e tipo podem ser combinados. Atividades canceladas seguem os mesmos critérios de filtro. *(Origem: P-08, P-16; RN-116)*
- **R21** (Ordenação dos encontros): Os encontros dentro do objeto Atividade são retornados estritamente ordenados por horário de início. *(Origem: P-19; `contrato-api.md`)*
- **R22** (Consulta de salas): O endpoint `GET /salas` retorna todas as salas fixas dos dados iniciais (`auditorio`, `sala-101`, `sala-102`, `lab-3`). Não existe rota específica de agenda de sala; horários são derivados das atividades e encontros. *(Origem: P-09; `contrato-api.md`)*
- **R23** (Campos de ocupação): O M2 é a fonte das contagens de inscrições (`ocupadas` = confirmadas + convocadas; `emEspera` = quantidade em espera). O M1 calcula `vagasRestantes = vagas - ocupadas` ao montar a representação pública da atividade, obtendo as contagens por uma porta de integração (com adaptador neutro retornando `0` antes do M2), sem implementar as regras internas do M2. *(Origem: P-10, P-20; `contrato-api.md`, RN-111)*
- **R24** (Autenticação por X-Usuario): Todas as rotas (exceto `/_teste/*`) exigem o cabeçalho `X-Usuario` válido; ausência ou id desconhecido retorna 401 `USUARIO_DESCONHECIDO`. *(Origem: P-11, P-22; `contrato-api.md`)*
- **R25** (Autorização das operações): `GET /salas`, `GET /atividades`, `GET /atividades/:id` são abertas a todos os usuários identificados. `POST /atividades`, `PATCH /atividades/:id`, `POST /atividades/:id/cancelamento` são restritas ao papel `organizacao`, retornando 403 `SOMENTE_ORGANIZACAO` para participantes. *(Origem: P-11; `contrato-api.md`)*
- **R26** (Validações estruturais e ordem geral): Corpo não-JSON, campo obrigatório ausente ou tipo incorreto gera 422 `DADOS_INVALIDOS`. Sala inexistente (`salaId`) gera 404 `NAO_ENCONTRADO`. Ordem de verificação: identificação (401) → perfil (403) → existência (404) → corpo (422) → regras do recurso. *(Origem: P-12; `contrato-api.md`)*
- **R27** (Integração por aumento de vagas): Ao aumentar as vagas gerando vagas disponíveis, o M1 aciona o M2 (via porta de integração) para convocar a lista de espera. *(Origem: P-18; RN-111, RN-211)*
- **R28** (Integração por cancelamento): Ao cancelar uma atividade, o M1 aciona o M2 (via porta de integração) para cancelar todas as inscrições ativas associadas (confirmadas, em espera e convocadas). *(Origem: P-18; RN-217)*
- **R29** (Identificadores): Identificadores gerados com prefixo + 8 hexadecimais minúsculos (`atv_...`, `enc_...`). *(Origem: P-22; `contrato-api.md`)*
- **R30** (Datas): Datas tratadas em formato ISO 8601 com fuso, comparando instantes sem depender do fuso da máquina (a API pode responder em fuso diferente, desde que o instante permanece equivalente). *(Origem: P-22; `contrato-api.md`)*
- **R31** (Envelope de erro): Erros da API seguem o envelope estruturado `{"erro": "CODIGO", "mensagem": "texto livre"}`, onde `mensagem` é uma string de texto livre. *(Origem: P-22; `contrato-api.md`)*
- **R32** (Dados iniciais e reset): Dados iniciais compostos por 4 salas (`auditorio`, `sala-101`, `sala-102`, `lab-3`), evento de 19/10/2026 a 23/10/2026 e exatamente os 10 usuários (`org-ana` - Ana Beatriz Lima - `organizacao`, `org-bruno` - Bruno Tavares - `organizacao`, `p-carla` - Carla Mendes Souza - `participante`, `p-diego` - Diego Alves - `participante`, `p-elisa` - Elisa Fernandes da Rocha - `participante`, `p-fabio` - Fábio Nogueira - `participante`, `p-gabriela` - Gabriela Moura Castro - `participante`, `p-heitor` - Heitor Campos - `participante`, `p-isadora` - Isadora Ribeiro dos Santos - `participante`, `p-joao` - João Pedro Martins - `participante`). `POST /_teste/reset` apaga tudo, recarrega os dados iniciais e redefine o relógio para `2026-10-13T09:00:00-03:00`. *(Origem: P-22, P-23; `contrato-api.md`)*
- **R33** (Relógio controlado e desativação das rotas de teste): Com `MODO_TESTE=1`, o relógio fica parado exceto por `PUT /_teste/relogio` (consultável via `GET /_teste/relogio`). Sem `MODO_TESTE`, as rotas `/_teste/*` respondem 404 e o relógio é o real. *(Origem: P-23; `contrato-api.md`, `projeto.json`)*
- **R34** (Porta e execução padronizada): A API escuta na porta definida pela variável de ambiente `PORT` (padrão 3000), executando com comandos compatíveis com Linux sem depender de serviços externos. *(Origem: P-23; `contrato-api.md`, `projeto.json`)*
- **R35** (Estrutura técnica inicial): Organização da estrutura de diretórios, arquivo `AGENTS.md` na raiz, `api/AGENTS.md`, `app/AGENTS.md`, uso de banco SQLite embutido, inicialização reproduzível e isolamento dos testes. *(Origem: Issue #1, decisões técnicas)*
- **R36** (Requisitos de telas da interface): A interface web deve fornecer programação com navegação por dia, filtro por tipo, indicação visual de atividade cancelada, página de detalhes com todos os campos do contrato, formulário de criação da organização, controles de edição (título e vagas) e cancelamento, e presença/ausência de controles conforme o papel. *(Origem: P-24; Issue #1, `contrato-api.md`)*
- **R37** (Estados visuais e erros): A interface deve apresentar indicador de carregamento durante requisições, bloqueio de envio duplicado, mensagem explícita para lista vazia, confirmação de sucesso com atualização de dados, e mensagens compreensíveis usando o código e a mensagem devolvidos pela API. *(Origem: P-25; Issue #1, decisão técnica)*
- **R38** (Seletor de usuário): A interface deve ter um seletor visível de usuário de demonstração alimentado pelos 10 usuários iniciais, exigindo seleção explícita (sem escolha silenciosa) e mantendo a seleção no localStorage, injetando o cabeçalho `X-Usuario` via cliente HTTP centralizado. *(Origem: P-26; `contrato-api.md`, decisão técnica)*
- **R39** (Ponto de extensão do M2): A página de detalhes do M1 deve possuir um ponto estrutural invisível de extensão para o M2. Antes da integração, este ponto não deve produzir botões, estado ou área vazia visível ao usuário. *(Origem: P-28; Issues #1 e #2)*
- **R40** (Testes da interface com API falsa): Os testes da interface devem usar Vitest e Testing Library, substituindo o cliente da API por implementação falsa, sem iniciar API real nem realizar requisições de rede, cobrindo carregamento, vazio, sucesso, erro, filtros, detalhe, criação, edição, cancelamento e diferenças de papéis. *(Origem: P-27; `README.md`, `AGENTS.md`, decisão técnica)*
- **R41** (Configuração do projeto.json): O arquivo `projeto.json` deve conter as propriedades obrigatórias: `stack` (texto), o objeto `api` com `pasta`, `instalar` e `iniciar`, e o array `testes` contendo os comandos reais das suítes de teste. Não é necessário criar um objeto `app` no `projeto.json`. *(Origem: `contrato-api.md`, `projeto.json`, P-23, Issue #1)*

## 6. Critérios de aceite
1. (R1) Dado um pedido POST para `/atividades` com tipo `"palestra"` contendo 2 encontros, a API responde com status 422 e corpo `{"erro": "QUANTIDADE_DE_ENCONTROS", "mensagem": "..."}`.
2. (R1) Dado um pedido POST para `/atividades` com tipo `"palestra"` contendo exatamente 1 encontro válido, a API responde com status 201 e o objeto `Atividade` criado.
3. (R2) Dado um pedido POST para `/atividades` com tipo `"minicurso"` contendo 1 encontro, a API responde com status 422 e corpo `{"erro": "QUANTIDADE_DE_ENCONTROS", "mensagem": "..."}`.
4. (R2) Dado um pedido POST para `/atividades` com tipo `"minicurso"` contendo exatamente 2 encontros válidos, a API responde com status 201 e o objeto `Atividade` criado.
5. (R2) Dado um pedido POST para `/atividades` com tipo `"minicurso"` contendo exatamente 5 encontros válidos, a API responde com status 201 e o objeto `Atividade` criado.
6. (R2) Dado um pedido POST para `/atividades` com tipo `"minicurso"` contendo 6 encontros, a API responde com status 422 e corpo `{"erro": "QUANTIDADE_DE_ENCONTROS", "mensagem": "..."}`.
7. (R3) Dado um pedido POST para `/atividades` com um encontro de duração igual a 59 minutos (abaixo do limite), a API responde com status 422 e corpo `{"erro": "ENCONTRO_INVALIDO", "mensagem": "..."}`.
8. (R3) Dado um pedido POST para `/atividades` com um encontro de duração igual a exatamente 60 minutos (limite mínimo), a API responde com status 201.
9. (R3) Dado um pedido POST para `/atividades` com um encontro de duração igual a exatamente 240 minutos (limite máximo), a API responde com status 201.
10. (R3) Dado um pedido POST para `/atividades` com um encontro de duração igual a 241 minutos (acima do limite), a API responde com status 422 e corpo `{"erro": "ENCONTRO_INVALIDO", "mensagem": "..."}`.
11. (R4) Dado um pedido POST para `/atividades` com encontro iniciando em 18/10/2026 (antes do período do evento), a API responde com status 422 e corpo `{"erro": "ENCONTRO_INVALIDO", "mensagem": "..."}`.
12. (R4) Dado um pedido POST para `/atividades` com encontro ocorrendo no dia 19/10/2026 (primeiro dia do evento), a API responde com status 201.
13. (R4) Dado um pedido POST para `/atividades` com encontro ocorrendo no dia 23/10/2026 (último dia do evento), a API responde com status 201.
14. (R4) Dado um pedido POST para `/atividades` com encontro iniciando em 24/10/2026 (após o período do evento), a API responde com status 422 e corpo `{"erro": "ENCONTRO_INVALIDO", "mensagem": "..."}`.
15. (R5) Dado um pedido POST para `/atividades` com encontro atravessando a meia-noite (início 23:00 e término 01:00 do dia seguinte, mesmo dentro das datas do evento), a API responde com status 422 e corpo `{"erro": "ENCONTRO_INVALIDO", "mensagem": "..."}`.
16. (R6) Dado um pedido POST para `/atividades` de minicurso cujos dois encontros possuem sobreposição de horários, a API responde com status 422 e corpo `{"erro": "ENCONTRO_INVALIDO", "mensagem": "..."}`.
17. (R6) Dado um pedido POST para `/atividades` de minicurso onde o segundo encontro começa exatamente no instante em que o primeiro termina, a API responde com status 201.
18. (R7) Dado um pedido POST para `/atividades` com 0 vagas, a API responde com status 422 e corpo `{"erro": "VAGAS_ACIMA_DA_CAPACIDADE", "mensagem": "..."}`.
19. (R7) Dado um pedido POST para `/atividades` com 1 vaga, a API responde com status 201.
20. (R7) Dado um pedido POST para `/atividades` com vagas exatamente iguais à capacidade da sala (40 vagas na Sala 101), a API responde com status 201.
21. (R7) Dado um pedido POST para `/atividades` com vagas acima da capacidade da sala (45 vagas na Sala 101, cap 40), a API responde com status 422 e corpo `{"erro": "VAGAS_ACIMA_DA_CAPACIDADE", "mensagem": "..."}`.
22. (R7) Dado um pedido PATCH para `/atividades/:id` definindo vagas acima da capacidade da sala, a API responde com status 422 e corpo `{"erro": "VAGAS_ACIMA_DA_CAPACIDADE", "mensagem": "..."}`.
23. (R8) Dado um pedido POST para `/atividades` criando um encontro com intervalo de 14 minutos do término de outro encontro existente na mesma sala, a API responde com status 409 e corpo `{"erro": "CONFLITO_DE_SALA", "mensagem": "..."}`.
24. (R8) Dado um pedido POST para `/atividades` criando um encontro com intervalo de exatamente 15 minutos do término de outro encontro existente na mesma sala, a API responde com status 201.
25. (R8) Dado um pedido POST para `/atividades` criando um encontro no mesmo horário em salas diferentes, a API responde com status 201.
26. (R8) Dado um pedido POST para `/atividades` criando um encontro no mesmo horário de outro encontro em sala cuja atividade anterior está com situação `cancelada`, a API responde com status 201 (conflito ignorado).
27. (R8) Dado um pedido POST para `/atividades` criando um encontro cujos horários ocorrem antes de um encontro já existente na mesma sala com intervalo inferior a 15 minutos, a API responde com status 409 e corpo `{"erro": "CONFLITO_DE_SALA", "mensagem": "..."}`.
28. (R9) Dado um pedido POST para `/atividades`, a API calcula o campo `cargaHorariaMinutos` como a soma exata da duração em minutos de todos os encontros da atividade.
29. (R10) Dado um pedido POST para `/atividades` enviando explicitamente `cargaHorariaMinutos: 999` no corpo, a API responde com status 201 ignorando o valor enviado e retornando o `cargaHorariaMinutos` calculado a partir dos encontros.
30. (R10) Dado um pedido PATCH para `/atividades/:id` enviando explicitamente `cargaHorariaMinutos: 999` no corpo, a API responde com status 200 ignorando o valor enviado e mantendo o `cargaHorariaMinutos` calculado a partir dos encontros.
31. (R11) Dado um pedido PATCH para `/atividades/:id` alterando somente o `titulo`, a API responde com status 200 e a atividade atualizada.
32. (R11) Dado um pedido PATCH para `/atividades/:id` alterando somente as `vagas`, a API responde com status 200 e a atividade atualizada.
33. (R11) Dado um pedido PATCH para `/atividades/:id` enviando o campo `tipo`, a API responde com status 422 e corpo `{"erro": "CAMPO_NAO_EDITAVEL", "mensagem": "..."}`.
34. (R11) Dado um pedido PATCH para `/atividades/:id` enviando o campo `salaId`, a API responde com status 422 e corpo `{"erro": "CAMPO_NAO_EDITAVEL", "mensagem": "..."}`.
35. (R11) Dado um pedido PATCH para `/atividades/:id` enviando o campo `encontros`, a API responde com status 422 e corpo `{"erro": "CAMPO_NAO_EDITAVEL", "mensagem": "..."}`.
36. (R11) Dado um pedido PATCH para `/atividades/:id` em uma atividade cujo primeiro encontro já começou mas que não está cancelada, enviando apenas um campo editável (como `titulo`), a API responde com status 200 (o início não bloqueia o PATCH).
37. (R12) Dado um pedido PATCH para `/atividades/:id` reduzindo o número de vagas exatamente até o total de ocupadas (confirmadas + convocadas), a API responde com status 200.
38. (R12) Dado um pedido PATCH para `/atividades/:id` reduzindo o número de vagas abaixo do total de ocupadas (confirmadas + convocadas), a API responde com status 409 e corpo `{"erro": "VAGAS_ABAIXO_DOS_INSCRITOS", "mensagem": "..."}`.
39. (R13) Dado um pedido POST para `/atividades/:id/cancelamento` realizado antes do início do primeiro encontro, a API responde com status 200 e a atividade com `situacao: "cancelada"`.
40. (R13) Dado um pedido POST para `/atividades/:id/cancelamento` realizado no instante exato do início do primeiro encontro, a API responde com status 422 e corpo `{"erro": "ATIVIDADE_JA_INICIADA", "mensagem": "..."}`.
41. (R14) Dado um pedido PATCH para `/atividades/:id` em uma atividade que já está com situação `cancelada`, a API responde com status 422 e corpo `{"erro": "ATIVIDADE_CANCELADA", "mensagem": "..."}`.
42. (R14) Dado um pedido POST para `/atividades/:id/cancelamento` em uma atividade que já está com situação `cancelada`, a API responde com status 422 e corpo `{"erro": "ATIVIDADE_CANCELADA", "mensagem": "..."}`.
43. (R15) Com o relógio controlado antes do início do primeiro encontro, `GET /atividades/:id` retorna `situacao: "prevista"`.
44. (R15) Com o relógio controlado no instante exato do início do primeiro encontro, `GET /atividades/:id` retorna `situacao: "em_andamento"`.
45. (R15) Com o relógio controlado no intervalo entre encontros de um minicurso, `GET /atividades/:id` retorna `situacao: "em_andamento"`.
46. (R15) Com o relógio controlado no instante imediatamente anterior ao término do último encontro, `GET /atividades/:id` retorna `situacao: "em_andamento"`.
47. (R15) Com o relógio controlado no instante exato do término do último encontro, `GET /atividades/:id` retorna `situacao: "encerrada"`.
48. (R16) Com o relógio avançado após o término de uma atividade cancelada, `GET /atividades/:id` mantém a `situacao: "cancelada"`.
49. (R17) Dado um pedido GET para `/atividades`, a API retorna a lista ordenada pelo horário de início do primeiro encontro e, em caso de empate, pelo título.
50. (R18) Dado um pedido GET para `/atividades`, a API inclui na listagem as atividades com situação `cancelada`.
51. (R19) Dado um pedido GET para `/atividades?dia=2026-10-19`, a API retorna apenas as atividades que possuem pelo menos um encontro no dia 19/10/2026 (calendário de Brasília).
52. (R19) Dado um pedido GET para `/atividades` com atividade ocorrendo das 21:00 às 22:30 no fuso `-03:00`, a API a localiza corretamente pelo dia de Brasília, mesmo que em UTC já seja o dia seguinte.
53. (R20) Dado um pedido GET para `/atividades?tipo=minicurso`, a API retorna apenas minicursos.
54. (R20) Dado um pedido GET para `/atividades?dia=2026-10-19&tipo=minicurso`, a API retorna apenas minicursos do dia 19/10/2026.
55. (R20) Dado um pedido GET para `/atividades?dia=2026-10-19&tipo=minicurso` com uma atividade cancelada que atende aos filtros, a API a inclui na resposta.
56. (R21) Dado um pedido GET para `/atividades/:id`, a API retorna os encontros dentro do objeto Atividade ordenados estritamente pelo horário de início.
57. (R22) Dado um pedido GET para `/salas`, a API responde com status 200 e exatamente as 4 salas fixas: `auditorio` ("Auditório Central", cap 200), `sala-101` ("Sala 101", cap 40), `sala-102` ("Sala 102", cap 40) e `lab-3` ("Laboratório 3", cap 20).
58. (R23) Antes da integração com o M2, utilizando o adaptador neutro, POST, GET da listagem e GET do detalhe retornam a representação pública completa da atividade com `ocupadas: 0`, `emEspera: 0` e `vagasRestantes` igual a `vagas`.
59. (R23) Com uma porta falsa de integração retornando valores conhecidos (ex: ocupadas: 10, emEspera: 3), o detalhe e a listagem apresentam `ocupadas: 10`, `emEspera: 3` e `vagasRestantes` calculada corretamente, sem criar tabelas ou regras internas do M2.
60. (R24) Dado um pedido GET para `/salas`, `GET /atividades`, `GET /atividades/:id`, `POST /atividades`, `PATCH /atividades/:id` ou `POST /atividades/:id/cancelamento` sem o cabeçalho `X-Usuario` ou com ID desconhecido, a API responde em cada uma dessas 6 rotas com status 401 e corpo `{"erro": "USUARIO_DESCONHECIDO", "mensagem": "..."}`.
61. (R24, R33) Com `MODO_TESTE=1`: a) `POST /_teste/reset` não exige `X-Usuario` e retorna status 204; b) `PUT /_teste/relogio` não exige `X-Usuario` e retorna status 200; c) `GET /_teste/relogio` não exige `X-Usuario` e retorna status 200.
62. (R25) Dado um pedido GET para `/salas`, `GET /atividades` ou `GET /atividades/:id` autenticado como participante (`p-carla`) ou organização (`org-ana`), a API responde com status 200.
63. (R25) Dado um pedido POST para `/atividades` autenticado como participante (`p-carla`), a API responde com status 403 e corpo `{"erro": "SOMENTE_ORGANIZACAO", "mensagem": "..."}`.
64. (R25) Dado um pedido PATCH para `/atividades/:id` autenticado como participante (`p-carla`), a API responde com status 403 e corpo `{"erro": "SOMENTE_ORGANIZACAO", "mensagem": "..."}`.
65. (R25) Dado um pedido POST para `/atividades/:id/cancelamento` autenticado como participante (`p-carla`), a API responde com status 403 e corpo `{"erro": "SOMENTE_ORGANIZACAO", "mensagem": "..."}`.
66. (R25) Dado um pedido POST para `/atividades` autenticado como organização (`org-ana`) com dados válidos, a API responde com status 201.
67. (R25) Dado um pedido PATCH para `/atividades/:id` autenticado como organização (`org-ana`) com dados válidos, a API responde com status 200.
68. (R25) Dado um pedido POST para `/atividades/:id/cancelamento` autenticado como organização (`org-ana`) com dados válidos, a API responde com status 200.
69. (R26) Dado um pedido POST para `/atividades` com corpo que não é JSON, a API responde com status 422 e corpo `{"erro": "DADOS_INVALIDOS", "mensagem": "..."}`.
70. (R26) Dado um pedido POST para `/atividades` com `salaId: "sala-inexistente"`, a API responde com status 404 e corpo `{"erro": "NAO_ENCONTRADO", "mensagem": "..."}`.
71. (R26) Dado um pedido GET para `/atividades/atv_inexistente`, a API responde com status 404 e corpo `{"erro": "NAO_ENCONTRADO", "mensagem": "..."}`.
72. (R26) Dado um pedido PATCH para `/atividades/atv_inexistente`, a API responde com status 404 e corpo `{"erro": "NAO_ENCONTRADO", "mensagem": "..."}`.
73. (R26) Dado um pedido POST para `/atividades/atv_inexistente/cancelamento`, a API responde com status 404 e corpo `{"erro": "NAO_ENCONTRADO", "mensagem": "..."}`.
74. (R26) Dado um pedido de mutação sem cabeçalho `X-Usuario` (mesmo contendo outros erros estruturais), a API aplica a ordem do contrato e responde com status 401 `USUARIO_DESCONHECIDO`.
75. (R26) Dado um pedido de mutação por um participante (mesmo contendo outros erros), a API responde com status 403 `SOMENTE_ORGANIZACAO`.
76. (R26) Dado um pedido da organização para recurso inexistente com corpo inválido, a API responde com status 404 `NAO_ENCONTRADO`.
77. (R26) Dado um pedido da organização para recurso existente com corpo estruturalmente inválido, a API responde com status 422 `DADOS_INVALIDOS`.
78. (R27) Dado um aumento de vagas em atividade que libera vagas disponíveis, a API aciona uma porta falsa de integração notificando o M2 para convocar a lista de espera.
79. (R28) Dado o cancelamento de uma atividade, a API aciona uma porta falsa de integração notificando o M2 para cancelar todas as inscrições ativas associadas.
80. (R29) A API retorna identificadores com prefixo e 8 hexadecimais minúsculos (`atv_...`, `enc_...`).
81. (R30) A API aceita datas em formato ISO 8601 com fuso e compara instantes corretamente, aceitando que a resposta utilize fuso diferente desde que o instante representado permaneça equivalente.
82. (R31) As respostas de erro da API seguem o envelope `{"erro": "CODIGO", "mensagem": "texto livre"}`, onde `mensagem` é uma string de texto livre e os testes verificam apenas status, código de `erro` e presença/tipo de `mensagem` sem exigir frase exata.
83. (R32) Com `MODO_TESTE=1`, `POST /_teste/reset` apaga o estado e recarrega as 4 salas e exatamente os 10 usuários iniciais (`org-ana` - Ana Beatriz Lima - `organizacao`, `org-bruno` - Bruno Tavares - `organizacao`, `p-carla` - Carla Mendes Souza - `participante`, `p-diego` - Diego Alves - `participante`, `p-elisa` - Elisa Fernandes da Rocha - `participante`, `p-fabio` - Fábio Nogueira - `participante`, `p-gabriela` - Gabriela Moura Castro - `participante`, `p-heitor` - Heitor Campos - `participante`, `p-isadora` - Isadora Ribeiro dos Santos - `participante`, `p-joao` - João Pedro Martins - `participante`), redefinindo o relógio para `2026-10-13T09:00:00-03:00` e respondendo status 204.
84. (R33) Com `MODO_TESTE=1`, `PUT /_teste/relogio` atualiza o relógio controlado, `GET /_teste/relogio` retorna o instante atual, e sem `MODO_TESTE` as rotas `/_teste/*` respondem status 404.
85. (R34) A API escuta na porta especificada por `PORT` (padrão 3000) e executa em ambiente Linux sem serviços externos.
86. (R35) O repositório contém a estrutura técnica inicial com diretórios, arquivos `AGENTS.md` (raiz, api, app), SQLite embutido e isolamento de testes.
87. (R36) Critério da interface: A tela de programação exibe navegação por dia, filtro por tipo, indicação visual de atividade cancelada, formulário de criação da organização e controles de edição/cancelamento.
88. (R36) Critério da interface: A página de detalhes exibe exatamente `titulo`, `tipo`, sala, encontros ordenados, início, fim, vagas, carga horária, situação, `ocupadas`, `vagasRestantes` e `emEspera`.
89. (R37) Critério da interface: A interface apresenta os seguintes estados e comportamentos visuais e de erro: a) indicador de carregamento durante requisições; b) bloqueio de envio duplicado da mesma ação; c) mensagem explícita para lista vazia; d) confirmação de sucesso seguida de atualização dos dados exibidos; e) mensagens compreensíveis de erro exibindo o código e a mensagem devolvidos pela API.
90. (R38) Critério da interface: O seletor de usuário de demonstração cumpre os seguintes requisitos: a) primeira utilização sem escolha automática (exigindo seleção explícita); b) seleção de um dos dez usuários iniciais; c) persistência da seleção no localStorage após recarregar; d) cliente HTTP centralizado adicionando o cabeçalho X-Usuario; e) componentes não montando o cabeçalho diretamente.
91. (R39) Critério da interface: A página de detalhes exibe o ponto de extensão estrutural do M2 de forma invisível, sem produzir botões, estado ou área vazia visível ao usuário.
92. (R36, R38) Critério da interface: Participante visualiza programação e detalhes sem acesso a botões administrativos, enquanto a organização visualiza e utiliza os controles de criação, edição e cancelamento.
93. (R40) Critério da interface: Os testes da interface usam Vitest e Testing Library com cliente de API falso, sem iniciar API real nem requisições de rede, cobrindo carregamento, vazio, sucesso, erro, filtros, detalhe, criação, edição, cancelamento e papéis.
94. (R41) O arquivo `projeto.json` contém as propriedades obrigatórias (`stack`, `api` com `pasta`, `instalar`, `iniciar`, e o array `testes` com os comandos reais), sem exigir a criação de um objeto `app`.

## 7. Como será verificado
A verificação será realizada externamente (sem leitura de código):
- Pela API: utilizando testes automatizados (Supertest/Vitest) com `MODO_TESTE=1`, `POST /_teste/reset` e `PUT /_teste/relogio` para exercitar todas as rotas, códigos de sucesso, códigos de erro, restrições de perfil, portas de integração falsas e bordas temporais.
- Pela interface web: utilizando testes automatizados (Vitest + Testing Library com mock API) e validação manual cobrindo a seleção de usuários (`X-Usuario`), navegação na programação, aplicação de filtros, visualização de detalhes, formulários de criação/edição/cancelamento da organização, bem como a apresentação correta dos estados de carregamento, lista vazia, erros da API e o ponto de extensão invisível do M2.

## 8. Fatias de entrega
1. **Fatia 1 — fundação técnica**
   - Criação da aplicação, `projeto.json`, estrutura de diretórios, arquivos `AGENTS.md`, banco SQLite, migrations, seeds (R32), relógio controlado (R33), modo de teste (R32, R33), autenticação `X-Usuario` (R24), `GET /salas` (R22), `GET /atividades` inicialmente vazio, e adaptadores/portas neutros de integração.
2. **Fatia 2 — criação**
   - `POST /atividades` (R25, R26), validações estruturais (R26), limites de vagas e capacidade (R7), regras de encontros (quantidade R1, R2; duração R3; período R4; permanência no mesmo dia R5; sobreposição R6), conflito de sala com tolerância de 15 min (R8), cálculo de carga horária (R9, R10), ordenação dos encontros (R21), gerando resposta pública com ocupação zero pelo adaptador neutro.
3. **Fatia 3 — consultas e tempo**
   - Detalhe de atividade (`GET /atividades/:id`), situação temporal prevista/em_andamento/encerrada com relógio controlado (R15, R16), listagem real e ordenação (R17, R18), filtros por dia e tipo (R19, R20).
4. **Fatia 4 — edição, cancelamento e integrações**
   - `PATCH /atividades/:id` (R11), redução de vagas e validação de ocupados (R12), cancelamento de atividade (R13, R14), portas de integração com o M2 para aumento de vagas (R27) e cancelamento (R28) com porta falsa, campos de ocupação (R23).
5. **Fatia 5 — interface**
   - Cliente HTTP centralizado (R38), seletor de usuário e localStorage (R38), programação, filtros, detalhe, formulários da organização, estados visuais e tratamento de erros (R36, R37), ponto de extensão do M2 (R39), testes automatizados da interface com API falsa (R40, R41).

---

## Apêndice A: Matriz Regra → Critério de aceite
- R1 → Critérios 1, 2
- R2 → Critérios 3, 4, 5, 6
- R3 → Critérios 7, 8, 9, 10
- R4 → Critérios 11, 12, 13, 14
- R5 → Critério 15
- R6 → Critérios 16, 17
- R7 → Critérios 18, 19, 20, 21, 22
- R8 → Critérios 23, 24, 25, 26, 27
- R9 → Critério 28
- R10 → Critérios 29, 30
- R11 → Critérios 31, 32, 33, 34, 35, 36
- R12 → Critérios 37, 38
- R13 → Critérios 39, 40
- R14 → Critérios 41, 42
- R15 → Critérios 43, 44, 45, 46, 47
- R16 → Critério 48
- R17 → Critério 49
- R18 → Critério 50
- R19 → Critérios 51, 52
- R20 → Critérios 53, 54, 55
- R21 → Critério 56
- R22 → Critério 57
- R23 → Critérios 58, 59
- R24 → Critérios 60, 61
- R25 → Critérios 62, 63, 64, 65, 66, 67, 68
- R26 → Critérios 69, 70, 71, 72, 73, 74, 75, 76, 77
- R27 → Critério 78
- R28 → Critério 79
- R29 → Critério 80
- R30 → Critério 81
- R31 → Critério 82
- R32 → Critério 83
- R33 → Critério 84
- R34 → Critério 85
- R35 → Critério 86
- R36 → Critérios 87, 88, 92
- R37 → Critério 89
- R38 → Critérios 90, 92
- R39 → Critério 91
- R40 → Critério 93
- R41 → Critério 94

## Apêndice B: Matriz Origem → Regra/Seção
- P-01 → R1, R2
- P-02 → R7
- P-03 → R8
- P-04 → R15
- P-05 → R11, R14
- P-06 → R13, R14
- P-07 → R9, R10
- P-08 → R17, R19, R20
- P-09 → R22
- P-10 → R23, Modelo/Objetivo de integração
- P-11 → R24, R25
- P-12 → R26
- P-13 → R7
- P-14 → R3, R4
- P-15 → R5, R6
- P-16 → R8, R18, R20
- P-17 → R9, R10, R12
- P-18 → R27, R28
- P-19 → R16, R21
- P-20 → R23, Lacunas e decisões não especificadas
- P-21 → Fora de escopo, R15, Como será verificado
- P-22 → R29, R30, R31, R32
- P-23 → R33, R34, R41, Regras de modo de teste e relógio
- P-24 → R36
- P-25 → R37
- P-26 → R38
- P-27 → R40
- P-28 → R39
- P-29 → Como será verificado
- RN-102 → R1
- RN-103 → R2
- RN-104 → R3
- RN-105 → R4, R5
- RN-106 → R6
- RN-107 → R7
- RN-108 → R8
- RN-109 → R9, R10
- RN-110 → R11
- RN-111 → R12, R23, R27
- RN-112 → R13
- RN-113 → R14
- RN-114 → R15, R16
- RN-115 → R17, R18
- RN-116 → R19, R20
- RN-211 → R27
- RN-217 → R28
- contrato-api.md → R21, R22, R24, R25, R26, R29, R30, R31, R32, R33, R34, R36, R41, Endpoints
- Issue #1 / Resumo público → Objetivo, Fora de escopo, R35, R36, R37, R39, R41
- Decisões técnicas / README / AGENTS / projeto.json → R33, R34, R35, R38, R40, R41, Como será verificado
