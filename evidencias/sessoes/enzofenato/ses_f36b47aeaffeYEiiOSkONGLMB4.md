# Teste de estabilidade do código após reinício

| | |
|---|---|
| Sessão | `ses_f36b47aeaffeYEiiOSkONGLMB4` |
| Pasta | Semana Tech/semana-academica |
| Período | 22/09 10:26 → 22/09 10:32 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 22 |
| Tokens de entrada / saída | 90.111 / 10.665 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 1 vermelhas, 2 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 1 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 2 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `22/09 10:26` **prompt** — Use a skill `.opencode/skills/tdd-m4/SKILL.md` nesta tarefa. Objetivo: verificar se o código de um certificado já emitido permanece o mesmo após reinicializar a aplicação usando o mesmo banco persistente, e identificar se já existe teste do M4 que comprove isso. IMPORTANTE: - NÃO consulte, abra, leia ou altere `requisitos-envolvidos.md` nem documentos oficiais/confidenciais. - NÃO invente regra d…
- `22/09 10:28` **prompt** — Continue usando a skill `.opencode/skills/tdd-m4/SKILL.md`. Autorizo SOMENTE a criação do teste de caracterização proposto: `api/tests/certificado-restart.test.ts` Objetivo: comprovar pelo contrato HTTP que um certificado emitido permanece persistido após reinicialização da aplicação usando o mesmo `dbPath`, mantendo exatamente o mesmo `codigo` e `emitidoEm`. Implemente o menor teste possível con…
- `22/09 10:28` carrega a skill **tdd-m4**
- `22/09 10:30` edita teste `api/tests/certificado-restart.test.ts`
- `22/09 10:30` roda `npx vitest run tests/certificado-restart.test.ts` → **vermelho** — _teste novo falhando, como deve ser_
- `22/09 10:31` edita teste `api/tests/certificado-restart.test.ts`
- `22/09 10:31` roda `npx vitest run tests/certificado-restart.test.ts` → verde (1 passaram) — _teste novo já nasceu verde_
- `22/09 10:31` roda `npm --prefix api test` → verde (273 passaram)
