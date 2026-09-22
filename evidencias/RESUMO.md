# Evidências por aluno

Cada execução de teste é lida pelo que mudou desde a anterior:

- **Ciclo** — vermelho logo depois de mexer só em teste, e depois verde logo depois de mexer só em código. É o TDD.
- **Nasceu verde** — verde logo depois de mexer só em teste. Ou o comportamento já existia, ou o teste não testa o que diz.
- **Juntos** — teste e código mudaram antes da mesma execução. Não houve vermelho para ver.

**Alertas:** *colou* = prompt com 10 palavras seguidas ou mais iguais às do documento de requisitos (só aparece quando o resumo é gerado com `--requisitos`); *leu* = o agente acessou um arquivo de requisitos; *anexou* = o documento foi anexado à conversa.

Requisições são chamadas ao modelo: cada passo do agente é uma. Skills contam tanto a ferramenta `skill` quanto o comando `/nome`.

| Aluno | Sessões | Requisições | Skills | Subagentes | Vermelhas / verdes | Ciclos | Nasceu verde | Juntos | Alertas |
|---|---|---|---|---|---|---|---|---|---|
| [enzofenato](sessoes/enzofenato/INDICE.md) | 54 | 1.048 | grilling (3), to-spec (2), tdd (5), tdd-m4 (34) | explore (4), general, revisor-de-contrato (4), auditor (2) | 54 / 84 | 6 | 12 | 2 | — |
| [fernando](sessoes/fernando/INDICE.md) | 17 | 499 | grilling, to-spec, tdd | auditor | 37 / 39 | 7 | 9 | 7 | — |
| [lucas-jose-gomes-oliveira](sessoes/lucas-jose-gomes-oliveira/INDICE.md) | 14 | 428 | grilling (2), to-spec, tdd (5) | auditor (2) | 30 / 56 | 11 | 28 | 2 | — |
| [pedro-alpino-levandowski](sessoes/pedro-alpino-levandowski/INDICE.md) | 18 | 782 | grilling, tdd (2) | — | 47 / 112 | 12 | 18 | 21 | — |

## Trechos do documento de requisitos em specs/ e entrevistas/

Rode com `--requisitos <documento>` para procurar trechos copiados do documento.
