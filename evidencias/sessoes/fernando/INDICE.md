# Sessões — Fernando

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Início | Sessão | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| 16/09 19:44 | [Planejamento do módulo M3 de presença por QR](ses_f539bb116ffeTK259UU96d2IIc.md) | 13 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 16/09 20:23 | [Rodada 2 do M3: entrevistas/M3-presenca.md](ses_f53775565ffe9OKEK9EtoBULfK.md) | 57 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 16/09 22:23 | [Especificação M3-presenca a partir de entrevista](ses_f53099585ffeLnBZMnwkpvlIzY.md) | 16 | to-spec | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 19:14 | [TDD na Fatia 1 de M3-presenca.md](ses_f4e90cb28ffejxqt4g7GIpZUPP.md) | 58 | tdd | — | 7 / 9 | 1 | 3 | 0 | — |
| 17/09 22:21 | [New session - 2026-09-18T01:21:59.531Z](ses_f4de4d714ffe8rq343sMmztD7Y.md) | 52 | — | — | 4 / 2 | 1 | 1 | 0 | — |
| 17/09 23:17 | [Regra R18 e campo origem em register-presenca.ts](ses_f4db25aafffecmmKaAMCBiYVSJ.md) | 28 | — | — | 1 / 2 | 0 | 0 | 1 | — |
| 17/09 23:49 | [Testes de presença manual na Fatia 4](ses_f4d9470ecffeHXFeE84pJp4MZh.md) | 42 | — | — | 5 / 8 | 3 | 1 | 0 | — |
| 18/09 00:40 | [Implementação da Fatia 5 de M3-presenca.md](ses_f4d6600fcffetUXPWKN5ZycKRN.md) | 40 | — | — | 3 / 2 | 1 | 0 | 0 | — |
| | **Total: 8 sessões** | 306 | grilling, to-spec, tdd | — | 20 / 23 | 6 | 5 | 1 | — |
