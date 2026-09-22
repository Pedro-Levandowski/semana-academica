# Lacuna G3: presença M3 na emissão de certificado

| | |
|---|---|
| Sessão | `ses_f4311ddfcffeEz2plb6LieHY8l` |
| Pasta | Semana Tech/semana-academica |
| Período | 20/09 00:48 → 20/09 00:51 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 16 |
| Tokens de entrada / saída | 75.262 / 9.888 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 2 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 1 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 1 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `20/09 00:48` **prompt** — Vamos fechar a lacuna G3 da revisão de cobertura do M4: Presença manual/offline do M3 deve ser contabilizada na emissão do certificado. Use a skill tdd-m4. Esta etapa começa como CARACTERIZAÇÃO/PROVA da integração M3 → M4. NÃO altere código de produção antes de executar os novos testes. Consulte: - specs/M4-certificados.md - contrato-api.md - AGENTS.md - testes atuais de certificado - implementaç…
- `20/09 00:48` carrega a skill **tdd-m4**
- `20/09 00:50` edita teste `api/tests/certificado-g3-presenca-manual.test.ts`
- `20/09 00:50` roda `npx vitest run tests/certificado-g3-presenca-manual.test.ts 2>&1` → verde (1 passaram) — _teste novo já nasceu verde_
- `20/09 00:50` roda `npm test 2>&1 | Select-Object -Last 25` → verde (268 passaram)
