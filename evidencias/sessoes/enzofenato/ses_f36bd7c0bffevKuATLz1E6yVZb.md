# Presença offline M3 no cálculo M4

| | |
|---|---|
| Sessão | `ses_f36bd7c0bffevKuATLz1E6yVZb` |
| Pasta | Semana Tech/semana-academica |
| Período | 22/09 10:16 → 22/09 10:20 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 16 |
| Tokens de entrada / saída | 63.399 / 8.417 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 2 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 1 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 1 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `22/09 10:16` **prompt** — Use a skill `.opencode/skills/tdd-m4/SKILL.md` nesta tarefa e siga o fluxo TDD definido nela. Objetivo desta sessão: verificar e, se necessário, cobrir por teste do M4 o cenário em que uma presença registrada pelo fluxo offline do M3 deve ser contabilizada no cálculo de frequência usado para emissão de certificado. IMPORTANTE: - NÃO consulte, abra, leia ou altere `requisitos-envolvidos.md` nem qu…
- `22/09 10:16` carrega a skill **tdd-m4**
- `22/09 10:19` **prompt** — Continue usando a skill `.opencode/skills/tdd-m4/SKILL.md`. Autorizo agora SOMENTE a criação do teste de caracterização proposto: `api/tests/certificado-g3-presenca-offline.test.ts` Objetivo: comprovar pelo contrato HTTP real que uma presença registrada pelo fluxo offline do M3 (`lidoEm`, resultando em `origem: "qr_offline"`) é contabilizada pelo M4 para a frequência necessária à emissão do certi…
- `22/09 10:19` edita teste `api/tests/certificado-g3-presenca-offline.test.ts`
- `22/09 10:19` roda `npx vitest run tests/certificado-g3-presenca-offline.test.ts 2>&1` → verde (1 passaram) — _teste novo já nasceu verde_
- `22/09 10:19` roda `npm test 2>&1 | Select-Object -Last 30` → verde (272 passaram)
