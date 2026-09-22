# Teste TDD G5: extrato recalculado a cada consulta

| | |
|---|---|
| Sessão | `ses_f3a244566ffezVRZiEMQ5dfZhH` |
| Pasta | Semana Tech/semana-academica |
| Período | 21/09 18:25 → 21/09 18:26 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 9 |
| Tokens de entrada / saída | 61.402 / 4.564 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 2 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 1 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 1 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `21/09 18:25` **prompt** — Vamos fechar a lacuna G5 de cobertura do M4: R10 — o extrato deve ser calculado no momento da consulta e refletir certificados emitidos depois de uma consulta anterior. Use a skill tdd-m4. Esta etapa começa como CARACTERIZAÇÃO. NÃO altere produção antes de executar o novo teste. Consulte: - specs/M4-certificados.md - contrato-api.md - AGENTS.md - api/tests/extrato.test.ts - api/src/certificate/ex…
- `21/09 18:25` carrega a skill **tdd-m4**
- `21/09 18:25` edita teste `api/tests/extrato.test.ts`
- `21/09 18:25` roda `npx vitest run tests/extrato.test.ts` → verde (14 passaram) — _teste novo já nasceu verde_
- `21/09 18:25` roda `npm test` → verde (271 passaram)
