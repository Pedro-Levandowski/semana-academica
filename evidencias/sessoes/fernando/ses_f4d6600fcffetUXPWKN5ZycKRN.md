# Implementação da Fatia 5 de M3-presenca.md

| | |
|---|---|
| Sessão | `ses_f4d6600fcffetUXPWKN5ZycKRN` |
| Pasta | semana-academica/api |
| Período | 18/09 00:40 → 18/09 00:48 |
| Modelo | google/gemini-3.5-flash-lite |
| Requisições ao modelo | 40 |
| Tokens de entrada / saída | 407.858 / 12.835 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 3 vermelhas, 2 verdes |
| TDD | 1 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 1 de teste, 5 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `18/09 00:40` **prompt** — Agora vamos para a Fatia 5 de specs/M3-presenca.md (R14, R15, R16 - precedência de erros e listagem). As regras R14 e R15 (precedência de erros) já foram implementadas nas Fatias 2 e 4 — antes de mais nada, confira se os testes de precedência de erros (critérios 18 e 19 da spec) já existem em algum arquivo de teste. Se não existirem testes explícitos para R14 e R15, crie-os em tests/presenca-fati…
- `18/09 00:42` edita teste `tests/presenca-fatia5.test.ts`
- `18/09 00:42` roda `npm --prefix api test -- tests/presenca-fatia5.test.ts` → **vermelho** — _teste novo falhando, como deve ser_
- `18/09 00:42` roda `npm test -- tests/presenca-fatia5.test.ts` → **vermelho**
- `18/09 00:42` roda `npm test -- tests/presenca-fatia5.test.ts` → **vermelho** (3 passaram, 1 falharam)
- `18/09 00:44` edita código `src/application/list-presencas.ts`
- `18/09 00:45` edita código `src/repositories/presenca-repository.ts`
- `18/09 00:46` edita código `src/app.ts` (3×)
- `18/09 00:48` roda `npm test -- tests/presenca-fatia5.test.ts` → verde (4 passaram) — _fecha um ciclo vermelho → verde_
- `18/09 00:48` roda `npm test` → verde (163 passaram)
