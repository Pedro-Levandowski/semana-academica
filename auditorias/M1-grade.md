## Matriz de rastreabilidade

| Regra | Origem | Teste que comprova | Veredito |
|---|---|---|---|
| R1 | P-01 | api/tests/create-activity.test.ts:294 | COMPROVADA |
| R2 | P-01 | api/tests/create-activity.test.ts:323 | COMPROVADA |
| R3 | P-14 | api/tests/encounter-rules.test.ts:16 | COMPROVADA |
| R4 | P-14 | api/tests/encounter-rules.test.ts:138 | COMPROVADA |
| R5 | P-15 | api/tests/encounter-rules.test.ts:233 | COMPROVADA |
| R6 | P-15 | api/tests/encounter-rules.test.ts:256 | COMPROVADA |
| R7 | P-02, P-13 | api/tests/capacity-conflict.test.ts:16 | COMPROVADA |
| R8 | P-03, P-16 | api/tests/capacity-conflict.test.ts:89 | COMPROVADA |
| R9 | P-07 | api/tests/activity-output.test.ts:17 | COMPROVADA |
| R10 | P-07, P-17 | api/tests/activity-output.test.ts:72 | COMPROVADA |
| R11 | P-05 | api/tests/update-activity.test.ts:16 | COMPROVADA |
| R12 | P-17 | api/tests/update-activity.test.ts:80 | COMPROVADA |
| R13 | P-06 | api/tests/cancel-activity.test.ts:54 | COMPROVADA |
| R14 | P-05, P-06 | api/tests/cancel-activity.test.ts:124 | COMPROVADA |
| R15 | P-04 | api/tests/activity-status.test.ts:34 | COMPROVADA |
| R16 | P-19 | api/tests/cancel-activity-effects.test.ts:55 | COMPROVADA |
| R17 | P-08 | api/tests/activity-list-order.test.ts:16 | COMPROVADA |
| R18 | P-16 | api/tests/cancel-activity-effects.test.ts:91 | COMPROVADA |
| R19 | P-08 | api/tests/activity-filters.test.ts:16 | COMPROVADA |
| R20 | P-08, P-16 | api/tests/activity-filters.test.ts:122 | COMPROVADA |
| R21 | P-19 | api/tests/activity-output.test.ts:100 | COMPROVADA |
| R22 | P-09 | api/tests/app.test.ts:37 | COMPROVADA |
| R23 | P-10, P-20 | api/tests/activity-detail.test.ts:44 | COMPROVADA |
| R24 | P-11, P-22 | api/tests/create-activity.test.ts:17 | COMPROVADA |
| R25 | P-11 | api/tests/create-activity.test.ts:73 | COMPROVADA |
| R26 | P-12 | api/tests/create-activity.test.ts:108 | COMPROVADA |
| R27 | P-18 | api/tests/cancel-activity-effects.test.ts:16 | COMPROVADA |
| R28 | P-18 | api/tests/cancel-activity.test.ts:192 | COMPROVADA |
| R29 | P-22 | api/tests/create-activity.test.ts:226 | COMPROVADA |
| R30 | P-22 | api/tests/encounter-rules.test.ts:138 | COMPROVADA |
| R31 | P-22 | api/tests/create-activity.test.ts:109 | COMPROVADA |
| R32 | P-22, P-23 | api/tests/reset.test.ts:1 | COMPROVADA |
| R33 | P-23 | api/tests/app.test.ts:100 | COMPROVADA |
| R34 | P-23 | api/tests/app.test.ts:1 | COMPROVADA |
| R35 | Issue #1 | api/tests/migration.test.ts:8 | COMPROVADA |
| R36 | P-24 | app/src/App.test.tsx | COMPROVADA |
| R37 | P-25 | app/src/App.test.tsx | COMPROVADA |
| R38 | P-26 | app/src/App.test.tsx | COMPROVADA |
| R39 | P-28 | app/src/App.test.tsx | COMPROVADA |
| R40 | P-27 | app/src/App.test.tsx | COMPROVADA |
| R41 | projeto.json | projeto.json:1 | COMPROVADA |

## Suíte

- `npm --prefix api test` → Test Files 15 passed (15), Tests 125 passed (125)
- `npm --prefix app test -- --run` → Test Files 2 passed (2), Tests 66 passed (66)

## Achados

Nenhum achado pendente. Todas as regras da spec possuem origem rastreada e testes automatizados correspondentes com 100% de aprovação na API e na interface.

## Veredito

O módulo M1 está totalmente conforme a spec `specs/M1-grade.md`, com todas as 41 regras rigorosamente comprovadas por testes automatizados aprovados. Aprovado sem ressalvas.
