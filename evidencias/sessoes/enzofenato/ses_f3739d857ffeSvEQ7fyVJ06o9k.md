# Análise fluxo emissão certificado M4

| | |
|---|---|
| Sessão | `ses_f3739d857ffeSvEQ7fyVJ06o9k` |
| Pasta | Semana Tech/semana-academica |
| Período | 22/09 08:00 → 22/09 08:29 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 28 |
| Tokens de entrada / saída | 312.100 / 41.672 |
| Skills | tdd-m4 |
| Subagentes | revisor-de-contrato |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 0 de entrevista, 0 de spec, 4 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `22/09 08:00` **prompt** — Agora faça uma análise focada exclusivamente no FLUXO DE EMISSÃO DE CERTIFICADO do M4. NÃO implemente nada. NÃO altere arquivos. NÃO crie testes. NÃO faça commit. Use a skill tdd-m4 quando aplicável. Consulte: - AGENTS.md - app/AGENTS.md - specs/M4-certificados.md - contrato-api.md - api/src/app.ts - api/src/certificate/emissao-certificado.ts - app/src/App.tsx - app/src/components/Programacao.tsx…
- `22/09 08:00` carrega a skill **tdd-m4**
- `22/09 08:05` **prompt** — Agora vamos executar a REVISÃO FINAL DE CONTRATO do M4 antes da auditoria. NÃO implemente nada nesta etapa. NÃO altere arquivos. NÃO corrija problemas automaticamente. NÃO faça commit. Use o agente: @revisor-de-contrato Módulo: M4 — Certificados e Horas Complementares FONTES PERMITIDAS Consulte: - AGENTS.md - app/AGENTS.md - specs/M4-certificados.md - contrato-api.md - código atual de API relacio…
- `22/09 08:05` chama o subagente **revisor-de-contrato** — Revisão final de contrato M4
  > <task id="ses_f37350c14ffevCUpyRqvQTukFg" state="completed"> Tenho todas as evidências necessárias. Os dois últimos pontos foram confirmados: `activity.ts:30,33` valida quantidade de encontros (palestra = 1, minicurso = 2–5, erro `QUANTIDA…
- `22/09 08:24` **prompt** — Vamos corrigir a única dívida documental encontrada pela revisão final de contrato do M4. ALTERE SOMENTE: .opencode/skills/tdd-m4/SKILL.md NÃO altere código de produção. NÃO altere testes. NÃO altere specs/M4-certificados.md. NÃO altere contrato-api.md. NÃO consulte requisitos-envolvidos.md. NÃO altere entrevistas. NÃO altere evidências. NÃO faça commit. CONTEXTO A revisão final concluiu: PRONTO …
- `22/09 08:25` edita contexto `.opencode/skills/tdd-m4/SKILL.md` (4×)
