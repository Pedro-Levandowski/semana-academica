# Testes RED da UI-3 Extrato de Horas

| | |
|---|---|
| Sessão | `ses_f37589574ffeSipzue0VDiF1fF` |
| Pasta | Semana Tech/semana-academica |
| Período | 22/09 07:26 → 22/09 07:29 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 10 |
| Tokens de entrada / saída | 100.007 / 8.557 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 1 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 1 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `22/09 07:26` **prompt** — Vamos iniciar a FATIA UI-3 do M4 — Extrato de Horas. Estado atual: - UI-1 cliente API M4 concluída. - UI-2 Meus Certificados concluída. - suíte da interface estava em 116 testes verdes. - existe um erro baseline de typecheck em useCodigoEncontro.ts relacionado a NodeJS; NÃO corrigir nesta fatia. Nesta sessão faça SOMENTE os testes RED da UI-3. NÃO implemente componente. NÃO implemente hook. NÃO a…
- `22/09 07:26` carrega a skill **tdd-m4**
- `22/09 07:29` edita teste `app/src/components/ExtratoHoras.test.tsx`
- `22/09 07:29` roda `npx vitest run src/components/ExtratoHoras.test.tsx` → **vermelho** — _teste novo falhando, como deve ser_
