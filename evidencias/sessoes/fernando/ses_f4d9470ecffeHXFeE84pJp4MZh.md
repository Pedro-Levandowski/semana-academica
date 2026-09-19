# Testes de presença manual na Fatia 4

| | |
|---|---|
| Sessão | `ses_f4d9470ecffeHXFeE84pJp4MZh` |
| Pasta | semana-academica/api |
| Período | 17/09 23:49 → 18/09 00:34 |
| Modelo | google/gemini-3.5-flash-lite |
| Requisições ao modelo | 42 |
| Tokens de entrada / saída | 729.017 / 34.400 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 5 vermelhas, 8 verdes |
| TDD | 3 ciclo(s) vermelho → verde · 1 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 5 de teste, 10 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 23:49` **prompt** — Agora vamos para a Fatia 4 de specs/M3-presenca.md (R6, R7, R8 - presença manual e limites). Comece pela R6 (obrigatoriedade de justificativa). Escreva o teste em um novo arquivo tests/presenca-fatia4.test.ts, cobrindo o critério de aceite 9: uma tentativa de presença manual (POST /encontros/:id/presencas/manual) sem justificativa ou com justificativa com menos de 10 caracteres deve retornar 422 …
- `17/09 23:50` edita teste `tests/presenca-fatia4.test.ts`
- `17/09 23:50` roda `npx vitest run tests/presenca-fatia4.test.ts` → **vermelho** — _teste novo falhando, como deve ser_
- `17/09 23:54` **prompt** — Sim, pode implementar o código mínimo para fazer esse teste passar. Não implemente nada além do necessário para este teste específico (ainda não implemente a verificação de inscrição confirmada, janela ou limite de manuais — isso vem nas próximas regras).
- `17/09 23:54` edita código `src/application/register-presenca-manual.ts`
- `17/09 23:54` edita código `src/app.ts` (3×)
- `17/09 23:55` roda `npx vitest run tests/presenca-fatia4.test.ts` → verde (1 passaram) — _fecha um ciclo vermelho → verde_
- `17/09 23:55` roda `npm test` → verde (138 passaram)
- `18/09 00:13` **prompt** — Agora vamos para a R7 (janela para presença manual). Escreva o teste em tests/presenca-fatia4.test.ts, cobrindo o critério de aceite 10: uma tentativa de presença manual fora do período permitido (antes da janela normal de 15 minutos antes do início, ou mais de 2 horas depois do fim do encontro) deve retornar 422 FORA_DA_JANELA. Rode o teste e me mostre se falha ou passa antes de implementar qual…
- `18/09 00:14` edita teste `tests/presenca-fatia4.test.ts`
- `18/09 00:14` roda `npx vitest run tests/presenca-fatia4.test.ts` → **vermelho** (1 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `18/09 00:14` edita código `src/application/register-presenca-manual.ts`
- `18/09 00:14` roda `npx vitest run tests/presenca-fatia4.test.ts` → verde (2 passaram) — _fecha um ciclo vermelho → verde_
- `18/09 00:14` roda `npm test` → verde (146 passaram)
- `18/09 00:17` **prompt** — Antes da R8, precisamos completar um requisito pendente da R6/R9 na presença manual: falta a checagem de inscrição confirmada. Adicione um teste em tests/presenca-fatia4.test.ts cobrindo o caso: presença manual lançada para um participante sem inscrição confirmada na atividade deve retornar 403 NAO_INSCRITO. Essa checagem deve seguir a ordem de precedência da R15: justificativa (422) primeiro, de…
- `18/09 00:17` edita teste `tests/presenca-fatia4.test.ts`
- `18/09 00:17` roda `npx vitest run tests/presenca-fatia4.test.ts` → **vermelho** (2 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `18/09 00:17` edita código `src/application/register-presenca-manual.ts`
- `18/09 00:17` edita código `src/app.ts`
- `18/09 00:17` roda `npx vitest run tests/presenca-fatia4.test.ts` → **vermelho** (2 passaram, 1 falharam)
- `18/09 00:18` edita teste `tests/presenca-fatia4.test.ts`
- `18/09 00:19` roda `npx vitest run tests/presenca-fatia4.test.ts` → verde (3 passaram) — _teste novo já nasceu verde_
- `18/09 00:19` roda `npm test` → verde (147 passaram)
- `18/09 00:28` **prompt** — Agora vamos para a última regra da Fatia 4: R8 (limite de presenças manuais). Adicione um teste em tests/presenca-fatia4.test.ts cobrindo o critério de aceite 11: uma tentativa de presença manual que excede o limite de 10% das inscrições confirmadas daquele encontro (arredondando para cima) deve retornar 422 LIMITE_DE_MANUAIS. Use um cenário concreto, por exemplo 5 participantes confirmados (limi…
- `18/09 00:31` edita teste `tests/presenca-fatia4.test.ts`
- `18/09 00:31` roda `npx vitest run tests/presenca-fatia4.test.ts` → **vermelho** (3 passaram, 1 falharam) — _teste novo falhando, como deve ser_
- `18/09 00:33` edita código `src/repositories/presenca-repository.ts`
- `18/09 00:33` edita código `src/repositories/inscricao-repository.ts`
- `18/09 00:33` edita código `src/application/register-presenca-manual.ts`
- `18/09 00:33` roda `npx vitest run tests/presenca-fatia4.test.ts` → verde (4 passaram) — _fecha um ciclo vermelho → verde_
- `18/09 00:33` roda `npm test` → verde (159 passaram)
