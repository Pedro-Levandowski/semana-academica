# TDD fase RED: testes GET /extrato

| | |
|---|---|
| Sessão | `ses_f44ddab84ffeE3p095ymJAuBKx` |
| Pasta | Semana Tech/semana-academica |
| Período | 19/09 16:26 → 19/09 16:32 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 24 |
| Tokens de entrada / saída | 192.014 / 37.355 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 1 vermelhas, 2 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 1 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `19/09 16:26` **prompt** — Vamos iniciar a Fatia 4 do M4 — GET /extrato — usando TDD. Use a skill tdd-m4. Consulte: - specs/M4-certificados.md - contrato-api.md - AGENTS.md - implementação atual dos módulos M1, M2, M3 e M4 - testes existentes do projeto NÃO consulte requisitos-envolvidos.md. A especificação já contém as decisões de negócio válidas. Estamos exclusivamente na fase RED. Implemente SOMENTE testes automatizados…
- `19/09 16:26` carrega a skill **tdd-m4**
- `19/09 16:29` roda `npm --prefix api test 2>&1 | Select-Object -Last 40` → verde (240 passaram)
- `19/09 16:31` edita teste `api/tests/extrato.test.ts`
- `19/09 16:31` roda `npx vitest run tests/extrato.test.ts 2>&1 | Select-Object -Last 90` → **vermelho** — _teste novo falhando, como deve ser_
- `19/09 16:32` roda `npx vitest run tests/extrato.test.ts 2>&1 | Select-Object -First 100` → verde
