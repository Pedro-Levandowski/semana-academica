# TDD na Fatia 1 de M3-presenca.md

| | |
|---|---|
| Sessão | `ses_f4e90cb28ffejxqt4g7GIpZUPP` |
| Pasta | semana-academica/api |
| Período | 17/09 19:14 → 17/09 19:55 |
| Modelo | google/gemini-3.5-flash-lite |
| Requisições ao modelo | 58 |
| Tokens de entrada / saída | 1.000.148 / 22.236 |
| Skills | tdd |
| Subagentes | — |
| Execuções de teste | 7 vermelhas, 9 verdes |
| TDD | 1 ciclo(s) vermelho → verde · 3 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 5 de teste, 5 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 19:14` **prompt** — Use a skill tdd. Vamos implementar a Fatia 1 de specs/M3-presenca.md (R1, R2 e R3 - geração de código e janela de obtenção). Comece só pela R1. Escreva primeiro o teste para essa regra, rode e me mostre que ele falha pelo motivo certo (porque a funcionalidade ainda não existe), e só depois disso escreva o código mínimo para fazer esse teste passar. Não crie nem edite nenhum teste antigo. Um passo…
- `17/09 19:14` carrega a skill **tdd**
- `17/09 19:14` roda `npm --prefix api test` → **vermelho**
- `17/09 19:14` roda `npm test` → **vermelho**
- `17/09 19:14` roda `npm test` → **vermelho**
- `17/09 19:14` roda `npm run test` → **vermelho**
- `17/09 19:16` roda `npm test` → **vermelho**
- `17/09 19:17` roda `npm test` → verde (125 passaram)
- `17/09 19:18` edita teste `tests/presenca-fatia1.test.ts`
- `17/09 19:18` roda `npx vitest run tests/presenca-fatia1.test.ts` → **vermelho** — _teste novo falhando, como deve ser_
- `17/09 19:22` **prompt** — Sim, pode implementar o código mínimo para fazer esse teste passar. Não implemente nada além do necessário para este teste específico.
- `17/09 19:24` edita código `src/repositories/activity-repository.ts`
- `17/09 19:24` edita código `src/application/get-codigo-do-encontro.ts`
- `17/09 19:24` edita código `src/app.ts` (3×)
- `17/09 19:25` roda `npx vitest run tests/presenca-fatia1.test.ts` → verde (1 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 19:26` roda `npm test` → verde (126 passaram)
- `17/09 19:28` **prompt** — Antes de ir para R2, adicione ao mesmo arquivo tests/presenca-fatia1.test.ts mais 3 testes para a R1, cobrindo os critérios de aceite 2, 3 e 4 da spec: (1) exatamente 15 minutos antes do início deve retornar 200 com o código; (2) exatamente 30 minutos depois do início deve retornar 200; (3) 31 minutos depois do início deve retornar 422 FORA_DA_JANELA. Rode os testes e me mostre o resultado.
- `17/09 19:28` edita teste `tests/presenca-fatia1.test.ts`
- `17/09 19:28` roda `npx vitest run tests/presenca-fatia1.test.ts` → verde (4 passaram) — _teste novo já nasceu verde_
- `17/09 19:29` roda `npm test` → verde (129 passaram)
- `17/09 19:49` **prompt** — Agora vamos para a R2 (proibição de código para atividade cancelada). Escreva o teste no mesmo arquivo tests/presenca-fatia1.test.ts, cobrindo o critério de aceite 5: uma tentativa de obter o código de um encontro pertencente a uma atividade cancelada deve retornar 422 ATIVIDADE_CANCELADA. Rode o teste e me mostre o resultado antes de mexer em qualquer código de implementação.
- `17/09 19:49` edita teste `tests/presenca-fatia1.test.ts`
- `17/09 19:51` roda `npx vitest run tests/presenca-fatia1.test.ts` → verde (5 passaram) — _teste novo já nasceu verde_
- `17/09 19:51` roda `npm test` → verde (130 passaram)
- `17/09 19:52` edita teste `tests/presenca-fatia1.test.ts`
- `17/09 19:52` roda `npx vitest run tests/presenca-fatia1.test.ts` → **vermelho** (5 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `17/09 19:53` edita teste `tests/presenca-fatia1.test.ts`
- `17/09 19:53` roda `npx vitest run tests/presenca-fatia1.test.ts` → verde (6 passaram) — _teste novo já nasceu verde_
- `17/09 19:54` roda `npm test` → verde (131 passaram)
