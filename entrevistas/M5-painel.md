# Entrevista — Módulo M5: Painel da Organização

## Rodada 1 — Entrevista sem consulta aos requisitos

❓ **P-01 — Cálculo da ocupação percentual (`ocupacaoPercentual`)**: Como o percentual de ocupação de uma atividade (`ocupadas` dividido por `vagas`) deve ser calculado, formatado e tratado quando o número de vagas for zero?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-02 — Cálculo da frequência percentual (`frequenciaPercentual`)**: Como o percentual de frequência de uma atividade (`frequenciaPercentual`) é calculado no painel (`GET /painel/atividades`), quais presenças contam e o que acontece se a atividade não tiver encontros ou nenhum inscrito?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-03 — Critério exato da condição "sem chance" (`/painel/atividades/:id/sem-chance`)**: O que define exatamente um participante estar "sem chance" em uma atividade (relação entre faltas acumuladas, encontros já ocorridos e o mínimo de presença necessário para certificado) e qual é o significado exato de `faltas` e `faltasPermitidas` no contrato?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2. A frequência mínima aplicável também permanece pendente.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-04 — Formato e conteúdo da exportação de frequência (`GET /painel/atividades/:id/frequencia.csv`)**: Quais colunas, formato de delimitador (vírgula ou ponto-e-vírgula), codificação de caracteres e tratamento de dados o arquivo CSV gerado deve conter para atender à organização?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-05 — Regras de listagem e remoção de bloqueios (`/painel/bloqueios` e `DELETE`)**: Quais critérios exatos originam o bloqueio de um participante, quais dados o objeto Bloqueio expõe (`participanteId`, `nome`, `atividades`, `bloqueadoDesde`) e o que a operação `DELETE` realiza além de retornar `204`?
- **Resposta**: Os campos públicos do objeto `Bloqueio` (`participanteId`, `nome`, `atividades` e `bloqueadoDesde`) estão resolvidos pelo `contrato-api.md`. As regras de geração, manutenção, gatilho e remoção do bloqueio permanecem pendentes.
- **Estado**: PARCIALMENTE PENDENTE
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Consultar requisitos na Rodada 2 para as regras de geração, manutenção e remoção do bloqueio.

---

❓ **P-06 — Escopo de acesso e autorização das rotas do painel (`GET /painel/*` e `DELETE /painel/bloqueios/*`)**: Como o sistema restringe o acesso a essas rotas exclusivamente para usuários com o papel de organização (`SOMENTE_ORGANIZACAO` / 403), e o que ocorre se o cabeçalho `X-Usuario` estiver ausente ou inválido?
- **Resposta**: Todas as rotas da M5 exigem `X-Usuario` válido. Cabeçalho ausente ou ID inexistente retorna 401 `USUARIO_DESCONHECIDO`. Usuário válido com papel `participante` tentando acessar uma rota da M5 retorna 403 `SOMENTE_ORGANIZACAO`. A identificação 401 é verificada antes da autorização 403.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Nenhuma.

---

❓ **P-07 — Ordenação e paginação nas listagens de painel e bloqueios**: Existe alguma regra específica de ordenação nos endpoints `GET /painel/atividades` e `GET /painel/bloqueios`?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-08 — Comportamento para atividades canceladas ou inexistentes no painel**: Como os endpoints de painel se comportam se a atividade solicitada estiver cancelada ou não existir (`NAO_ENCONTRADO` / 404)?
- **Resposta**: Para atividade inexistente, o `contrato-api.md` já determina 404 `NAO_ENCONTRADO`. Para atividade existente, mas cancelada, consultar requisitos.
- **Estado**: PARCIALMENTE PENDENTE
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Consultar requisitos na Rodada 2 quanto ao comportamento e código de resposta ao consultar rotas de painel de uma atividade cancelada.

---

❓ **P-09 — Formato exato do campo `bloqueadoDesde`**: Qual é o formato padrão esperado para a string do campo `bloqueadoDesde` no objeto de bloqueio retornado em `GET /painel/bloqueios`?
- **Resposta**: `bloqueadoDesde` deve ser um instante em formato ISO 8601 com fuso. A API pode responder em qualquer fuso, e a comparação deve considerar o instante, não o texto.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Nenhuma.

---

❓ **P-10 — Critério temporal para o cálculo de presença e contagens no painel**: Como o sistema determina quais encontros e presenças são considerados "já ocorridos" ao calcular a frequência percentual e a lista de "sem chance"?
- **Resposta**: Toda decisão temporal deve obrigatoriamente usar a abstração central de relógio, conforme `AGENTS.md`. Porém, o instante exato em que um encontro passa a entrar nos cálculos de frequência e de “sem chance” não está definido no contrato e precisa ser consultado.
- **Estado**: PARCIALMENTE PENDENTE
- **Fonte resolvida**: `AGENTS.md`
- **Pendência**: Consultar requisitos na Rodada 2 quanto ao instante exato em que um encontro passa a contar nos cálculos de frequência e "sem chance".

---

❓ **P-11 — Integração de dados entre o M5 e os módulos de inscrição/presença**: Para montar as métricas do painel, o M5 consome diretamente as tabelas de inscrições e presenças dos outros módulos ou utiliza portas/interfaces de consulta explícitas?
- **Resposta**: O M5 deve consumir dados pertencentes a M1, M2, M3 e M4 por portas ou interfaces explícitas. Não deve consultar diretamente tabelas, repositórios ou detalhes internos desses módulos, nem duplicar suas regras.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `AGENTS.md` e `api/AGENTS.md`
- **Pendência**: Nenhuma.

---

❓ **P-12 — Tratamento de participantes sem inscrições ou sem faltas**: O que deve ser retornado pelas rotas `GET /painel/atividades/:id/sem-chance` e `GET /painel/bloqueios` quando não houver nenhum participante que atenda aos critérios de "sem chance" ou bloqueio?
- **Resposta**: Quando não existir participante que satisfaça os critérios, `GET /painel/atividades/:id/sem-chance` e `GET /painel/bloqueios` devem responder status 200 com lista vazia `[]`. Isso decorre dos tipos de retorno `[SemChance]` e `[Bloqueio]` definidos no `contrato-api.md`.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Nenhuma.

---

❓ **P-13 — Critérios e limites de exportação do CSV de frequência**: O arquivo gerado em `GET /painel/atividades/:id/frequencia.csv` deve incluir todos os participantes inscritos na atividade e quais cabeçalhos específicos devem constar na primeira linha?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-14 — Consequência da remoção de bloqueio (`DELETE /painel/bloqueios/:participanteId`)**: Quando um bloqueio por faltas é removido com sucesso pela organização (`204`), o sistema restaura automaticamente as inscrições que porventura tenham sido canceladas ou apenas libera o participante para realizar novas inscrições?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-15 — Tratamento de erros e códigos de falha específicos do painel**: Além dos códigos globais, existe algum código de erro específico da API previsto para falhas operacionais nas rotas do painel, ou todas as operações de consulta e exclusão bem-sucedidas ou inexistentes esgotam-se nos códigos já mapeados?
- **Resposta**: Utilize somente os códigos previstos em `contrato-api.md`. Para as rotas administrativas da M5 aplicam-se 401 `USUARIO_DESCONHECIDO`, 403 `SOMENTE_ORGANIZACAO` e 404 `NAO_ENCONTRADO` quando o recurso exigido não existe. Em particular, `DELETE /painel/bloqueios/:participanteId` retorna 404 quando o participante não está bloqueado. Não crie códigos 409 ou 422 específicos da M5 sem previsão contratual.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Nenhuma.

---

❓ **P-16 — Parâmetros de consulta ou paginação adicionais nas rotas do painel**: Os endpoints de listagem da M5 aceitam algum parâmetro de filtro via query string ou paginação, ou retornam sempre a listagem completa?
- **Resposta**: `contrato-api.md` não define parâmetros de consulta, filtros ou paginação para `GET /painel/atividades` e `GET /painel/bloqueios`. Portanto, não crie parâmetros adicionais. As rotas devem retornar as coleções completas determinadas pelas regras da M5.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Nenhuma.

---

❓ **P-17 — Critérios de inclusão e exclusão de atividades em `GET /painel/atividades`**: Quais atividades devem constar no painel da organização, e como as atividades canceladas ou em diferentes situações temporais devem aparecer ou ser tratadas nessa listagem?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-18 — Universo de participantes elegíveis e impacto do status de inscrição**: Quais participantes compõem o universo base considerado nas métricas de ocupação, lista de espera, contagem de faltas, relatórios de "sem chance" e exportação de CSV?
- **Resposta**: Dados pertencentes a outros módulos devem ser obtidos por portas ou interfaces explícitas; o M5 não pode acessar tabelas ou detalhes internos desses módulos. O universo exato de participantes usado em ocupação, espera, frequência, faltas, “sem chance” e CSV continua pendente para a Rodada 2.
- **Estado**: PARCIALMENTE PENDENTE
- **Fonte resolvida**: `AGENTS.md`, `api/AGENTS.md` e `EQUIPE.md`
- **Pendência**: Consultar requisitos na Rodada 2 para o universo exato de participantes em ocupação, espera, frequência, faltas, “sem chance” e CSV.

---

❓ **P-19 — Cálculo de frequência individual e agregada**: Como a frequência de um participante em um encontro específico é pontuada, e como essa pontuação se traduz na frequência percentual exibida ou calculada no painel?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-20 — Significado das marcas `P`, `F` e `-` no CSV e janela de sincronização**: O que representam exatamente os caracteres/marcas `P`, `F` e `-` nas colunas de encontro do CSV, e como o sistema lida com encontros cuja janela de registro ou sincronização ainda está aberta?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-21 — Estrutura, ordem e identificação das colunas de encontros no CSV**: Qual é a ordem exata das colunas no arquivo CSV exportado em `GET /painel/atividades/:id/frequencia.csv`, como os encontros devem ser identificados nos cabeçalhos e qual é o separador decimal e formato de frequência?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-22 — Codificação, BOM e delimitador do CSV**: Qual codificação de caracteres exata, presença ou ausência de BOM, e qual delimitador de campo devem ser obrigatoriamente utilizados no arquivo CSV?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-23 — Ordenação das linhas no "sem chance" e no CSV de frequência**: Existe alguma regra específica de ordenação para os registros retornados em `GET /painel/atividades/:id/sem-chance` e para as linhas de dados exportadas em `GET /painel/atividades/:id/frequencia.csv`?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-24 — Origem e gatilho do bloqueio por faltas (`/painel/bloqueios`)**: Qual é a regra exata de negócio que dispara a criação de um registro de bloqueio, quais atividades entram como causadoras e como o campo `bloqueadoDesde` é populado no momento do bloqueio?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-25 — Efeito imediato e histórico do bloqueio nas inscrições**: Quando um participante é bloqueado, qual é o efeito prático sobre inscrições anteriores já realizadas e sobre novas tentativas de inscrição ou entrada em lista de espera?
- **Resposta**: O contrato prevê status 422 com código `INSCRICAO_BLOQUEADA` para uma tentativa de inscrição bloqueada. A precedência desse erro em relação às outras validações e o efeito do bloqueio sobre inscrições anteriores permanecem pendentes.
- **Estado**: PARCIALMENTE PENDENTE
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Consultar requisitos na Rodada 2 quanto à precedência do erro e ao efeito sobre inscrições já existentes.

---

❓ **P-26 — Histórico após desbloqueio, reincidência e múltiplos ciclos**: Após a remoção de um bloqueio, as faltas passadas que causaram o bloqueio são zeradas ou continuam contando, permitindo um novo bloqueio imediato caso novas faltas ocorram?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-27 — Impacto de atividades canceladas nos cálculos, relatórios e bloqueios**: Como atividades que foram canceladas afetam as métricas do painel, os relatórios de "sem chance", o cálculo de frequência e a apuração de faltas para bloqueio?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-28 — Significado, valor e formatação da coluna de certificado no CSV**: Qual é o significado exato da coluna relacionada a certificado no arquivo CSV, e qual é o valor e formatação exatos apresentados nessa coluna?
- **Resposta**: PENDENTE — consultar requisitos na Rodada 2.
- **Estado**: PENDENTE
- **Fonte**: -
- **Pendência**: consultar requisitos na Rodada 2.

---

❓ **P-29 — Nome do arquivo, extensão e cabeçalhos HTTP do download**: Quais são o nome padrão do arquivo, extensão e cabeçalhos HTTP de resposta obrigatórios para a exportação de frequência em `GET /painel/atividades/:id/frequencia.csv`?
- **Resposta**: O `contrato-api.md` determina a extensão `.csv` na própria rota e resposta com `Content-Type: text/csv`. O nome exato do arquivo, `Content-Disposition`, parâmetro `filename`, eventual `charset` e demais detalhes permanecem pendentes.
- **Estado**: PARCIALMENTE PENDENTE
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Consultar requisitos na Rodada 2 quanto ao nome exato do arquivo, `Content-Disposition`, parâmetro `filename`, eventual `charset` e demais detalhes de download.

---

❓ **P-30 — Requisitos de interface, telas, navegação e ações da organização na M5**: Quais telas, abas ou painéis compõem a interface da M5 para a organização, e quais interações e fluxos são obrigatórios na aplicação web?
- **Resposta**: A interface da M5 deve oferecer: 1) painel de atividades para a organização, exibindo ocupação, frequência e estado de frequência indisponível, com navegação para informações da atividade; 2) visão “Sem chance de certificado” vinculada claramente à atividade; 3) visão de bloqueios, mostrando participante, atividades causadoras e ação de desbloqueio; 4) ação de download do CSV por atividade, preservando exatamente os bytes entregues pela API e exibindo falha quando ocorrer; 5) nenhuma dessas telas ou ações administrativas deve ser exibida ou permitida para participantes.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: Decisão explícita de escopo da entrevista.
- **Pendência**: Nenhuma.

---

❓ **P-31 — Estados visuais obrigatórios de carregamento, vazio, erro e atualização**: Como a interface da M5 deve representar visualmente e semântica e acessivelmente os estados de carregamento de dados, coleções vazias, falhas de comunicação com a API e a atualização automática das telas após ações como a remoção de um bloqueio?
- **Resposta**: Todas as telas devem possuir estados distintos de carregamento, vazio, erro e sucesso. Erros devem apresentar de forma compreensível o código e a mensagem retornados pela API. Ações duplicadas devem ser bloqueadas enquanto estão em andamento. Após desbloqueio bem-sucedido, a lista deve ser buscada novamente e atualizada. A implementação deve usar HTML semântico, rótulos e navegação por teclado. `role="alert"` pode ser usado como decisão técnica, mas não deve ser registrado como regra de negócio obrigatória.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `AGENTS.md` e `app/AGENTS.md`
- **Pendência**: Nenhuma.

---

❓ **P-32 — Atualização temporal e reação ao avanço do relógio controlado**: Como o painel da organização e suas contagens temporais reagem na interface quando o relógio do sistema (ou relógio de testes controlável) avança, exigindo nova busca ou recálculo automático na tela?
- **Resposta**: A API e o relógio central são a única fonte de verdade temporal. A interface não deve recalcular regras de frequência, faltas ou bloqueio usando o relógio do navegador. Deve buscar os dados ao entrar na tela, após ações bem-sucedidas e quando o usuário acionar uma opção visível de atualização. Após avanço do relógio controlado, uma nova busca deve refletir imediatamente o novo estado. Não é obrigatório usar polling periódico.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: Decisão técnica desta entrevista.
- **Pendência**: Nenhuma.

---

❓ **P-33 — Critérios de verificação e testes automatizados da M5**: Quais cenários de teste automatizado são necessários para comprovar o funcionamento de cada rota e regra da M5?
- **Resposta**: Cada futura regra da spec deve possuir prova automatizada. A cobertura deve incluir: 1) autorização 401/403 em todas as rotas; 2) inclusão, exclusão e ordenação das atividades; 3) ocupação zero, parcial, total, arredondamentos e alterações vindas do M2/M1; 4) frequência por encontro e agregada, incluindo estado indisponível; 5) fronteiras de “sem chance” e avanço do relógio; 6) validação do CSV por bytes e conteúdo, não apenas status 200; 7) bloqueio, atividades causadoras, desbloqueio, reincidência e integração com M2; 8) recursos inexistentes e coleções vazias; 9) interface com API falsa/mock cobrindo carregamento, vazio, sucesso, erro, download e atualização após desbloqueio.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `AGENTS.md`, `api/AGENTS.md` e `app/AGENTS.md`.
- **Pendência**: Nenhuma.

## Tabela de Rastreabilidade

| Pergunta | Estado após Rodada 1 | Fonte resolvida | Pendência para Rodada 2 |
|---|---|---|---|
| P-01 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-02 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-03 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-04 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-05 | PARCIALMENTE PENDENTE | `contrato-api.md` | Consultar requisitos na Rodada 2 para as regras de geração, manutenção e remoção do bloqueio. |
| P-06 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-07 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-08 | PARCIALMENTE PENDENTE | `contrato-api.md` | Consultar requisitos na Rodada 2 quanto ao comportamento e código de resposta ao consultar rotas de painel de uma atividade cancelada. |
| P-09 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-10 | PARCIALMENTE PENDENTE | `AGENTS.md` | Consultar requisitos na Rodada 2 quanto ao instante exato em que um encontro passa a contar nos cálculos de frequência e "sem chance". |
| P-11 | RESOLVIDA | `AGENTS.md`, `api/AGENTS.md` | Nenhuma. |
| P-12 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-13 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-14 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-15 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-16 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-17 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-18 | PARCIALMENTE PENDENTE | `AGENTS.md`, `api/AGENTS.md` e `EQUIPE.md` | Consultar requisitos na Rodada 2 para o universo exato de participantes em ocupação, espera, frequência, faltas, “sem chance” e CSV. |
| P-19 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-20 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-21 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-22 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-23 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-24 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-25 | PARCIALMENTE PENDENTE | `contrato-api.md` | Consultar requisitos na Rodada 2 quanto à precedência do erro e ao efeito sobre inscrições já existentes. |
| P-26 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-27 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-28 | PENDENTE | - | consultar requisitos na Rodada 2 |
| P-29 | PARCIALMENTE PENDENTE | `contrato-api.md` | Consultar requisitos na Rodada 2 quanto ao nome exato do arquivo, `Content-Disposition`, parâmetro `filename`, eventual `charset` e demais detalhes de download. |
| P-30 | RESOLVIDA | Decisão explícita de escopo | Nenhuma. |
| P-31 | RESOLVIDA | `AGENTS.md`, `app/AGENTS.md` | Nenhuma. |
| P-32 | RESOLVIDA | Decisão técnica | Nenhuma. |
| P-33 | RESOLVIDA | `AGENTS.md`, `api/AGENTS.md`, `app/AGENTS.md` | Nenhuma. |
