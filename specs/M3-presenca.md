# Spec — M3-presenca

## 1. Objetivo
Gerenciar a obtenção de códigos de encontro pela organização, o registro de presença por QR code por participantes (tanto em tempo real quanto offline com envio de `lidoEm`), o lançamento de presença manual pela organização com justificativa e limites percentuais, a unicidade e idempotência de registros de presença, as validações temporais (janela de funcionamento, sincronização tardia, tratamento de relógio de celular adiantado), a exigência de inscrição confirmada, e a listagem de presenças de um encontro.

## 2. Fora de escopo
O módulo M3 **não** inclui e está estritamente proibido de implementar:
- Criação, alteração, cancelamento de atividades ou gestão de salas (pertencentes ao M1).
- Regras de inscrições, lista de espera ou confirmação de vagas (pertencentes ao M2).
- Emissão de certificados, verificação pública de certificados ou cálculo de extrato (pertencentes ao M4).
- Painel geral da organização, contagens de frequência global, exportação de CSV ou bloqueios de participantes (pertencentes ao M5).
- Funcionalidades de login, senha ou cadastro de usuários.

## 3. Modelo
Entidades gerenciadas ou expostas pelo M3:
- **CodigoDoEncontro**:
  - `encontroId`: string (identificador do encontro)
  - `codigo`: string, 6 caracteres usando alfabeto sem 0, O, 1, I (gerado pelo sistema)
  - `trocaEm`: string ISO 8601 com fuso (instante em que a tela deve buscar o próximo código)
  - `validoAte`: string ISO 8601 com fuso (primeiro instante em que este código deixa de ser aceito)
- **Presenca**:
  - `id`: string, prefixo `pre_` + 8 hexadecimais (gerado pelo sistema)
  - `encontroId`: string
  - `participanteId`: string
  - `origem`: string, `"qr"`, `"qr_offline"` ou `"manual"`
  - `lidoEm`: string ISO 8601 com fuso (instante que valeu para as regras de validação)
  - `registradaEm`: string ISO 8601 com fuso (instante em que a requisição foi processada)
  - `justificativa`: string ou `null` (texto obrigatório com no mínimo 10 caracteres apenas quando origem manual)

## 4. Endpoints
Métodos, caminhos, papéis, corpos e códigos de sucesso conforme `contrato-api.md`:
- `GET /encontros/:id/codigo` (organização) → 200 `CodigoDoEncontro`
- `POST /encontros/:id/presencas` (participante) → 201 `Presenca` na primeira vez; 200 `Presenca` na segunda vez em diante (idempotência) (corpo: `codigo`, `lidoEm` opcional)
- `POST /encontros/:id/presencas/manual` (organização) → 201 `Presenca` na primeira vez; 200 `Presenca` na segunda vez em diante (corpo: `participanteId`, `justificativa`)
- `GET /encontros/:id/presencas` (organização) → 200 `[Presenca]`

## 5. Regras
- **R1** (Janela de obtenção de código e registro): A duração da janela de obtenção do código pela organização (`GET /encontros/:id/codigo`) e de registro de presença pelo participante (`POST /encontros/:id/presencas`) vai de 15 minutos antes até 30 minutos depois do início do encontro, incluindo essas bordas. Fora dessa janela, a tentativa retorna 422 `FORA_DA_JANELA`. *(Origem: P-01; RN-301, RN-302)*
- **R2** (Proibição de código para atividade cancelada): A organização não consegue obter o código de um encontro pertencente a uma atividade cancelada, independentemente da janela de horário, retornando especificamente 422 `ATIVIDADE_CANCELADA` (não `FORA_DA_JANELA`). *(Origem: P-01; RN-301, RN-302)*
- **R3** (Rotação e formato do código QR): O código QR muda automaticamente a cada minuto, alinhado ao relógio (de hh:mm:00 até hh:mm:59). O formato possui 6 caracteres, utilizando um alfabeto que evita letras e números parecidos (sem 0, O, 1, I). *(Origem: P-02; RN-303, RN-304, RN-305)*
- **R4** (Validação do código no servidor): O servidor aceita como válidos o código do minuto atual e o do minuto imediatamente anterior. Qualquer código mais antigo ou gerado por outro encontro é inválido, retornando 422 `CODIGO_INVALIDO`. *(Origem: P-02, P-06, P-14; RN-303, RN-304, RN-305)*
- **R5** (Leitura offline e sincronização tardia): Quando o campo `lidoEm` é enviado no `POST /encontros/:id/presencas`, a janela e a validade do código são conferidas usando o instante da leitura (`lidoEm`), e não o instante do envio. O envio com `lidoEm` é aceito até 2 horas depois do fim do encontro; passado esse prazo, o sistema retorna 422 `SINCRONIZACAO_TARDIA`. *(Origem: P-03; RN-308, RN-310)*
- **R6** (Presença manual e obrigatoriedade de justificativa): O registro de presença manual (`POST /encontros/:id/presencas/manual`) é restrito à organização (`organizacao`), exclusivamente para participante com inscrição confirmada, e exige uma justificativa com no mínimo 10 caracteres. Caso a justificativa esteja ausente ou tenha menos de 10 caracteres, o sistema retorna 422 `JUSTIFICATIVA_OBRIGATORIA`. *(Origem: P-04, P-05; RN-311, RN-312)*
- **R7** (Janela para presença manual): A presença manual pode ser lançada desde a abertura da janela normal (15 minutos antes do início do encontro) até 2 horas depois do fim do encontro. Fora desse período, retorna 422 `FORA_DA_JANELA`. *(Origem: P-04; RN-311, RN-313)*
- **R8** (Limite de presenças manuais): O limite de presenças manuais é de 10% das inscrições confirmadas daquele encontro, arredondando para cima. Ultrapassar esse limite gera 422 `LIMITE_DE_MANUAIS`. *(Origem: P-04; RN-313)*
- **R9** (Exigência de inscrição confirmada): Só participante com inscrição confirmada (`confirmada`) pode ter presença registrada, seja por QR ou manual. Se o participante não estiver com inscrição confirmada, o sistema retorna o erro 403 `NAO_INSCRITO`. *(Origem: P-05; RN-306)*
- **R10** (Vínculo exclusivo entre código e encontro): O código gerado é vinculado exclusivamente ao encontro que o gerou. Se o código pertencer a outro encontro, o sistema o recusa como inválido (`CODIGO_INVALIDO`). *(Origem: P-06; RN-304)*
- **R11** (Normalização do código digitado): Na leitura do código enviado pelo participante, o sistema aceita letras minúsculas e ignora espaços digitados. *(Origem: P-07; RN-305)*
- **R12** (Unicidade e idempotência da presença): Só existe uma presença por participante e encontro. Se a mesma presença for enviada novamente, o sistema não cria duplicata: retorna 200 com a presença que já existia. Esta checagem acontece antes de qualquer outra regra do módulo. No primeiro registro, retorna 201. *(Origem: P-08; RN-307)*
- **R13** (Ausência do campo `lidoEm`): Quando o campo `lidoEm` não é enviado na requisição do participante, o sistema usa o próprio instante do envio da requisição como referência de leitura. *(Origem: P-09; RN-308)*
- **R14** (Precedência de erros no registro pelo participante): Para o registro pelo participante (`POST /encontros/:id/presencas`), a ordem de checagem dos erros é: encontro inexistente (404 `NAO_ENCONTRADO`), presença já existente (200 `Presenca`), não inscrito (403 `NAO_INSCRITO`), sincronização tardia (422 `SINCRONIZACAO_TARDIA`), fora da janela (422 `FORA_DA_JANELA`), código inválido (422 `CODIGO_INVALIDO`). *(Origem: P-10; RN-314)*
- **R15** (Precedência de erros na presença manual): Para a presença manual (`POST /encontros/:id/presencas/manual`), a ordem de checagem dos erros é: justificativa (422 `JUSTIFICATIVA_OBRIGATORIA`), presença já existente (200 `Presenca`), não inscrito (403 `NAO_INSCRITO`), fora da janela (422 `FORA_DA_JANELA`), limite de manuais (422 `LIMITE_DE_MANUAIS`). *(Origem: P-10; RN-314)*
- **R16** (Listagem de presenças): O endpoint `GET /encontros/:id/presencas` permite à organização listar as presenças registradas de um encontro. *(Origem: P-11; Decisão de design da equipe)*
- **R17** (Tratamento de relógio do celular adiantado): Se o `lidoEm` informado for posterior ao instante em que a requisição chegou ao servidor, o sistema considera o instante do envio como o momento efetivo — impedindo que um relógio adiantado gere uma leitura no futuro. *(Origem: P-12; RN-309)*
- **R18** (Determinação da origem da presença): A origem registrada no objeto de retorno (`origem`) recebe: `qr` quando lida e enviada na hora; `qr_offline` quando enviada com `lidoEm`; ou `manual` quando lançada pela organização. *(Origem: P-13; RN-315)*

## 6. Critérios de aceite
1. (R1) Dado um pedido GET para `/encontros/:id/codigo` feito pela organização 16 minutos antes do início do encontro, a API responde com status 422 e corpo `{"erro": "FORA_DA_JANELA", "mensagem": "..."}`.
2. (R1) Dado um pedido GET para `/encontros/:id/codigo` feito 15 minutos antes do início do encontro, a API responde com status 200 e o objeto `CodigoDoEncontro`.
3. (R1) Dado um pedido GET para `/encontros/:id/codigo` feito 30 minutos depois do início do encontro, a API responde com status 200 e o objeto `CodigoDoEncontro`.
4. (R1) Dado um pedido GET para `/encontros/:id/codigo` feito 31 minutos depois do início do encontro, a API responde com status 422 e corpo `{"erro": "FORA_DA_JANELA", "mensagem": "..."}`.
5. (R2) Dado um pedido GET para `/encontros/:id/codigo` para um encontro de atividade cancelada, a API responde com status 422 e corpo `{"erro": "ATIVIDADE_CANCELADA", "mensagem": "..."}`.
6. (R3, R4) Dado um pedido POST para `/encontros/:id/presencas` com um código de 6 caracteres do minuto atual ou anterior, a API valida com sucesso.
7. (R4) Dado um pedido POST para `/encontros/:id/presencas` com um código antigo (mais de 1 minuto atrás) ou de outro encontro, a API responde com status 422 e corpo `{"erro": "CODIGO_INVALIDO", "mensagem": "..."}`.
8. (R5) Dado um pedido POST para `/encontros/:id/presencas` enviado com `lidoEm` correspondente a 2 horas e 1 minuto após o fim do encontro, a API responde com status 422 e corpo `{"erro": "SINCRONIZACAO_TARDIA", "mensagem": "..."}`.
9. (R6) Dado um pedido POST para `/encontros/:id/presencas/manual` sem justificativa ou com justificativa com menos de 10 caracteres, a API responde com status 422 e corpo `{"erro": "JUSTIFICATIVA_OBRIGATORIA", "mensagem": "..."}`.
10. (R7) Dado um pedido POST para `/encontros/:id/presencas/manual` fora do período permitido (antes da janela ou mais de 2h após o fim), a API responde com status 422 e corpo `{"erro": "FORA_DA_JANELA", "mensagem": "..."}`.
11. (R8) Dado um pedido POST para `/encontros/:id/presencas/manual` que excede o limite de 10% das inscrições confirmadas (arredondado para cima), a API responde com status 422 e corpo `{"erro": "LIMITE_DE_MANUAIS", "mensagem": "..."}`.
12. (R9) Dado um pedido POST de presença (QR ou manual) por participante sem inscrição confirmada, a API responde com status 403 e corpo `{"erro": "NAO_INSCRITO", "mensagem": "..."}`.
13. (R10) Dado um pedido POST de presença com código pertencente a outro encontro, a API responde com status 422 e corpo `{"erro": "CODIGO_INVALIDO", "mensagem": "..."}`.
14. (R11) Dado um pedido POST para `/encontros/:id/presencas` enviando código com letras minúsculas e espaços, a API normaliza e aceita corretamente.
15. (R12) Dado o primeiro envio de presença bem-sucedido para um participante no encontro, a API responde com status 201 e o objeto `Presenca`.
16. (R12) Dado o reenvio da mesma presença para o mesmo participante e encontro, a API responde com status 200, retornando a presença existente sem duplicar.
17. (R13) Dado um pedido POST para `/encontros/:id/presencas` sem o campo `lidoEm`, a API utiliza o instante atual do envio como referência.
18. (R14) Dado um pedido POST para `/encontros/:id/presencas` com múltiplos erros potenciais, a API aplica estritamente a ordem de precedência: encontro inexistente (404), presença existente (200), não inscrito (403), sincronização tardia (422), fora da janela (422), código inválido (422).
19. (R15) Dado um pedido POST para `/encontros/:id/presencas/manual` com múltiplos erros potenciais, a API aplica estritamente a ordem de precedência: justificativa (422), presença existente (200), não inscrito (403), fora da janela (422), limite de manuais (422).
20. (R16) Dado um pedido GET para `/encontros/:id/presencas` feito pela organização, a API responde com status 200 e a lista de presenças.
21. (R17) Dado um pedido POST para `/encontros/:id/presencas` com `lidoEm` no futuro em relação à chegada da requisição no servidor, a API substitui o momento efetivo pelo instante do envio.
22. (R18) Dado um registro de presença, o campo `origem` assume corretamente `"qr"`, `"qr_offline"` ou `"manual"` conforme o canal e parâmetros utilizados.

## 7. Como isto será verificado
A verificação será realizada externamente por testes automatizados (Supertest/Vitest) com `MODO_TESTE=1`, manipulando o relógio controlado (`PUT /_teste/relogio`), criando encontros e inscrições confirmadas, e testando todas as rotas, códigos de sucesso (200, 201), códigos de erro (401, 403, 404, 422), idempotência, janelas temporais, sincronização tardia, presença manual, limites e regras de precedência.

## 8. Fatias de entrega
1. **Fatia 1 — Geração de código e janela**
   - Rota `GET /encontros/:id/codigo`, validação da janela de 15 min antes a 30 min depois (R1, R2), rotação e formato de 6 caracteres do código (R3).
2. **Fatia 2 — Registro via QR e Idempotência**
   - Rota `POST /encontros/:id/presencas`, verificação de inscrição confirmada (R9), validação do código atual e anterior (R4, R10), normalização (R11), idempotência retornando 200 na segunda vez (R12), ausência de `lidoEm` (R13), relógio adiantado (R17) e origem `qr`.
3. **Fatia 3 — Offline e Sincronização Tardia**
   - Suporte ao campo `lidoEm`, validação de janela e código baseados em `lidoEm`, limite de 2 horas após o término para `SINCRONIZACAO_TARDIA` (R5) e origem `qr_offline`.
4. **Fatia 4 — Presença Manual e Limites**
   - Rota `POST /encontros/:id/presencas/manual`, exigência de justificativa mínima de 10 caracteres (R6), janela estendida (R7), limite de 10% arredondado para cima (R8), origem `manual`.
5. **Fatia 5 — Precedência de Erros e Listagem**
   - Implementação exata da ordem de precedência de erros para participante e manual (R14, R15) e listagem `GET /encontros/:id/presencas` (R16).

---

## Apêndice A: Matriz Regra → Critério de aceite
- R1 → Critérios 1, 2, 3, 4
- R2 → Critério 5
- R3 → Critério 6
- R4 → Critérios 6, 7, 13
- R5 → Critério 8
- R6 → Critério 9
- R7 → Critério 10
- R8 → Critério 11
- R9 → Critério 12
- R10 → Critérios 7, 13
- R11 → Critério 14
- R12 → Critérios 15, 16
- R13 → Critério 17
- R14 → Critério 18
- R15 → Critério 19
- R16 → Critério 20
- R17 → Critério 21
- R18 → Critério 22

## Apêndice B: Matriz Origem → Regra/Seção
- P-01 → R1, R2
- P-02 → R3, R4
- P-03 → R5
- P-04 → R6, R7, R8
- P-05 → R6, R9
- P-06 → R4, R10
- P-07 → R11
- P-08 → R12
- P-09 → R13
- P-10 → R14, R15
- P-11 → R16
- P-12 → R17
- P-13 → R18
- P-14 → R4
