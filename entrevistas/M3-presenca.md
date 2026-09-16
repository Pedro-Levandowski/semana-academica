## Rodada 1 — Entrevista sem consulta aos requisitos

### Bloco 1

❓ **P-01 — Janela de obtenção de código e registro (`FORA_DA_JANELA`)**: Qual é a janela exata em relação ao horário do encontro (início e fim) em que a organização pode obter o código do encontro (`GET /encontros/:id/codigo`) e em que o participante pode registrar a presença (`POST /encontros/:id/presencas`)?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-02 — Rotação e validade do código QR (`CodigoDoEncontro`)**: Com que frequência o código QR é trocado automaticamente (`trocaEm`, `validoAte`), qual a duração de validade de um código e qual o formato esperado?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-03 — Leitura offline e sincronização tardia (`SINCRONIZACAO_TARDIA`)**: Como o sistema valida o campo opcional `lidoEm` enviado no POST de presença, e qual é o critério exato de atraso para retornar `SINCRONIZACAO_TARDIA`?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-04 — Presença manual e limites (`LIMITE_DE_MANUAIS`)**: Quais são as regras para a organização registrar presença manualmente (`POST /encontros/:id/presencas/manual`), incluindo a obrigatoriedade da justificativa e o limite de presenças manuais (`LIMITE_DE_MANUAIS`)?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-05 — Exigência de inscrição e códigos de erro (`NAO_INSCRITO`)**: O participante precisa obrigatoriamente estar inscrito na atividade para ter sua presença registrada (via QR ou manual)? O código de erro é 403 `NAO_INSCRITO`?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

### Bloco 2

❓ **P-06 — Vínculo entre código e encontro**: Como o código gerado em `GET /encontros/:id/codigo` está estritamente vinculado ao encontro específico, e o sistema impede que um código de um encontro seja usado em outro?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-07 — Normalização do código digitado**: Como o sistema trata letras maiúsculas/minúsculas e eventuais espaços ao receber o código do QR no `POST /encontros/:id/presencas`?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-08 — Unicidade e idempotência da presença**: Quais são os critérios para o POST de presença retornar 201 (primeira vez) versus 200 (registro já existente / idempotência) para o mesmo participante no mesmo encontro?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-09 — Ausência do campo `lidoEm` (momento atual)**: O que o sistema considera como instante de leitura (`lidoEm`) quando o participante envia a requisição sem informar o campo `lidoEm`?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-10 — Prioridade entre erros no M3**: Qual é a ordem de precedência entre verificações de erro no registro de presença (por exemplo: identificação 401, inscrição 403, janela 422, código inválido 422)?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-11 — Listagem de presenças (`GET /encontros/:id/presencas`)**: Quem pode acessar a listagem de presenças de um encontro, qual o formato de retorno e quais filtros ou ordenações são aplicados?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

### Bloco 3

❓ **P-12 — Tratamento de relógio do celular adiantado**: Como o sistema lida com o caso em que o relógio do celular do participante (`lidoEm`) está adiantado em relação ao relógio oficial do servidor, e quais validações evitam abusos?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-13 — Determinação da origem da presença (`origem`)**: Quais são as condições exatas para que a presença receba a origem `qr`, `qr_offline` ou `manual` no objeto de retorno?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*

---

❓ **P-14 — Validação real do código no servidor**: Como o servidor valida se o código enviado pelo participante (mesmo tendo formato válido de 6 caracteres) é considerado válido (`CODIGO_INVALIDO`) com base no histórico de códigos gerados para aquele encontro?
- **Resposta**: *(Pendente)*
- **Fonte**: *(Pendente — Consultar requisitos)*
