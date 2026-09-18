# Entrevista — Módulo M5: Painel da Organização

## Rodada 1 — Entrevista sem consulta aos requisitos

❓ **P-01 — Cálculo da ocupação percentual (`ocupacaoPercentual`)**: Como o percentual de ocupação de uma atividade (`ocupadas` dividido por `vagas`) deve ser calculado, formatado e tratado quando o número de vagas for zero?
- **Resposta**: A ocupação é calculada como `(inscrições confirmadas + inscrições convocadas) / vagas * 100`. O resultado final é arredondado para uma casa decimal, usando arredondamento de metade para cima. Atividades válidas possuem pelo menos uma vaga; portanto, divisão por zero não ocorre em um estado válido.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-503 e RN-107
- **Pendência**: Nenhuma.

---

❓ **P-02 — Cálculo da frequência percentual (`frequenciaPercentual`)**: Como o percentual de frequência de uma atividade (`frequenciaPercentual`) é calculado no painel (`GET /painel/atividades`), quais presenças contam e o que acontece se a atividade não tiver encontros ou nenhum inscrito?
- **Resposta**: A frequência de cada encontro encerrado é o número de presenças dividido pelo número de inscrições confirmadas, multiplicado por 100. A frequência da atividade é a média das frequências dos encontros já encerrados. Arredondamos apenas o resultado final para uma casa decimal, usando metade para cima. Um encontro encerrado sem nenhuma inscrição confirmada possui frequência indisponível (`null`) e não entra na média. Se não existir nenhum encontro encerrado com frequência calculável, `frequenciaPercentual` será `null`.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-504 e decisão humana da Rodada 2
- **Pendência**: Nenhuma.

---

❓ **P-03 — Critério exato da condição "sem chance" (`/painel/atividades/:id/sem-chance`)**: O que define exatamente um participante estar "sem chance" em uma atividade (relação entre faltas acumuladas, encontros já ocorridos e o mínimo de presença necessário para certificado) e qual é o significado exato de `faltas` e `faltasPermitidas` no contrato?
- **Resposta**: Considere `N` como o total de encontros da atividade; presenças mínimas como `ceil(0,75 * N)`; `faltasPermitidas` como `N - ceil(0,75 * N)`; e `faltas` como a quantidade de encontros cujo prazo de registro já venceu e nos quais o participante confirmado não possui presença. O participante fica “sem chance” quando `faltas > faltasPermitidas`. A frequência mínima é de 75% dos encontros, sem arredondamento favorável. A condição pode ocorrer antes do encerramento da atividade.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-404, RN-505 e RN-312
- **Pendência**: Nenhuma.

---

❓ **P-04 — Formato e conteúdo da exportação de frequência (`GET /painel/atividades/:id/frequencia.csv`)**: Quais colunas, formato de delimitador (vírgula ou ponto-e-vírgula), codificação de caracteres e tratamento de dados o arquivo CSV gerado deve conter para atender à organização?
- **Resposta**: O CSV deve: usar UTF-8 com BOM; usar ponto e vírgula como delimitador; possuir uma linha para cada inscrição atualmente confirmada; ordenar as linhas alfabeticamente pelo nome completo; usar exatamente os cabeçalhos `nome;E1;...;En;frequencia;certificado`; usar `P` quando existe presença; usar `F` quando o prazo do encontro venceu sem presença; usar `-` quando o prazo ainda está aberto; escrever a frequência com vírgula decimal e uma casa; escrever o certificado como `sim` ou `nao`, sem acento.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-506
- **Pendência**: Nenhuma.

---

❓ **P-05 — Regras de listagem e remoção de bloqueios (`/painel/bloqueios` e `DELETE`)**: Quais critérios exatos originam o bloqueio de um participante, quais dados o objeto Bloqueio expõe (`participanteId`, `nome`, `atividades`, `bloqueadoDesde`) e o que a operação `DELETE` realiza além de retornar `204`?
- **Resposta**: Um participante confirmado fica bloqueado ao acumular duas atividades encerradas com zero presença em ambas. Enquanto bloqueado, não pode criar nova inscrição nem entrar em lista de espera, mas suas inscrições anteriores continuam válidas. A organização consulta os bloqueados com os campos públicos definidos no contrato, incluindo os IDs das duas atividades causadoras, e pode remover o bloqueio. `bloqueadoDesde` deve ser o instante de término da segunda atividade que fez o participante atingir o critério. Se mais de duas atividades forem elegíveis, utilize as duas primeiras em ordem cronológica de encerramento; empate pelo ID da atividade. Após o desbloqueio, atividades encerradas antes ou no instante do desbloqueio não podem ser reutilizadas para outro bloqueio.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-507, RN-508, RN-509, `contrato-api.md` e decisão humana da Rodada 2
- **Pendência**: Nenhuma.

---

❓ **P-06 — Escopo de acesso e autorização das rotas do painel (`GET /painel/*` e `DELETE /painel/bloqueios/*`)**: Como o sistema restringe o acesso a essas rotas exclusivamente para usuários com o papel de organização (`SOMENTE_ORGANIZACAO` / 403), e o que ocorre se o cabeçalho `X-Usuario` estiver ausente ou inválido?
- **Resposta**: Todas as rotas da M5 exigem `X-Usuario` válido. Cabeçalho ausente ou ID inexistente retorna 401 `USUARIO_DESCONHECIDO`. Usuário válido com papel `participante` tentando acessar uma rota da M5 retorna 403 `SOMENTE_ORGANIZACAO`. A identificação 401 é verificada antes da autorização 403.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Nenhuma.

---

❓ **P-07 — Ordenação e paginação nas listagens de painel e bloqueios**: Existe alguma regra específica de ordenação nos endpoints `GET /painel/atividades` e `GET /painel/bloqueios`?
- **Resposta**: Ordenações determinísticas adotadas: painel de atividades por início do primeiro encontro em ordem crescente, empate pelo título e depois por `atividadeId`; bloqueios por nome completo do participante em ordem alfabética, empate por `participanteId`. Não existe paginação.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-115 e decisão humana da Rodada 2
- **Pendência**: Nenhuma.

---

❓ **P-08 — Comportamento para atividades canceladas ou inexistentes no painel**: Como os endpoints de painel se comportam se a atividade solicitada estiver cancelada ou não existir (`NAO_ENCONTRADO` / 404)?
- **Resposta**: Atividade inexistente retorna 404 `NAO_ENCONTRADO`. Atividade cancelada fica fora de `GET /painel/atividades`. Para uma atividade existente, mas cancelada: `GET /painel/atividades/:id/sem-chance` retorna 200 com `[]`; `GET /painel/atividades/:id/frequencia.csv` retorna 200 com um CSV contendo BOM e somente o cabeçalho correspondente aos encontros, sem linhas de participantes. Não crie um código de erro novo para esses casos.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-502, RN-217, `contrato-api.md` e decisão humana da Rodada 2
- **Pendência**: Nenhuma.

---

❓ **P-09 — Formato exato do campo `bloqueadoDesde`**: Qual é o formato padrão esperado para a string do campo `bloqueadoDesde` no objeto de bloqueio retornado em `GET /painel/bloqueios`?
- **Resposta**: `bloqueadoDesde` deve ser um instante em formato ISO 8601 com fuso. A API pode responder em qualquer fuso, e a comparação deve considerar o instante, não o texto.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: `contrato-api.md`
- **Pendência**: Nenhuma.

---

❓ **P-10 — Critério temporal para o cálculo de presença e contagens no painel**: Como o sistema determina quais encontros e presenças são considerados "já ocorridos" ao calcular a frequência percentual e a lista de "sem chance"?
- **Resposta**: Para a frequência do painel, um encontro passa a contar quando chega ao seu horário de término; o instante exato do término já conta como encerrado. Para “sem chance”, o encontro somente pode virar falta depois que expira o prazo de registro de presença, duas horas após seu término. Como um prazo descrito como “até X” aceita o próprio instante X, no instante exato de `fim + 2 horas` o registro ainda é aceito; a falta passa a contar imediatamente depois desse instante. Toda comparação usa o relógio centralizado.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-504, RN-505, RN-312 e regras gerais de tempo
- **Pendência**: Nenhuma.

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
- **Resposta**: Inclua no CSV somente participantes cuja inscrição esteja atualmente com status `confirmada`. Não inclua inscrições `em_espera`, `convocada`, `cancelada` ou `expirada`. Ordene pelo nome completo. Os cabeçalhos e marcas seguem a resposta da P-04.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-506
- **Pendência**: Nenhuma.

---

❓ **P-14 — Consequência da remoção de bloqueio (`DELETE /painel/bloqueios/:participanteId`)**: Quando um bloqueio por faltas é removido com sucesso pela organização (`204`), o sistema restaura automaticamente as inscrições que porventura tenham sido canceladas ou apenas libera o participante para realizar novas inscrições?
- **Resposta**: O desbloqueio apenas remove a restrição para novas inscrições e entradas em lista de espera. Ele não restaura, cancela nem modifica inscrições anteriores, que já continuavam válidas durante o bloqueio. Depois do desbloqueio, somente atividades encerradas após o instante do desbloqueio podem contar para um novo bloqueio.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-507, RN-508 e RN-509
- **Pendência**: Nenhuma.

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
- **Resposta**: `GET /painel/atividades` inclui todas as atividades não canceladas, independentemente de estarem previstas, em andamento ou encerradas. Atividades canceladas ficam fora do painel. A ordenação segue a P-07.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-502 e decisão humana da Rodada 2
- **Pendência**: Nenhuma.

---

❓ **P-18 — Universo de participantes elegíveis e impacto do status de inscrição**: Quais participantes compõem o universo base considerado nas métricas de ocupação, lista de espera, contagem de faltas, relatórios de "sem chance" e exportação de CSV?
- **Resposta**: Utilize estes universos:
  - `ocupadas`: inscrições atualmente `confirmada` ou `convocada`;
  - `emEspera`: inscrições atualmente `em_espera`;
  - frequência de encontro: presenças de participantes confirmados divididas pelas inscrições confirmadas;
  - “sem chance”: somente participantes com inscrição confirmada;
  - CSV: somente participantes com inscrição confirmada;
  - bloqueio: participante que estava confirmado nas atividades encerradas causadoras e terminou ambas com zero presença.
  Inscrições `cancelada` ou `expirada` não entram nessas contagens. Todos esses dados devem ser consumidos por portas explícitas dos módulos responsáveis.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-503, RN-504, RN-505, RN-506, RN-507, `contrato-api.md` e decisão humana da Rodada 2 para `emEspera`
- **Pendência**: Nenhuma.

---

❓ **P-19 — Cálculo de frequência individual e agregada**: Como a frequência de um participante em um encontro específico é pontuada, e como essa pontuação se traduz na frequência percentual exibida ou calculada no painel?
- **Resposta**: A frequência de um encontro é `presenças / inscrições confirmadas * 100`. Encontro encerrado sem confirmados tem frequência `null` e é excluído da média. A frequência da atividade é a média dos encontros encerrados com frequência calculável. No CSV, a frequência individual é `quantidade de presenças / total de encontros da atividade * 100`. Todos os encontros da atividade entram nesse denominador, inclusive os que ainda apresentam `-`. O resultado é exibido com uma casa decimal e vírgula decimal.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-504, RN-506 e decisão humana da Rodada 2 para divisor zero
- **Pendência**: Nenhuma.

---

❓ **P-20 — Significado das marcas `P`, `F` e `-` no CSV e janela de sincronização**: O que representam exatamente os caracteres/marcas `P`, `F` e `-` nas colunas de encontro do CSV, e como o sistema lida com encontros cuja janela de registro ou sincronização ainda está aberta?
- **Resposta**: Nas colunas dos encontros:
  - `P`: existe presença registrada, independentemente de ter origem QR, QR offline ou manual;
  - `F`: o prazo de registro já expirou e não existe presença;
  - `-`: o prazo ainda está aberto, incluindo encontros futuros ou dentro da janela de presença.
  O prazo permanece aberto até o próprio instante de duas horas após o término. `F` somente aparece depois desse instante.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-405, RN-506 e RN-312
- **Pendência**: Nenhuma.

---

❓ **P-21 — Estrutura, ordem e identificação das colunas de encontros no CSV**: Qual é a ordem exata das colunas no arquivo CSV exportado em `GET /painel/atividades/:id/frequencia.csv`, como os encontros devem ser identificados nos cabeçalhos e qual é o separador decimal e formato de frequência?
- **Resposta**: A ordem exata das colunas é `nome;E1;E2;...;En;frequencia;certificado`. Os encontros são numerados em ordem cronológica de início. Em eventual empate, use o ID do encontro. A frequência usa vírgula decimal e exatamente uma casa.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-506 e decisão humana da Rodada 2 para o desempate
- **Pendência**: Nenhuma.

---

❓ **P-22 — Codificação, BOM e delimitador do CSV**: Qual codificação de caracteres exata, presença ou ausência de BOM, e qual delimitador de campo devem ser obrigatoriamente utilizados no arquivo CSV?
- **Resposta**: O arquivo usa: UTF-8 com BOM no início; ponto e vírgula como delimitador; `\n` como quebra de linha; uma quebra de linha também após a última linha. Não use vírgula como separador de campos.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-506 e decisão humana da Rodada 2 para a quebra de linha
- **Pendência**: Nenhuma.

---

❓ **P-23 — Ordenação das linhas no "sem chance" e no CSV de frequência**: Existe alguma regra específica de ordenação para os registros retornados em `GET /painel/atividades/:id/sem-chance` e para as linhas de dados exportadas em `GET /painel/atividades/:id/frequencia.csv`?
- **Resposta**: Ordene tanto o CSV quanto a resposta de “sem chance” alfabeticamente pelo nome completo do participante. Em nomes iguais, desempate por `participanteId`.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-506 e decisão humana da Rodada 2 para “sem chance” e desempate
- **Pendência**: Nenhuma.

---

❓ **P-24 — Origem e gatilho do bloqueio por faltas (`/painel/bloqueios`)**: Qual é a regra exata de negócio que dispara a criação de um registro de bloqueio, quais atividades entram como causadoras e como o campo `bloqueadoDesde` é populado no momento do bloqueio?
- **Resposta**: O bloqueio acontece quando um participante confirmado acumula duas atividades encerradas com zero presença nas duas. Considere somente atividades encerradas após o último desbloqueio. Atividades canceladas não contam, pois não são atividades encerradas para essa regra. As atividades causadoras são as duas primeiras que satisfizerem o critério em ordem cronológica de encerramento, com desempate por `atividadeId`. `bloqueadoDesde` é o término da segunda atividade causadora.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-507, RN-509, RN-114 e decisão humana da Rodada 2
- **Pendência**: Nenhuma.

---

❓ **P-25 — Efeito imediato e histórico do bloqueio nas inscrições**: Quando um participante é bloqueado, qual é o efeito prático sobre inscrições anteriores já realizadas e sobre novas tentativas de inscrição ou entrada em lista de espera?
- **Resposta**: Inscrições anteriores ao bloqueio continuam válidas. Enquanto bloqueado, o participante não pode criar nova inscrição nem entrar em lista de espera. Quando mais de uma regra rejeitar uma inscrição, aplique esta ordem:
  1. atividade inexistente — 404;
  2. atividade cancelada;
  3. inscrições encerradas;
  4. participante bloqueado — 422 `INSCRICAO_BLOQUEADA`;
  5. participante já inscrito;
  6. conflito de horário;
  7. limite de minicursos.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-208 e RN-507
- **Pendência**: Nenhuma.

---

❓ **P-26 — Histórico após desbloqueio, reincidência e múltiplos ciclos**: Após a remoção de um bloqueio, as faltas passadas que causaram o bloqueio são zeradas ou continuam contando, permitindo um novo bloqueio imediato caso novas faltas ocorram?
- **Resposta**: Depois do desbloqueio, as atividades anteriores deixam definitivamente de contar para outro bloqueio. Um novo bloqueio exige duas novas atividades que sejam encerradas depois do instante do desbloqueio e nas quais o participante confirmado tenha zero presença.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-509
- **Pendência**: Nenhuma.

---

❓ **P-27 — Impacto de atividades canceladas nos cálculos, relatórios e bloqueios**: Como atividades que foram canceladas afetam as métricas do painel, os relatórios de "sem chance", o cálculo de frequência e a apuração de faltas para bloqueio?
- **Resposta**: Atividades canceladas:
  - ficam fora de `GET /painel/atividades`;
  - não entram em cálculos ou médias apresentados no painel;
  - não geram participantes “sem chance”;
  - não contam para bloqueios;
  - em acesso direto à rota “sem chance”, retornam 200 com `[]`;
  - em acesso direto ao CSV, retornam 200 com BOM e somente o cabeçalho, sem participantes.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-502, RN-217, RN-114 e decisão humana da Rodada 2
- **Pendência**: Nenhuma.

---

❓ **P-28 — Significado, valor e formatação da coluna de certificado no CSV**: Qual é o significado exato da coluna relacionada a certificado no arquivo CSV, e qual é o valor e formatação exatos apresentados nessa coluna?
- **Resposta**: A coluna `certificado` representa elegibilidade, e não a emissão efetiva pelo M4. Use:
  - `sim`: somente quando a atividade estiver encerrada e o participante confirmado atingir pelo menos 75% dos encontros, sem arredondamento favorável;
  - `nao`: em qualquer outro caso.
  O valor não depende de o participante já ter solicitado ou emitido o certificado.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-401, RN-402, RN-404, RN-506 e decisão humana da Rodada 2
- **Pendência**: Nenhuma.

---

❓ **P-29 — Nome do arquivo, extensão e cabeçalhos HTTP do download**: Quais são o nome padrão do arquivo, extensão e cabeçalhos HTTP de resposta obrigatórios para a exportação de frequência em `GET /painel/atividades/:id/frequencia.csv`?
- **Resposta**: A resposta do CSV deve usar:
  - nome do arquivo: `frequencia.csv`;
  - `Content-Type: text/csv; charset=utf-8`;
  - `Content-Disposition: attachment; filename="frequencia.csv"`;
  - corpo UTF-8 iniciado por BOM.
- **Estado**: RESOLVIDA
- **Fonte resolvida**: RN-506, `contrato-api.md` e decisão humana da Rodada 2 para os cabeçalhos HTTP
- **Pendência**: Nenhuma.

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

| Pergunta | Estado atual | Fonte resolvida | Pendência atual |
|---|---|---|---|
| P-01 | RESOLVIDA | RN-503 e RN-107 | Nenhuma. |
| P-02 | RESOLVIDA | RN-504 e decisão humana | Nenhuma. |
| P-03 | RESOLVIDA | RN-404, RN-505 e RN-312 | Nenhuma. |
| P-04 | RESOLVIDA | RN-506 | Nenhuma. |
| P-05 | RESOLVIDA | RN-507, RN-508, RN-509, `contrato-api.md` e decisão humana | Nenhuma. |
| P-06 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-07 | RESOLVIDA | RN-115 e decisão humana | Nenhuma. |
| P-08 | RESOLVIDA | RN-502, RN-217, `contrato-api.md` e decisão humana | Nenhuma. |
| P-09 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-10 | RESOLVIDA | RN-504, RN-505, RN-312 e regras gerais de tempo | Nenhuma. |
| P-11 | RESOLVIDA | `AGENTS.md`, `api/AGENTS.md` | Nenhuma. |
| P-12 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-13 | RESOLVIDA | RN-506 | Nenhuma. |
| P-14 | RESOLVIDA | RN-507, RN-508 e RN-509 | Nenhuma. |
| P-15 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-16 | RESOLVIDA | `contrato-api.md` | Nenhuma. |
| P-17 | RESOLVIDA | RN-502 e decisão humana | Nenhuma. |
| P-18 | RESOLVIDA | RN-503, RN-504, RN-505, RN-506, RN-507, `contrato-api.md` e decisão humana | Nenhuma. |
| P-19 | RESOLVIDA | RN-504, RN-506 e decisão humana | Nenhuma. |
| P-20 | RESOLVIDA | RN-405, RN-506 e RN-312 | Nenhuma. |
| P-21 | RESOLVIDA | RN-506 e decisão humana | Nenhuma. |
| P-22 | RESOLVIDA | RN-506 e decisão humana | Nenhuma. |
| P-23 | RESOLVIDA | RN-506 e decisão humana | Nenhuma. |
| P-24 | RESOLVIDA | RN-507, RN-509, RN-114 e decisão humana | Nenhuma. |
| P-25 | RESOLVIDA | RN-208 e RN-507 | Nenhuma. |
| P-26 | RESOLVIDA | RN-509 | Nenhuma. |
| P-27 | RESOLVIDA | RN-502, RN-217, RN-114 e decisão humana | Nenhuma. |
| P-28 | RESOLVIDA | RN-401, RN-402, RN-404, RN-506 e decisão humana | Nenhuma. |
| P-29 | RESOLVIDA | RN-506, `contrato-api.md` e decisão humana | Nenhuma. |
| P-30 | RESOLVIDA | Decisão explícita de escopo | Nenhuma. |
| P-31 | RESOLVIDA | `AGENTS.md`, `app/AGENTS.md` | Nenhuma. |
| P-32 | RESOLVIDA | Decisão técnica | Nenhuma. |
| P-33 | RESOLVIDA | `AGENTS.md`, `api/AGENTS.md`, `app/AGENTS.md` | Nenhuma. |

## Fechamento da Rodada 2

- Estado: Rodada 2 concluída.
- Todas as 33 perguntas estão resolvidas.
- As respostas oficiais foram registradas em paráfrase com suas fontes RN.
- Pontos não definidos expressamente nos requisitos foram resolvidos por decisões humanas registradas na entrevista.
- Nenhum documento externo foi copiado, citado pelo nome ou adicionado ao repositório.
- Nenhuma spec, teste ou implementação foi criada nesta rodada.
- A entrevista está pronta para revisão antes da geração da spec.
