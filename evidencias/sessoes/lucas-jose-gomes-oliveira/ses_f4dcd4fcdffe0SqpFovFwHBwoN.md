# Respostas pendentes em M2-inscricoes.md

| | |
|---|---|
| Sessão | `ses_f4dcd4fcdffe0SqpFovFwHBwoN` |
| Pasta | sistema_academico/semana-academica |
| Período | 17/09 22:47 → 17/09 23:13 |
| Modelo | google/gemini-3.6-flash |
| Requisições ao modelo | 25 |
| Tokens de entrada / saída | 147.343 / 11.475 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 9 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `17/09 22:47` **prompt** — Vamos responder as perguntas marcadas como pendentes em entrevistas/M2-inscricoes.md, uma de cada vez. Eu respondo com o que li no documento de requisitos, citando a regra; registre a minha resposta e ponha a regra na coluna Fonte. Não crie perguntas novas e não mexa nas perguntas já respondidas.
- `17/09 22:48` **prompt** — A inscrição assume o status de "confirmada" quando existe vaga, já sem vaga ela nasce "em espera". As regras que determinam quando alguma inscrição está encerrada são: Caso mais de uma regra recuse a que vale é a primeira da ordem.
- `17/09 22:53` **prompt** — P-01 — Fonte: duas regras se aplicam aqui, RN-205 (o que define confirmada vs em_espera) e RN-202 (o que fecha as inscrições). Coloque as duas na coluna Fonte.INSCRICOES_ENCERRADAS (RN-202): as inscrições fecham 30 minutos antes do início do 1º encontro da atividade.P-08 / precedência: sim, é RN-208, e é exatamente sobre isso — a ordem de qual erro prevalece quando mais de uma condição de recusa …
- `17/09 22:53` edita entrevista `entrevistas/M2-inscricoes.md`
- `17/09 22:54` **prompt** — JA_INSCRITO (RN-204): sim, sua leitura está certa — é uma inscrição ativa (confirmada, em_espera ou convocada) por participante e atividade. Detalhe importante: quem cancelou pode se inscrever de novo, mas entra no fim da fila (não recupera a posição antiga).LIMITE_DE_MINICURSOS (RN-207): no máximo 3 minicursos ocupando vaga ao mesmo tempo por participante. Dois detalhes que mudam o resultado: pa…
- `17/09 22:54` edita entrevista `entrevistas/M2-inscricoes.md`
- `17/09 23:00` **prompt** — posicaoNaEspera (RN-216): é calculada, não guardada fixa — a ordem é a de chegada na fila, e posição 1 é sempre a próxima a ser convocada. Isso importa pra sua resposta: como é calculada dinamicamente, quando alguém no meio da fila cancela, não precisa de lógica especial de "reordenar" — a posição de todo mundo atrás dele simplesmente recalcula automaticamente pela ordem de chegada que sobrou.Vag…
- `17/09 23:00` edita entrevista `entrevistas/M2-inscricoes.md`
- `17/09 23:03` **prompt** — Prazo (RN-211): toda vaga liberada convoca o 1º da espera com 2 horas de prazo pra confirmar.Teto do prazo (RN-212) — essa é a regra nova pra essa pergunta: o prazo de convocação nunca ultrapassa o fechamento das inscrições (que é 30 min antes do 1º encontro, RN-202). Duas consequências práticas que valem citar na resposta:Se a vaga abre perto do fechamento, a convocação recebe um prazo menor que…
- `17/09 23:03` edita entrevista `entrevistas/M2-inscricoes.md`
- `17/09 23:07` **prompt** — SEM_CONVOCACAO / CONVOCACAO_EXPIRADA (RN-215): confirmar uma inscrição que não está convocada → SEM_CONVOCACAO. Confirmar depois do prazo vencido (convocadaAte já passou) → CONVOCACAO_EXPIRADA.CONFLITO_DE_HORARIO e LIMITE_DE_MINICURSOS (RN-214): a confirmação refaz as mesmas duas verificações da inscrição (RN-206 e RN-207) — porque entre a convocação e a confirmação o participante pode ter se ins…
- `17/09 23:07` edita entrevista `entrevistas/M2-inscricoes.md`
- `17/09 23:08` **prompt** — Quando é permitido (RN-209): o participante cancela a própria inscrição até a atividade começar. Depois que a atividade começou → ATIVIDADE_JA_INICIADA. "Começou" aqui é o mesmo critério do resto do documento: o relógio chegou ao início do 1º encontro, inclusive esse instante já conta como iniciada.Estados (RN-210): cancelamento só faz sentido em inscrição ativa — confirmada, em_espera ou convoca…
- `17/09 23:08` edita entrevista `entrevistas/M2-inscricoes.md`
- `17/09 23:10` **prompt** — Impacto (RN-217): cancelar a atividade cancela todas as inscrições ativas dela — ou seja, toda inscrição que estava confirmada, em_espera ou convocada vira cancelada automaticamente. Inscrições que já estavam cancelada ou expirada antes disso não mudam (já estavam inativas).
- `17/09 23:10` edita entrevista `entrevistas/M2-inscricoes.md`
- `17/09 23:11` **prompt** — Pode confirmar, é essa ordem mesmo.
- `17/09 23:11` edita entrevista `entrevistas/M2-inscricoes.md`
- `17/09 23:12` **prompt** — Ajuste **Fonte**: RN-08 para **Fonte**: RN-208, RN-507
- `17/09 23:12` edita entrevista `entrevistas/M2-inscricoes.md`
