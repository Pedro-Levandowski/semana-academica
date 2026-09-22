# Spec — M5: Painel da Organização

## 1. Objetivo
Gerenciar o painel administrativo da organização da Semana Acadêmica, englobando a listagem de atividades com métricas de ocupação e frequência percentual, relatórios de participantes sem chance de certificado, exportação de frequência em formato CSV estruturado, listagem e remoção de bloqueios por faltas acumuladas, e a interface web correspondente com restrição estrita de acesso e validações automatizadas.

## 2. Fora de escopo
O módulo M5 **não** inclui e está estritamente proibido de implementar:
- Criação, edição, cancelamento ou alteração da grade de atividades, salas ou horários (pertencentes ao M1).
- Gerenciamento direto de inscrições, vagas, lista de espera ou confirmações de convocações (pertencentes ao M2).
- Controle e registro de presença por QR code, leitura offline ou chamada manual (pertencentes ao M3).
- Emissão e verificação pública de certificados ou geração de extrato de horas (pertencentes ao M4).
- Funcionalidades de login, cadastro, gerenciamento de senhas ou autenticação por token JWT.
- Processamento de pagamentos, envio de e-mails ou notificações push.
- Modificações funcionais ou estruturais internas nos módulos M1, M2, M3 ou M4.

## 3. Modelo
Entidades e objetos expostos ou gerenciados pela M5:
- **LinhaDoPainel**:
  - `atividadeId`: string
  - `titulo`: string
  - `vagas`: número inteiro (atividades válidas possuem sempre pelo menos uma vaga)
  - `ocupadas`: número inteiro (`confirmada` + `convocada`)
  - `emEspera`: número inteiro (`em_espera`)
  - `ocupacaoPercentual`: número float (arredondado para 1 casa decimal, metade para cima; divisão por zero não ocorre pois vagas $\ge 1$)
  - `frequenciaPercentual`: número float ou `null` (média das frequências dos encontros já encerrados com confirmados, arredondado para 1 casa decimal)

- **SemChance**:
  - `participanteId`: string
  - `nome`: string
  - `faltas`: número inteiro (encontros com prazo de registro vencido e sem presença registrada)
  - `faltasPermitidas`: número inteiro (`N - ceil(0.75 * N)`)

- **Bloqueio**:
  - `participanteId`: string
  - `nome`: string
  - `atividades`: lista de strings (IDs das duas atividades causadoras)
  - `bloqueadoDesde`: string ISO 8601 com fuso (instante de término da segunda atividade causadora)

- **Arquivo CSV de Frequência**:
  - Delimitador: ponto e vírgula (`;`)
  - Codificação: UTF-8 com BOM
  - Quebra de linha: `\n` (inclusive após a última linha)
  - Cabeçalho: `nome;E1;E2;...;En;frequencia;certificado`
  - Linhas de dados: ordenadas alfabeticamente por nome completo (desempate por `participanteId`), contendo exclusivamente participantes com inscrição `confirmada`. Marcas `P` (presença para qualquer origem válida), `F` (falta após prazo de 2h do término), `-` (prazo aberto ou encontro futuro). Frequência individual com vírgula decimal e 1 casa (`quantidade presenças / total encontros * 100`, calculada sobre o total de encontros inclusive os marcados com `-`). Certificado com `sim` (se atividade encerrada e frequência atingir $\ge 75\%$, sem arredondamento favorável) ou `nao`, independentemente de o certificado ter sido emitido.

## 4. Endpoints
Métodos, caminhos, papéis, corpos e códigos de sucesso conforme `contrato-api.md`:
- `GET /painel/atividades` (organização) → 200 `[LinhaDoPainel]`
- `GET /painel/atividades/:id/sem-chance` (organização) → 200 `[SemChance]`
- `GET /painel/atividades/:id/frequencia.csv` (organização) → 200 `text/csv` (com `Content-Type: text/csv; charset=utf-8` e `Content-Disposition: attachment; filename="frequencia.csv"`, corpo UTF-8 com BOM)
- `GET /painel/bloqueios` (organização) → 200 `[Bloqueio]`
- `DELETE /painel/bloqueios/:participanteId` (organização) → 204 (retorna 404 se o participante não estiver bloqueado)

## 5. Regras
- **R1** (Autenticação de usuário): Todas as rotas do painel M5 exigem o cabeçalho `X-Usuario`. Requisições sem o cabeçalho ou com ID inexistente retornam 401 `USUARIO_DESCONHECIDO`. *(Origem: P-06; `contrato-api.md`)*
- **R2** (Autorização de papel): Requisições efetuadas por usuários autenticados com papel `participante` retornam 403 `SOMENTE_ORGANIZACAO`. A verificação 401 ocorre estritamente antes da verificação 403. *(Origem: P-06; `contrato-api.md`)*
- **R3** (Inclusão, exclusão e ordenação no painel): `GET /painel/atividades` retorna todas as atividades não canceladas (previstas, em andamento ou encerradas), sem paginação ou filtros por query string. Atividades canceladas são excluídas. A ordenação é crescente pelo início do primeiro encontro; em caso de empate, pelo título e depois por `atividadeId`. *(Origem: P-07, P-16, P-17; RN-115, RN-502, decisão humana da Rodada 2)*
- **R4** (Contagens de ocupadas e em espera): `ocupadas` conta as inscrições com status `confirmada` ou `convocada`. `emEspera` conta exclusivamente as inscrições com status `em_espera`. Inscrições canceladas ou expiradas não entram nessas contagens. *(Origem: P-18; RN-503, decisão humana da Rodada 2)*
- **R5** (Cálculo e arredondamento da ocupação): `ocupacaoPercentual` é calculado como `(ocupadas) / vagas * 100`, arredondado para 1 casa decimal (metade para cima). Atividades válidas possuem sempre pelo menos uma vaga, não havendo divisão por zero. *(Origem: P-01, P-18; RN-503, RN-107)*
- **R6** (Frequência por encontro e frequência agregada): A frequência de cada encontro é a razão entre presenças de confirmados e total de inscrições confirmadas, multiplicada por 100. `frequenciaPercentual` do painel é a média das frequências dos encontros já encerrados com confirmados, arredondando apenas o resultado final para uma casa decimal, usando arredondamento de metade para cima. Encontros encerrados sem confirmados têm frequência `null` e são excluídos da média. Se nenhum encontro possuir frequência calculável, retorna `null`. *(Origem: P-02, P-10, P-18, P-19; RN-504, RN-312, decisão humana da Rodada 2)*
- **R7** (Fronteiras temporais de encerramento e prazo de presença): Um encontro considera-se encerrado no seu horário exato de término para fins de frequência no painel. Para "sem chance" e marcação de falta (`F`), o encontro gera falta após expirar o prazo de registro de presença (2 horas após o término); o registro é aceito até o instante exato `fim + 2h`, passando a contar como falta imediatamente após. Toda lógica temporal utiliza exclusivamente o relógio centralizado. *(Origem: P-10; RN-504, RN-505, RN-312, regras gerais de tempo, decisão humana da Rodada 2)*
- **R8** (Cálculo e ordenação de "sem chance"): `GET /painel/atividades/:id/sem-chance` lista participantes com inscrição confirmada que acumularam faltas em encontros encerrados (prazo vencido) de modo que é matematicamente impossível atingir a frequência mínima de 75% (`faltas > faltasPermitidas`, onde `faltasPermitidas = N - ceil(0.75 * N)`). Se nenhum participante estiver nessa condição, retorna 200 com `[]`. A listagem é ordenada alfabeticamente pelo nome completo, com desempate por `participanteId`. *(Origem: P-03, P-12, P-23, P-27; RN-404, RN-505, RN-312, decisão humana da Rodada 2)*
- **R9** (Participantes incluídos e ordenação do CSV): `GET /painel/atividades/:id/frequencia.csv` inclui exclusivamente inscrições atualmente `confirmada`, excluindo `em_espera`, `convocada`, `cancelada` e `expirada`. As linhas são ordenadas alfabeticamente pelo nome completo do participante, com desempate por `participanteId`. *(Origem: P-04, P-13, P-23; RN-506, decisão humana da Rodada 2)*
- **R10** (Estrutura, BOM, delimitador, linhas e cabeçalhos HTTP do CSV): O CSV utiliza codificação UTF-8 com BOM, delimitador ponto e vírgula (`;`), quebra de linha `\n` entre as linhas e também após a última linha, cabeçalho exato `nome;E1;E2;...;En;frequencia;certificado`, e cabeçalhos HTTP exatos `Content-Type: text/csv; charset=utf-8` e `Content-Disposition: attachment; filename="frequencia.csv"`. Os encontros são ordenados cronologicamente por início, com desempate por ID do encontro. *(Origem: P-04, P-21, P-22, P-29; RN-506, decisão humana da Rodada 2)*
- **R11** (Significado de P, F e -): Nas colunas de encontros do CSV, `P` indica presença registrada (para qualquer origem válida: `qr`, `qr_offline` ou `manual`), `F` indica falta após o vencimento do prazo de 2h, e `-` indica prazo aberto ou encontro futuro. *(Origem: P-20; RN-405, RN-506, RN-312)*
- **R12** (Frequência individual e elegibilidade ao certificado no CSV): A frequência individual no CSV é calculada sobre o total de encontros da atividade (inclusive os marcados com `-`), com vírgula decimal e uma casa. A coluna `certificado` exibe `sim` somente quando a atividade estiver encerrada e o participante for elegível a pelo menos 75% de frequência (sem arredondamento favorável), e `nao` nos demais casos, independentemente de o certificado ter sido emitido no M4. *(Origem: P-04, P-19, P-28; RN-401, RN-402, RN-404, RN-506, decisão humana da Rodada 2)*
- **R13** (Atividade inexistente e cancelada): Atividade inexistente em rotas de painel (`/painel/atividades/:id/*`) responde 404 `NAO_ENCONTRADO`. Atividade cancelada responde 200 com `[]` em `/sem-chance` e 200 com CSV contendo BOM e somente o cabeçalho em `/frequencia.csv`. *(Origem: P-08, P-27; RN-502, RN-217, decisão humana da Rodada 2)*
- **R14** (Formação do bloqueio): O bloqueio ocorre quando um participante confirmado acumula duas atividades encerradas com zero presença em ambas. Atividades canceladas não contam. Após um desbloqueio, somente atividades encerradas posteriormente podem contar. As duas primeiras atividades elegíveis em ordem cronológica de encerramento são as causadoras (empate resolvido por `atividadeId`). `bloqueadoDesde` é o instante de término da segunda atividade causadora. Uma única atividade elegível não bloqueia. Inscrições anteriores continuam válidas. *(Origem: P-05, P-24, P-25; RN-507, RN-508, RN-509, decisão humana da Rodada 2)*
- **R15** (Listagem de bloqueios): `GET /painel/bloqueios` lista todos os bloqueios vigentes contendo `participanteId`, `nome`, `atividades` e `bloqueadoDesde`, ordenados alfabeticamente pelo nome completo (desempate por `participanteId`). Se não houver bloqueios, retorna 200 com `[]`. *(Origem: P-05, P-07, P-12; RN-507, RN-508, RN-509, decisão humana da Rodada 2)*
- **R16** (Remoção, histórico e reincidência após desbloqueio): `DELETE /painel/bloqueios/:participanteId` remove o bloqueio e responde 204 (ou 404 se não estiver bloqueado). O desbloqueio apenas libera novas inscrições e listas de espera, mantendo inscrições anteriores intactas. Atividades encerradas antes ou no instante do desbloqueio não podem ser reutilizadas para novo bloqueio; reincidência exige duas novas atividades encerradas após o desbloqueio. *(Origem: P-05, P-14, P-15, P-26; RN-507, RN-508, RN-509)*
- **R17** (Integração com a inscrição e precedência de INSCRICAO_BLOQUEADA): Participante bloqueado tem novas inscrições recusadas com 422 `INSCRICAO_BLOQUEADA`. A ordem estrita de precedência de erros na inscrição é: 1) atividade inexistente (404 `NAO_ENCONTRADO`); 2) atividade cancelada (422 `ATIVIDADE_CANCELADA`); 3) inscrições encerradas (422 `INSCRICOES_ENCERRADAS`); 4) participante bloqueado (422 `INSCRICAO_BLOQUEADA`); 5) participante já inscrito (409 `JA_INSCRITO`); 6) conflito de horário (409 `CONFLITO_DE_HORARIO`); 7) limite de minicursos (422 `LIMITE_DE_MINICURSOS`). Esta integração não autoriza o M5 a modificar a implementação interna do M2. *(Origem: P-25; RN-208, RN-507)*
- **R18** (Uso exclusivo de portas entre módulos): O M5 obtém dados de atividades, inscrições e presenças de M1, M2, M3 e M4 exclusivamente por portas ou interfaces explícitas, sendo vedado o acesso direto a repositórios ou tabelas de outros módulos. *(Origem: P-11, P-18; `AGENTS.md`, `api/AGENTS.md`)*
- **R19** (Telas e restrição visual da interface): A interface web da M5 fornece o painel de atividades, visão "Sem chance de certificado", listagem/desbloqueio de bloqueios e download de CSV. Usuários com papel `participante` não possuem acesso a essas rotas ou telas. *(Origem: P-30, P-31; `app/AGENTS.md`, decisão de escopo)*
- **R20** (Estados visuais, acessibilidade, atualização e download): A interface exibe estados distintos de carregamento, vazio, erro (com código e mensagem), sucesso, bloqueio de ação duplicada, navegação por teclado, atualização manual (permitindo acionamento visível), atualização automática após desbloqueio bem-sucedido, download preservando exatamente os bytes da API (polling periódico não é obrigatório). *(Origem: P-30, P-31; `app/AGENTS.md`, decisão de escopo)*
- **R21** (API e relógio central como fontes de verdade): A interface web busca os dados ao entrar na tela, não recalcula regras de negócio nem utiliza o relógio do navegador como fonte de verdade temporal. Os dados e o tempo provêm exclusivamente da API e do relógio central; avançar o relógio controlado seguido de nova busca reflete imediatamente o novo estado. *(Origem: P-32, decisão técnica da entrevista)*

## 6. Critérios de aceite
1. (R1) Dado um teste percorrendo as cinco rotas do painel (`GET /painel/atividades`, `GET /painel/atividades/:id/sem-chance`, `GET /painel/atividades/:id/frequencia.csv`, `GET /painel/bloqueios`, `DELETE /painel/bloqueios/:participanteId`) utilizando seus respectivos métodos HTTP sem cabeçalho `X-Usuario` ou com ID inexistente, a API responde em todas com status 401 e erro `USUARIO_DESCONHECIDO`.
2. (R2) Dado um teste percorrendo as cinco rotas do painel (`GET /painel/atividades`, `GET /painel/atividades/:id/sem-chance`, `GET /painel/atividades/:id/frequencia.csv`, `GET /painel/bloqueios`, `DELETE /painel/bloqueios/:participanteId`) utilizando seus respectivos métodos HTTP por usuário autenticado com papel `participante`, a API responde em todas com status 403 e erro `SOMENTE_ORGANIZACAO`.
3. (R3) Dado um pedido `GET /painel/atividades`, a API retorna atividades previstas, em andamento e encerradas, exclui canceladas, e aplica a ordenação completa por início do primeiro encontro, título e `atividadeId`, sem paginação.
4. (R4) Dado um cálculo de ocupação e espera, `ocupadas` conta confirmadas e convocadas, e `emEspera` conta exclusivamente `em_espera`.
5. (R5) Dadas atividades com diferentes relações de vagas e ocupação, o sistema calcula `ocupacaoPercentual` com arredondamento para 1 casa decimal (metade para cima), gerando exatamente `66.7` para 2/3, `16.7` para 1/6 e `12.5` para 1/8.
6. (R6) Dada uma atividade sem encontro encerrado, `frequenciaPercentual` retorna `null`; encontro encerrado sem confirmados é excluído da média; encontro encerrado com 1 presença em 6 confirmados retorna `16.7`; dois encontros calculáveis com frequências de 50% e 100% produzem média `75.0` (arredondando apenas o resultado final para uma casa decimal, metade para cima).
7. (R7) Dado o avanço temporal, o instante exato do término já conta para a frequência; o instante exato de `fim + 2h` ainda aceita presença; e imediatamente após `fim + 2h` produz falta (`F`).
8. (R8) Dada uma atividade com quatro encontros permitindo uma falta (`ceil(0.75 * 4) = 3`, `4 - 3 = 1`), uma falta ainda não inclui o participante em “sem chance”, enquanto duas faltas com os respectivos prazos vencidos incluem o participante; no instante exato de `fim + 2h` a ausência ainda não conta, mas imediatamente depois passa a contar; e a listagem de “sem chance” é ordenada por nome e `participanteId`.
9. (R9, R10) Dado um pedido `GET /painel/atividades/:id/frequencia.csv`, a resposta contém exclusivamente inscrições confirmadas (excluindo `em_espera`, `convocada`, `cancelada`, `expirada`), encontros em ordem cronológica (desempate por ID), linhas ordenadas por nome completo e `participanteId`, BOM UTF-8, delimitador `;`, quebra de linha `\n` ao final de cada linha e da última, e cabeçalhos HTTP exatos.
10. (R11, R12) Dado o conteúdo do CSV, as marcas `P` (para qualquer origem de presença), `F` e `-` são geradas corretamente; a frequência individual é calculada sobre o total de encontros (inclusive `-`) com vírgula decimal e uma casa; e a coluna `certificado` exibe `sim` para atividade encerrada e elegibilidade $\ge 75\%$ (sem arredondamento favorável) independentemente da emissão do certificado, e `nao` nos demais casos, gerando linha equivalente a `Carla Mendes Souza;P;P;F;-;50,0;nao`.
11. (R13) Dada uma atividade inexistente em `/painel/atividades/:id/sem-chance` ou `/frequencia.csv`, a API responde 404 `NAO_ENCONTRADO`. Dada uma atividade cancelada, `/sem-chance` responde 200 com `[]` e `/frequencia.csv` responde 200 com BOM e somente o cabeçalho.
12. (R14, R15) Dada uma única atividade encerrada com zero presença, o participante não é bloqueado; a segunda atividade elegível (com exclusão de canceladas) cria o bloqueio com os IDs em `atividades` na ordem correta e `bloqueadoDesde` exatamente igual ao término da segunda atividade; e `GET /painel/bloqueios` lista os bloqueios ordenados ou retorna `[]` quando vazio.
13. (R16) Dado um pedido `DELETE /painel/bloqueios/:participanteId`, a API responde 204 para participante bloqueado e 404 `NAO_ENCONTRADO` para não bloqueado; inscrições anteriores são preservadas; após o desbloqueio, uma nova atividade elegível não bloqueia sozinho, mas a segunda nova atividade elegível bloqueia novamente; e atividades anteriores ou encerradas no próprio instante do desbloqueio não são reutilizadas.
14. (R17, R18) Dada uma tentativa de inscrição por participante bloqueado, a API responde 422 `INSCRICAO_BLOQUEADA`; a precedência completa dos sete erros de inscrição (inexistente, cancelada, encerradas, bloqueado, já inscrito, conflito, limite) é respeitada; e a integração é testada por portas falsas, sem dependência de tabelas de outro módulo.
15. (R19, R20, R21) Dada a interface web da organização, esta busca os dados ao entrar na tela, exibe carregamento, estado vazio, sucesso, erro com código e mensagem, bloqueio de ação duplicada, navegação por teclado, ausência de acesso para participante, atualização manual visível, atualização automática após desbloqueio bem-sucedido, download preservando os bytes da API, sem polling obrigatório, refletindo imediatamente o novo estado após avançar o relógio controlado seguido de nova busca, e sem recalcular regras usando o relógio do navegador.

## 7. Como isto será verificado
A verificação será realizada externamente por testes automatizados (Supertest/Vitest para a API e Vitest/Testing Library com mock para a interface) utilizando `MODO_TESTE=1` e manipulação do relógio central controlado (`PUT /_teste/relogio`), validando endpoints, autorização, métricas, relatórios de sem chance, exportação de CSV byte a byte, bloqueios, desbloqueio e componentes da interface web. As regras P-01 a P-33 são rastreadas integralmente nas seções 5, 6 e 8.

## 8. Fatias de entrega
1. **Fatia 1 — Fundação, Autorização e Portas de Integração**
   - Começa pelo teste falhando para autenticação 401 e autorização 403 em todas as rotas (R1, R2) e configuração das portas de integração com M1, M2, M3 e M4 (R18). Implementa exclusivamente esta fatia e executa os testes relacionados antes de avançar.
2. **Fatia 2 — Painel de Atividades e Ocupação**
   - Começa pelo teste falhando para `GET /painel/atividades`, inclusão/exclusão, ordenação (R3), contagens (R4) e cálculo/arredondamento de ocupação (R5). Implementa exclusivamente esta fatia e executa os testes relacionados antes de avançar.
3. **Fatia 3 — Frequência, Janela Temporal e Sem Chance**
   - Começa pelo teste falhando para frequência percentual, janelas temporais de 2h (R6, R7), relatório de sem chance, ordenação (R8) e tratamento de canceladas/inexistentes (R13). Implementa exclusivamente esta fatia e executa os testes relacionados antes de avançar.
4. **Fatia 4 — Exportação de Frequência em CSV**
   - Começa pelo teste falhando para `GET /painel/atividades/:id/frequencia.csv`, validação por bytes, BOM, delimitador `;`, quebras de linha `\n`, colunas, marcas `P`, `F`, `-`, frequência, certificado e cabeçalhos HTTP (R9, R10, R11, R12). Implementa exclusivamente esta fatia e executa os testes relacionados antes de avançar.
5. **Fatia 5 — Bloqueio, Desbloqueio e Inscrição**
   - Começa pelo teste falhando para criação de bloqueio, listagem, remoção 204/404, reincidência, precedência de 7 erros de inscrição e integração com M2 (R14, R15, R16, R17). Implementa exclusivamente esta fatia e executa os testes relacionados antes de avançar.
6. **Fatia 6 — Interface do Painel**
   - Começa pelo teste falhando para a interface web do painel, carregamento, vazio, sucesso, erro, bloqueio de ação duplicada, navegação por teclado, restrição de acesso e relógio central (R19, R20, R21). Implementa exclusivamente esta fatia e executa os testes relacionados antes de avançar.
7. **Fatia 7 — Interface de Relatórios, Bloqueios e Download**
   - Começa pelo teste falhando para relatórios de sem chance, gerenciamento de bloqueios com atualização pós-desbloqueio e download de CSV preservando bytes (R19, R20, R21). Implementa exclusivamente esta fatia e executa os testes relacionados antes de avançar.

---

## Apêndice A: Matriz Regra → Critério de aceite
- R1 → Critério 1
- R2 → Critério 2
- R3 → Critério 3
- R4 → Critério 4
- R5 → Critério 5
- R6 → Critério 6
- R7 → Critério 7
- R8 → Critério 8
- R9 → Critério 9
- R10 → Critério 9, 10
- R11 → Critério 10
- R12 → Critério 10
- R13 → Critério 11
- R14 → Critério 12
- R15 → Critério 12
- R16 → Critério 13
- R17 → Critério 14
- R18 → Critério 14
- R19 → Critério 15
- R20 → Critério 15
- R21 → Critério 15

## Apêndice B: Matriz Origem → Regra/Seção
- P-01 → R5
- P-02 → R6
- P-03 → R8
- P-04 → R9, R10, R12
- P-05 → R15, R16
- P-06 → R1, R2
- P-07 → R3, R15
- P-08 → R13
- P-09 → R15
- P-10 → R6, R7
- P-11 → R18
- P-12 → R8, R15
- P-13 → R9
- P-14 → R16
- P-15 → R16
- P-16 → R3
- P-17 → R3
- P-18 → R4, R5, R6, R8, R9, R18
- P-19 → R6, R12
- P-20 → R11
- P-21 → R10
- P-22 → R10
- P-23 → R8, R9
- P-24 → R14
- P-25 → R14, R17
- P-26 → R16
- P-27 → R8, R10, R13
- P-28 → R12
- P-29 → R10
- P-30 → R19, R20
- P-31 → R19, R20
- P-32 → R21
- P-33 → Seções 6, 7 e 8
