## Matriz de rastreabilidade

| Regra | Origem | Teste que comprova | Veredito |
|---|---|---|---|
| R1 | P-06; contrato-api.md | api/tests/painel-fatia1.test.ts:28 | COMPROVADA |
| R2 | P-06; contrato-api.md | api/tests/painel-fatia1.test.ts:54 | COMPROVADA |
| R3 | P-07, P-16, P-17 | api/tests/painel-fatia2.test.ts:114 | COMPROVADA |
| R4 | P-18 | api/tests/painel-fatia2.test.ts:114 | COMPROVADA |
| R5 | P-01, P-18 | api/tests/painel-fatia2.test.ts:114 | COMPROVADA |
| R6 | P-02, P-10, P-18, P-19 | api/tests/painel-fatia3.test.ts:147 | COMPROVADA |
| R7 | P-10 | api/tests/painel-fatia3.test.ts:147; api/tests/painel-fatia4.test.ts:115 | COMPROVADA |
| R8 | P-03, P-12, P-23, P-27 | api/tests/painel-fatia3.test.ts:161 | COMPROVADA |
| R9 | P-04, P-13, P-23 | api/tests/painel-fatia4.test.ts:115 | COMPROVADA |
| R10 | P-04, P-21, P-22, P-29 | api/tests/painel-fatia4.test.ts:115 | COMPROVADA |
| R11 | P-20 | api/tests/painel-fatia4.test.ts:115 | COMPROVADA |
| R12 | P-04, P-19, P-28 | api/tests/painel-fatia4.test.ts:115; api/tests/painel-fatia4.test.ts:140 | COMPROVADA |
| R13 | P-08, P-27 | api/tests/painel-fatia3.test.ts:204; api/tests/painel-fatia4.test.ts:156 | COMPROVADA |
| R14 | P-05, P-24, P-25 | api/tests/painel-fatia5.test.ts:261 | COMPROVADA |
| R15 | P-05, P-07, P-12 | api/tests/painel-fatia5.test.ts:261; api/tests/painel-fatia5.test.ts:311 | COMPROVADA |
| R16 | P-05, P-14, P-15, P-26 | api/tests/painel-fatia5.test.ts:342 | COMPROVADA |
| R17 | P-25 | api/tests/painel-fatia5-r17.test.ts:11; api/tests/painel-fatia5-r17.test.ts:100 | COMPROVADA |
| R18 | P-11, P-18; AGENTS.md; api/AGENTS.md | api/tests/painel-fatia5-r17.test.ts:11; api/tests/painel-fatia5-r17.test.ts:100 | COMPROVADA |
| R19 | P-30, P-31; app/AGENTS.md | app/src/M5Painel.test.tsx; app/src/M5SemChance.test.tsx; app/src/M5Bloqueios.test.tsx; app/src/M5Csv.test.tsx | COMPROVADA |
| R20 | P-30, P-31; app/AGENTS.md | app/src/M5Painel.test.tsx; app/src/M5SemChance.test.tsx; app/src/M5Bloqueios.test.tsx; app/src/M5Csv.test.tsx | COMPROVADA |
| R21 | P-32 | app/src/M5Painel.test.tsx:98; app/src/M5Painel.test.tsx:210; app/src/M5SemChance.test.tsx:165 | COMPROVADA |

## Verificações executadas

- `npm --prefix api test` — 30 arquivos e 196 testes aprovados.
- `npm --prefix app test -- --run` — 7 arquivos e 91 testes aprovados.
- Testes específicos da interface M5 — 5 arquivos e 25 testes aprovados.
- `npm --prefix app run typecheck` — aprovado sem erros.
- `npm --prefix app run build` — build de produção aprovado.
- `npm --prefix api run typecheck` — mantém somente 7 erros de tipagem preexistentes em testes de M1, todos relativos a `app.close`; nenhum erro pertence ao M5 e toda a suíte de execução da API está verde.

## Achados

Nenhum achado funcional pendente no M5. As 21 regras da especificação possuem origem rastreada e cobertura automatizada na API ou na interface.

A única ressalva do repositório é a dívida de tipagem preexistente em sete usos de `app.close` nos testes `cancel-activity-effects.test.ts`, `cancel-activity.test.ts` e `update-activity.test.ts`. Esses arquivos pertencem ao M1, não foram alterados pelo M5 e seus testes de execução passam.

## Veredito

O módulo M5 está conforme a especificação `specs/M5-painel.md` e o contrato da API. As rotas, métricas, relatório de participantes sem chance, exportação CSV, bloqueios, desbloqueio, reincidência, integração com inscrições e interface administrativa foram comprovados por testes automatizados. Aprovado, com registro separado da ressalva de tipagem legada fora do escopo do M5.
