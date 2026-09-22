# RED colisão de código G4/R6 M4

| | |
|---|---|
| Sessão | `ses_f3a3812a1ffeMuRv8gFPVk0lxu` |
| Pasta | Semana Tech/semana-academica |
| Período | 21/09 18:03 → 21/09 18:05 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 10 |
| Tokens de entrada / saída | 52.108 / 10.112 |
| Skills | tdd-m4 (2) |
| Subagentes | — |
| Execuções de teste | 1 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 1 de teste, 0 de código, 0 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `21/09 18:03` **prompt** — Vamos continuar o TDD da lacuna G4/R6 do M4. A seam de testabilidade já foi implementada e commitada: EmitirCertificado aceita GeradorDeCodigo por construtor, com gerarCodigo real como default. Agora faça SOMENTE o RED determinístico para colisão de código. Use a skill tdd-m4. Consulte: - specs/M4-certificados.md - contrato-api.md - AGENTS.md - api/src/certificate/emissao-certificado.ts - api/src…
- `21/09 18:03` carrega a skill **tdd-m4**
- `21/09 18:03` carrega a skill **tdd-m4**
- `21/09 18:05` edita teste `api/tests/certificado-colisao.test.ts`
- `21/09 18:05` roda `npx vitest run tests/certificado-colisao.test.ts` → **vermelho** — _teste novo falhando, como deve ser_
