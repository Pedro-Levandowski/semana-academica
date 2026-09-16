# Sessões — Pedro Alpino Levandowski

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Início | Sessão | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| 15/09 00:56 | [Adaptação da skill TDD para Vitest e Supertest](ses_f5cca4b9dffeI7dKXH25Yf2AIM.md) | 8 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 15/09 01:04 | [Levantamento de requisitos do M1: Grade](ses_f5cc38686ffe6BC01F9O60xSFs.md) | 20 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 15/09 01:34 | [New session - 2026-09-15T04:34:15.079Z](ses_f5ca7e658ffewKALDUJmgVRVb2.md) | 51 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 15/09 01:49 | [Criação da especificação specs/M1-grade.md](ses_f5c99a134ffeqClhbRCiBL51t2.md) | 16 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 15/09 02:22 | [Esqueleto técnico da API e interface](ses_f5c7b48e1ffeP0cklNpNI9tli9.md) | 59 | — | — | 0 / 3 | 0 | 0 | 1 | — |
| 15/09 09:12 | [New session - 2026-09-15T12:12:05.362Z](ses_f5b04bc8dffe5z7dooO8rrhPYj.md) | 88 | tdd | — | 10 / 11 | 2 | 4 | 2 | — |
| 15/09 10:53 | [Correção da fundação do M1 em feat/m1-grade](ses_f5aa7fe8bffeS2cv1Acx8oESqK.md) | 20 | — | — | 3 / 4 | 0 | 0 | 1 | — |
| 15/09 11:16 | [New session - 2026-09-15T14:16:57.984Z](ses_f5a92687fffeUXvX2UroM2MRSQ.md) | 29 | — | — | 6 / 6 | 1 | 1 | 0 | — |
| 15/09 11:43 | [New session - 2026-09-15T14:43:11.879Z](ses_f5a7a6478ffemb8QmC6cmSq48k.md) | 96 | — | — | 6 / 17 | 3 | 2 | 1 | — |
| 15/09 14:23 | [New session - 2026-09-15T17:23:51.643Z](ses_f59e74d24ffeH0wW4t4nKUeK8c.md) | 8 | — | — | 0 / 3 | 0 | 1 | 0 | — |
| 15/09 14:33 | [Implementação de R9, R10 e R21 no M1](ses_f59de22daffecQDdfzl7UCzXXR.md) | 43 | — | — | 3 / 10 | 3 | 1 | 0 | — |
| 15/09 15:19 | [Implementação de GET /atividades/:id com TDD](ses_f59b40678ffeIgW66aaQNqf6C7.md) | 68 | — | — | 0 / 24 | 0 | 2 | 4 | — |
| 15/09 17:37 | [Implementação de PATCH /atividades/:id (M1)](ses_f59360260ffeqM94LPPWqFQUxR.md) | 99 | — | — | 3 / 13 | 3 | 5 | 2 | — |
| 16/09 02:37 | [Cliente API e seletor de usuário para Fatia 5](ses_f5747fc13ffejVWHsML3Ook8lh.md) | 8 | — | — | 0 / 1 | 0 | 0 | 0 | — |
| 16/09 02:57 | [New session - 2026-09-16T05:57:16.308Z](ses_f5735886bffeQSYH3Pn1O14F9O.md) | 8 | — | — | 1 / 0 | 0 | 0 | 0 | — |
| 16/09 03:26 | [Cliente API e seletor de usuário para M1](ses_f571ad25effehd2Dm3yYu2QkDf.md) | 0 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 16/09 03:28 | [New session - 2026-09-16T06:28:37.215Z](ses_f5718d520ffeBaWQ7qoOMvJjXM.md) | 20 | — | — | 2 / 3 | 0 | 0 | 1 | — |
| 16/09 03:39 | [Cliente HTTP e seletor de usuário para Fatia 5](ses_f570f36f1ffevzDBSaJBYFTc3t.md) | 141 | tdd | — | 13 / 17 | 0 | 2 | 9 | — |
| | **Total: 18 sessões** | 782 | grilling, tdd (2) | — | 47 / 112 | 12 | 18 | 21 | — |
