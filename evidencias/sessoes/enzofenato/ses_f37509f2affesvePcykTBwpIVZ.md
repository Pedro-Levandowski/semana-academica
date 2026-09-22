# Testes RED da tela Verificação de Certificado

| | |
|---|---|
| Sessão | `ses_f37509f2affesvePcykTBwpIVZ` |
| Pasta | Semana Tech/semana-academica |
| Período | 22/09 07:35 → 22/09 07:43 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 20 |
| Tokens de entrada / saída | 164.741 / 11.638 |
| Skills | tdd-m4 |
| Subagentes | — |
| Execuções de teste | 2 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 3 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `22/09 07:35` **prompt** — Vamos iniciar a FATIA UI-4 do M4 — Verificação Pública de Certificado. Estado atual: - UI-1 cliente API M4 concluída; - UI-2 Meus Certificados concluída; - UI-3 Extrato de Horas concluída; - suíte da interface estava em 122 testes verdes; - existe erro baseline de typecheck/build em useCodigoEncontro.ts: Cannot find namespace 'NodeJS' NÃO corrigir nesta fatia. Nesta sessão faça SOMENTE os testes …
- `22/09 07:35` carrega a skill **tdd-m4**
- `22/09 07:38` edita teste `app/src/components/VerificarCertificado.test.tsx`
- `22/09 07:38` roda `npx vitest run src/components/VerificarCertificado.test.tsx` → **vermelho** — _teste novo falhando, como deve ser_
- `22/09 07:39` **prompt** — Faça somente um ajuste no RED atual de VerificarCertificado.test.tsx. No fake usado no teste de SUCESSO, remova quaisquer campos que não pertençam ao contrato público VerificacaoCertificado. O objeto retornado por getCertificadoPorCodigo deve conter EXATAMENTE: { codigo: "SA26-7K2M-9QXA", participante: "Carla M. S.", atividade: "Flutter do zero", cargaHorariaMinutos: 360, emitidoEm: "2026-10-23T2…
- `22/09 07:40` edita teste `app/src/components/VerificarCertificado.test.tsx` (2×)
- `22/09 07:40` roda `npx vitest run src/components/VerificarCertificado.test.tsx` → **vermelho** — _teste novo falhando, como deve ser_
- `22/09 07:43` **prompt** — git add app/src/components/VerificarCertificado.test.tsx git status --short git diff --cached --stat
