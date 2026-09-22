# Implementar métodos M4 no cliente API

| | |
|---|---|
| Sessão | `ses_f3a0adb63ffeq6V4zzbzG00VJB` |
| Pasta | Semana Tech/semana-academica |
| Período | 21/09 18:52 → 21/09 18:54 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 18 |
| Tokens de entrada / saída | 60.768 / 5.856 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 1 vermelhas, 2 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 3 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `21/09 18:52` **prompt** — Vamos executar o GREEN da FATIA UI-1 do M4. O RED já está commitado em: app/src/api/client.test.ts Foram adicionados 5 testes e todos falham atualmente porque os métodos M4 ainda não existem: - getCertificados() - getExtrato() - getCertificadoPorCodigo(codigo) - emitirCertificado(atividadeId) Os 13 testes anteriores do cliente permanecem verdes. Use a skill tdd-m4. Consulte: - AGENTS.md - app/AGE…
- `21/09 18:52` carrega a skill **tdd-m4**
- `21/09 18:53` roda `npx vitest run src/api/client.test.ts` → **vermelho** (13 passaram, 5 falharam)
- `21/09 18:53` edita código `app/src/api/types.ts`
- `21/09 18:53` edita código `app/src/api/client.ts` (2×)
- `21/09 18:53` roda `npx vitest run src/api/client.test.ts` → verde (18 passaram)
- `21/09 18:53` roda `npm test` → verde (111 passaram)
