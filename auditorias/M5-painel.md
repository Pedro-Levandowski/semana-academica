## Matriz de rastreabilidade

| Regra | Origem | Teste que comprova | Veredito |
|---|---|---|---|
| R1 | P-06 resolvida em `entrevistas/M5-painel.md:45-49` | `api/tests/painel-fatia1.test.ts:28-50` percorre as cinco rotas sem usuário e com usuário inexistente, verificando 401 e `USUARIO_DESCONHECIDO` | COMPROVADA |
| R2 | P-06 resolvida em `entrevistas/M5-painel.md:45-49` | `api/tests/painel-fatia1.test.ts:54-68` percorre as cinco rotas com participante, verificando 403 e `SOMENTE_ORGANIZACAO` | COMPROVADA |
| R3 | P-07, P-16 e P-17 resolvidas em `entrevistas/M5-painel.md:53-57`, `entrevistas/M5-painel.md:125-129` e `entrevistas/M5-painel.md:133-137` | `api/tests/painel-fatia2.test.ts:16-102`, `api/tests/painel-fatia2.test.ts:114-182` e `api/tests/painel-fatia2.test.ts:185-200` verificam primeiro encontro, desempates, exclusão de cancelada e ausência de filtros/paginação | COMPROVADA |
| R4 | P-18 resolvida em `entrevistas/M5-painel.md:141-152` | `api/tests/painel-fatia2.test.ts:24-95` cria inscrições em todos os estados e `api/tests/painel-fatia2.test.ts:118-182` verifica `ocupadas` e `emEspera` | COMPROVADA |
| R5 | P-01 e P-18 resolvidas em `entrevistas/M5-painel.md:5` e `entrevistas/M5-painel.md:141-152` | `api/tests/painel-fatia2.test.ts:118-182` verifica, entre outros resultados, `66.7`, `16.7` e `12.5` | COMPROVADA |
| R6 | P-02, P-10, P-18 e P-19 resolvidas em `entrevistas/M5-painel.md:13`, `entrevistas/M5-painel.md:77-80`, `entrevistas/M5-painel.md:141-152` e `entrevistas/M5-painel.md:156-160` | `api/tests/painel-fatia3.test.ts:147-158` verifica `null`, exclusão de encontro sem confirmados, `16.7` e média `75` | COMPROVADA |
| R7 | P-10 resolvida em `entrevistas/M5-painel.md:77-80` | `api/tests/painel-fatia3.test.ts:66-68`, `api/tests/painel-fatia3.test.ts:133-135` e `api/tests/painel-fatia3.test.ts:147-201` exercitam término exato, `fim + 2h` exato e instante posterior com relógio controlado | COMPROVADA |
| R8 | P-03, P-12, P-23 e P-27 resolvidas em `entrevistas/M5-painel.md:21`, `entrevistas/M5-painel.md:93`, `entrevistas/M5-painel.md:192-196` e `entrevistas/M5-painel.md:231-240` | `api/tests/painel-fatia3.test.ts:161-201` verifica limite de faltas, fronteira temporal, conteúdo e ordenação; `api/tests/painel-fatia3.test.ts:204-215` verifica cancelada, vazio e inexistente | COMPROVADA |
| R9 | P-04, P-13 e P-23 resolvidas em `entrevistas/M5-painel.md:29`, `entrevistas/M5-painel.md:101-102` e `entrevistas/M5-painel.md:192-196` | `api/tests/painel-fatia4.test.ts:59-67` cria todos os estados de inscrição e `api/tests/painel-fatia4.test.ts:155-177` compara o CSV completo | COMPROVADA |
| R10 | P-04, P-21, P-22 e P-29 resolvidas em `entrevistas/M5-painel.md:29`, `entrevistas/M5-painel.md:176-180`, `entrevistas/M5-painel.md:184-188` e `entrevistas/M5-painel.md:256-263` | `api/tests/painel-fatia4.test.ts:23-57` cria encontros fora de ordem e com empate; `api/tests/painel-fatia4.test.ts:155-177` verifica cabeçalhos HTTP, BOM, delimitador, ordem, conteúdo e quebra final | COMPROVADA |
| R11 | P-20 resolvida em `entrevistas/M5-painel.md:164-172` | `api/tests/painel-fatia4.test.ts:85-107` cria presenças `manual`, `qr` e `qr_offline`; `api/tests/painel-fatia4.test.ts:196-209` verifica que todas são exportadas como `P`; `api/tests/painel-fatia4.test.ts:155-177` verifica também `F` e `-` | COMPROVADA |
| R12 | P-04, P-19 e P-28 resolvidas em `entrevistas/M5-painel.md:29`, `entrevistas/M5-painel.md:156-160` e `entrevistas/M5-painel.md:245-251` | `api/tests/painel-fatia4.test.ts:180-193` verifica `sim/nao` para 75% e 50%; `api/tests/painel-fatia4.test.ts:109-124` e `api/tests/painel-fatia4.test.ts:212-228` verificam frequência bruta de 74,95% exibida como `75,0`, mas ainda inelegível | COMPROVADA |
| R13 | P-08 e P-27 resolvidas em `entrevistas/M5-painel.md:61-65` e `entrevistas/M5-painel.md:231-240` | `api/tests/painel-fatia3.test.ts:204-215` e `api/tests/painel-fatia4.test.ts:231-252` verificam cancelada e inexistente nas duas rotas | COMPROVADA |
| R14 | P-05, P-24 e P-25 resolvidas em `entrevistas/M5-painel.md:37`, `entrevistas/M5-painel.md:200-204` e `entrevistas/M5-painel.md:208-219` | `api/tests/painel-fatia5.test.ts:261-307` verifica formação, exclusões, ordem das causadoras, desempate e instante do bloqueio | COMPROVADA |
| R15 | P-05, P-07 e P-12 resolvidas em `entrevistas/M5-painel.md:37`, `entrevistas/M5-painel.md:53-57` e `entrevistas/M5-painel.md:93` | `api/tests/painel-fatia5.test.ts:261-307` verifica forma e ordenação; `api/tests/painel-fatia5.test.ts:311-338` verifica lista vazia | COMPROVADA |
| R16 | P-05, P-14, P-15 e P-26 resolvidas em `entrevistas/M5-painel.md:37`, `entrevistas/M5-painel.md:109-113`, `entrevistas/M5-painel.md:117-121` e `entrevistas/M5-painel.md:223-227` | `api/tests/painel-fatia5.test.ts:342-478` verifica 204, 404, preservação das inscrições, corte temporal e reincidência com duas atividades novas | COMPROVADA |
| R17 | P-25 resolvida em `entrevistas/M5-painel.md:208-219` | `api/tests/painel-fatia5-r17.test.ts:11-89` verifica bloqueio e liberação; `api/tests/painel-fatia5-r17.test.ts:100-308` verifica os sete erros na precedência exigida | COMPROVADA |
| R18 | P-11 e P-18 resolvidas em `entrevistas/M5-painel.md:85-89` e `entrevistas/M5-painel.md:141-152` | `api/tests/painel-portas.test.ts:9-72` compõe o retrato somente por portas falsas de M1, M2 e M3; `api/tests/painel-portas.test.ts:74-84` impede importação de repositórios pelo adaptador do M5; a composição usa as portas em `api/src/app.ts:81-88` | COMPROVADA |
| R19 | P-30 e P-31 resolvidas em `entrevistas/M5-painel.md:268-280` | `app/src/M5Painel.test.tsx:36-73`, `app/src/M5SemChance.test.tsx:34-48`, `app/src/M5SemChance.test.tsx:237-251`, `app/src/M5Bloqueios.test.tsx:59-71` e `app/src/M5Csv.test.tsx:74-103` cobrem as telas, ações e restrição visual/direta | COMPROVADA |
| R20 | P-30 e P-31 resolvidas em `entrevistas/M5-painel.md:268-280` | `app/src/M5Painel.test.tsx:76-263`, `app/src/M5SemChance.test.tsx:50-235`, `app/src/M5Bloqueios.test.tsx:74-171` e `app/src/M5Csv.test.tsx:43-159` cobrem carregamento, vazio, sucesso, erro, teclado, duplicação, reconsulta automática e preservação dos bytes | COMPROVADA |
| R21 | P-32 resolvida em `entrevistas/M5-painel.md:284-287` | `app/src/M5Painel.test.tsx:265-321` controla o endpoint de relógio, avança o instante, executa nova busca e mantém o relógio do navegador divergente; `app/src/hooks/usePainelAtividades.ts:15-47` apenas busca e preserva a resposta da API | COMPROVADA |

## Suíte

`npm --prefix api test` → `Test Files 31 passed (31)`; `Tests 202 passed (202)`; código de saída 0.

`npm --prefix app test` → `Test Files 12 passed (12)`; `Tests 133 passed (133)`; código de saída 0.

Os comandos executados são exatamente os definidos em `projeto.json:8-11`. A suíte da interface emitiu avisos de atualizações React não envolvidas em `act(...)` em testes preexistentes de `src/App.test.tsx`, sem falhas e sem alterar o resultado das provas do M5.

## Achados

Nenhum achado de **SEM PROVA**, **PROVA FRACA**, **SEM ORIGEM** ou **NÃO CONTRATADO** permaneceu após a reauditoria. As 21 regras foram conferidas individualmente contra a entrevista, a spec, os testes executados e os trechos necessários da implementação.

## Veredito

O M5 pode ser aceito: R1–R21 possuem origem resolvida e prova automatizada compatível com a regra, e as duas suítes definidas pelo projeto encerraram integralmente verdes.
