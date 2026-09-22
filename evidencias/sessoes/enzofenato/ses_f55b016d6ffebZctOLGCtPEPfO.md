# Ciclo TDD para regra R7 de abreviação

| | |
|---|---|
| Sessão | `ses_f55b016d6ffebZctOLGCtPEPfO` |
| Pasta | Semana Tech/semana-academica |
| Período | 16/09 10:02 → 16/09 10:27 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 40 |
| Tokens de entrada / saída | 172.043 / 37.236 |
| Skills | tdd |
| Subagentes | — |
| Execuções de teste | 9 vermelhas, 2 verdes |
| TDD | 1 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 1 vez(es) teste e código juntos |
| Arquivos editados | 2 de teste, 9 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `16/09 10:02` **prompt** — Use a skill tdd. Inicie um novo ciclo TDD do M4 exclusivamente para a regra R7 de specs/M4-certificados.md. Objetivo desta etapa: somente RED. R7 trata da abreviação do nome na verificação pública. Use exatamente os critérios e exemplos definidos na spec. A regra deve considerar: - primeiro nome completo; - demais nomes abreviados pela inicial seguida de ponto; - partículas de, da, do, das e dos …
- `16/09 10:02` carrega a skill **tdd**
- `16/09 10:04` edita teste `api/tests/abreviar-nome.test.ts`
- `16/09 10:05` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → **vermelho** — _teste novo falhando, como deve ser_
- `16/09 10:07` **prompt** — Agora execute a fase GREEN do ciclo TDD da regra R7. Use specs/M4-certificados.md como fonte de verdade e os testes RED existentes em api/tests/abreviar-nome.test.ts. Objetivo: implementar somente o mínimo necessário para fazer todos os testes de R7 passarem. Faça: 1. crie api/src/certificate/abreviar-nome.ts; 2. implemente a função de abreviação conforme R7: - primeiro nome permanece completo; -…
- `16/09 10:07` edita código `api/src/certificate/abreviar-nome.ts`
- `16/09 10:07` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → **vermelho** (11 passaram, 3 falharam)
- `16/09 10:08` edita código `api/src/certificate/abreviar-nome.ts`
- `16/09 10:08` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → **vermelho** (11 passaram, 3 falharam)
- `16/09 10:09` edita código `api/src/certificate/abreviar-nome.ts`
- `16/09 10:09` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → **vermelho** (12 passaram, 2 falharam)
- `16/09 10:09` edita código `api/src/certificate/abreviar-nome.ts`
- `16/09 10:09` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → **vermelho** (13 passaram, 1 falharam)
- `16/09 10:10` edita código `api/src/certificate/abreviar-nome.ts`
- `16/09 10:10` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → **vermelho** (13 passaram, 1 falharam)
- `16/09 10:11` edita código `api/src/certificate/abreviar-nome.ts`
- `16/09 10:11` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → **vermelho** (11 passaram, 3 falharam)
- `16/09 10:12` edita código `api/src/certificate/abreviar-nome.ts` (2×)
- `16/09 10:14` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → verde (14 passaram) — _fecha um ciclo vermelho → verde_
- `16/09 10:14` roda `npx vitest run 2>&1` → **vermelho** (154 passaram, 3 falharam)
- `16/09 10:17` **prompt** — Agora execute a fase REFACTOR do ciclo TDD da regra R7. Revise exclusivamente: - api/src/certificate/abreviar-nome.ts - api/tests/abreviar-nome.test.ts Objetivos: 1. verificar se a implementação está simples, legível e fiel exclusivamente à R7 de specs/M4-certificados.md; 2. verificar por que o RED havia reportado 11 testes e agora existem 14 testes; 3. confirmar que os 14 testes pertencem ao esc…
- `16/09 10:26` edita código `api/src/certificate/abreviar-nome.ts`
- `16/09 10:26` edita teste `api/tests/abreviar-nome.test.ts`
- `16/09 10:26` roda `npx vitest run tests/abreviar-nome.test.ts 2>&1` → verde (14 passaram) — _teste e código mudaram juntos: não houve vermelho para ver_
- `16/09 10:27` roda `npx vitest run 2>&1` → **vermelho** (154 passaram, 3 falharam)
