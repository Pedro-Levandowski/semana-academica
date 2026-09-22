# Caracterização G2 contrato POST certificado

| | |
|---|---|
| Sessão | `ses_f43b67804ffeI87u6CosU84z0h` |
| Pasta | Semana Tech/semana-academica |
| Período | 19/09 21:48 → 19/09 21:50 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 17 |
| Tokens de entrada / saída | 63.486 / 5.874 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 1 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 1 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 2 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `19/09 21:48` **prompt** — Vamos fechar a lacuna G2 da revisão de cobertura do M4: Contrato HTTP de POST /atividades/:id/certificado — 401, 403 e 404. Use a skill tdd-m4. Esta etapa é de CARACTERIZAÇÃO/PROVA do contrato. NÃO altere código de produção antes de executar os testes. Consulte: - specs/M4-certificados.md - contrato-api.md - AGENTS.md - testes atuais do M4 - implementação atual da rota POST /atividades/:id/certif…
- `19/09 21:48` carrega a skill **tdd-m4**
- `19/09 21:49` edita teste `api/tests/certificado-contrato-http.test.ts` (2×)
- `19/09 21:49` roda `npx vitest run tests/certificado-contrato-http.test.ts` → verde (6 passaram) — _teste novo já nasceu verde_
