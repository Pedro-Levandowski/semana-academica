# Sessões — Lucas José Gomes Oliveira

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Início | Sessão | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| 17/09 21:58 | [Definição do módulo M2 de inscrições](ses_f4dfa5527ffeVnPGE14KkUC3Ci.md) | 5 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 22:03 | [Planejamento do módulo M2 de inscrições](ses_f4df5aa9bffeQfwN9hMlD0O6wP.md) | 10 | grilling | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 22:28 | [Respostas pendentes em M2-inscricoes.md](ses_f4ddee273ffesLhzU6FUZUatoe.md) | 0 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 22:29 | [Respostas pendentes em M2-inscricoes.md](ses_f4dde0ed0ffeh2wHLrn2eMdkXM.md) | 2 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 22:47 | [Respostas pendentes em M2-inscricoes.md](ses_f4dcd4fcdffe0SqpFovFwHBwoN.md) | 25 | — | — | 0 / 0 | 0 | 0 | 0 | — |
| 17/09 23:21 | [Execução da especificação do Módulo M2](ses_f4dae9149ffeadCnvtt9xyR2JF.md) | 78 | to-spec, tdd | — | 6 / 10 | 4 | 3 | 0 | — |
| 17/09 23:58 | [TDD da fatia 2 de specs/M2-inscricoes.md](ses_f4d8c8f8affedPORcvv7PtzPoU.md) | 64 | tdd | — | 3 / 14 | 2 | 9 | 0 | — |
| 18/09 00:26 | [TDD para fatia 3 de M2-inscricoes.md](ses_f4d72d512ffeblUNdWPH2dHPXU.md) | 84 | tdd | — | 11 / 11 | 2 | 5 | 1 | — |
| 18/09 00:54 | [TDD Fatia 4 de M2-inscricoes.md](ses_f4d592262ffegTxBHs599eFjtE.md) | 52 | tdd | — | 5 / 9 | 1 | 6 | 0 | — |
| 18/09 01:09 | [Auditoria do módulo M2 contra M2-inscricoes.md](ses_f4d4b45a9ffeS7qGGdTjP5QFpE.md) | 2 | — | auditor | 0 / 0 | 0 | 0 | 0 | — |
| 18/09 01:17 | [Adição de testes TDD na API do M2](ses_f4d447dc0ffemmhdUB0f0cfJPy.md) | 45 | — | — | 1 / 2 | 0 | 0 | 1 | — |
| | **Total: 11 sessões** | 367 | grilling (2), to-spec, tdd (4) | auditor | 26 / 46 | 9 | 23 | 2 | — |
