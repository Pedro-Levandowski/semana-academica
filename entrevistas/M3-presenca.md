## Rodada 1 — Entrevista sem consulta aos requisitos

### Bloco 1

❓ **P-01 — Janela de obtenção de código e registro (`FORA_DA_JANELA`)**: Qual é a janela exata em relação ao horário do encontro (início e fim) em que a organização pode obter o código do encontro (`GET /encontros/:id/codigo`) e em que o participante pode registrar a presença (`POST /encontros/:id/presencas`)?
- **Resposta**: A duração da janela vai de 15 minutos antes até 30 minutos depois do início do encontro, incluindo essas bordas. Além dessa janela, a organização não consegue obter o código, e também não é possível conseguir o código de uma atividade cancelada.
- **Fonte**: RN-301, RN-302

---

❓ **P-02 — Rotação e validade do código QR (`CodigoDoEncontro`)**: Com que frequência o código QR é trocado automaticamente (`trocaEm`, `validoAte`), qual a duração de validade de um código e qual o formato esperado?
- **Resposta**: O código muda a cada minuto, alinhado ao relógio (de hh:mm:00 até hh:mm:59). São aceitos o código do minuto atual e o do minuto imediatamente anterior. Qualquer código mais antigo ou de outro encontro é inválido. O formato tem 6 caracteres, usando um alfabeto que evite letras e números parecidos (sem 0, O, 1, I).
- **Fonte**: RN-303, RN-304, RN-305

---

❓ **P-03 — Leitura offline e sincronização tardia (`SINCRONIZACAO_TARDIA`)**: Como o sistema valida o campo opcional `lidoEm` enviado no POST de presença, e qual é o critério exato de atraso para retornar `SINCRONIZACAO_TARDIA`?
- **Resposta**: Quando o campo `lidoEm` é enviado, a janela e a validade do código são conferidas usando o instante da leitura, e não o instante do envio. Isso só é aceito até 2 horas depois do fim do encontro; passado esse prazo, o sistema retorna `SINCRONIZACAO_TARDIA`.
- **Fonte**: RN-308, RN-310

---

❓ **P-04 — Presença manual e limites (`LIMITE_DE_MANUAIS`)**: Quais são as regras para a organização registrar presença manualmente (`POST /encontros/:id/presencas/manual`), incluindo a obrigatoriedade da justificativa e o limite de presenças manuais (`LIMITE_DE_MANUAIS`)?
- **Resposta**: A presença manual só pode ser feita pela organização, exclusivamente para participante com inscrição confirmada, e exige uma justificativa com no mínimo 10 caracteres. Pode ser lançada desde a abertura da janela normal até 2 horas depois do fim do encontro. O limite é de 10% das inscrições confirmadas daquele encontro, arredondando para cima.
- **Fonte**: RN-311, RN-312, RN-313

---

❓ **P-05 — Exigência de inscrição e códigos de erro (`NAO_INSCRITO`)**: O participante precisa obrigatoriamente estar inscrito na atividade para ter sua presença registrada (via QR ou manual)? O código de erro é 403 `NAO_INSCRITO`?
- **Resposta**: Só participante com inscrição confirmada pode ter presença registrada, seja por QR ou manual. Se não estiver confirmado, o sistema retorna o erro 403 `NAO_INSCRITO`.
- **Fonte**: RN-306

### Bloco 2

❓ **P-06 — Vínculo entre código e encontro**: Como o código gerado em `GET /encontros/:id/codigo` está estritamente vinculado ao encontro específico, e o sistema impede que um código de um encontro seja usado em outro?
- **Resposta**: O código gerado é vinculado exclusivamente ao encontro que o gerou. Se o código pertencer a outro encontro, o sistema recusa como inválido — não existe reaproveitamento entre encontros diferentes.
- **Fonte**: RN-304

---

❓ **P-07 — Normalização do código digitado**: Como o sistema trata letras maiúsculas/minúsculas e eventuais espaços ao receber o código do QR no `POST /encontros/:id/presencas`?
- **Resposta**: Na leitura do código, o sistema aceita letras minúsculas e ignora espaços digitados pelo participante.
- **Fonte**: RN-305

---

❓ **P-08 — Unicidade e idempotência da presença**: Quais são os critérios para o POST de presença retornar 201 (primeira vez) versus 200 (registro já existente / idempotência) para o mesmo participante no mesmo encontro?
- **Resposta**: Só existe uma presença por participante e encontro. Se a mesma presença for enviada de novo, o sistema não cria duplicata: retorna 200 com a presença que já existia. Essa checagem acontece antes de qualquer outra regra do módulo. No primeiro registro, retorna 201.
- **Fonte**: RN-307

---

❓ **P-09 — Ausência do campo `lidoEm` (momento atual)**: O que o sistema considera como instante de leitura (`lidoEm`) quando o participante envia a requisição sem informar o campo `lidoEm`?
- **Resposta**: Quando o campo `lidoEm` não é enviado, o sistema usa o próprio instante do envio da requisição como referência de leitura.
- **Fonte**: RN-308

---

❓ **P-10 — Prioridade entre erros no M3**: Qual é a ordem de precedência entre verificações de erro no registro de presença (por exemplo: identificação 401, inscrição 403, janela 422, código inválido 422)?
- **Resposta**: Para registro pelo participante, a ordem de checagem é: encontro inexistente (404), presença já existente (200), não inscrito, sincronização tardia, fora da janela, código inválido. Para presença manual, a ordem é: justificativa, presença já existente (200), não inscrito, fora da janela, limite de manuais.
- **Fonte**: RN-314

---

❓ **P-11 — Listagem de presenças (`GET /encontros/:id/presencas`)**: Quem pode acessar a listagem de presenças de um encontro, qual o formato de retorno e quais filtros ou ordenações são aplicados?
- **Resposta**: Decisão de design da equipe, pois esta foi uma pergunta complementar sem regra RN associada no documento de requisitos.
- **Fonte**: Decisão de design da equipe

### Bloco 3

❓ **P-12 — Tratamento de relógio do celular adiantado**: Como o sistema lida com o caso em que o relógio do celular do participante (`lidoEm`) está adiantado em relação ao relógio oficial do servidor, e quais validações evitam abusos?
- **Resposta**: Se o `lidoEm` informado for posterior ao instante em que a requisição chegou ao servidor, o sistema considera o instante do envio como o momento efetivo — ou seja, um celular adiantado não pode gerar uma leitura no futuro.
- **Fonte**: RN-309

---

❓ **P-13 — Determinação da origem da presença (`origem`)**: Quais são as condições exatas para que a presença receba a origem `qr`, `qr_offline` ou `manual` no objeto de retorno?
- **Resposta**: A origem registrada pode ser: `qr`, quando lida e enviada na hora; `qr_offline`, quando enviada com `lidoEm`; ou `manual`, quando lançada pela organização.
- **Fonte**: RN-315

---

❓ **P-14 — Validação real do código no servidor**: Como o servidor valida se o código enviado pelo participante (mesmo tendo formato válido de 6 caracteres) é considerado válido (`CODIGO_INVALIDO`) com base no histórico de códigos gerados para aquele encontro?
- **Resposta**: Mesmo que o código tenha o formato correto de 6 caracteres, o servidor só considera válido o código do minuto atual ou do minuto imediatamente anterior, e apenas se pertencer ao encontro correto. Qualquer outro caso retorna `CODIGO_INVALIDO`.
- **Fonte**: RN-303, RN-304
