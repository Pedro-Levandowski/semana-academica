# Spec — M4-certificados

## 1. Objetivo
Emitir certificados de participação para quem cumpriu a presença mínima de uma atividade encerrada, listar os certificados já emitidos de cada participante, permitir a verificação pública de um certificado pelo seu código e consolidar o extrato de horas complementares aproveitadas (palestras e minicursos), na visão do participante.

## 2. Fora de escopo
O módulo M4 **não** inclui e está estritamente proibido de implementar:
- Regras de presença por QR code, leitura offline, chamada manual ou qualquer registro de presenças (pertencentes ao M3).
- Regras de inscrições, lista de espera e confirmação de convocação (pertencentes ao M2).
- Cálculo da situação temporal da atividade ou criação/alteração de atividades e encontros (pertencentes ao M1), que o M4 apenas consulta.
- Regras do painel da organização e bloqueios de participantes (pertencentes ao M5).
- Geração de arquivo PDF ou qualquer artefato de certificado além da representação JSON do contrato.
- Cancelamento, revogação ou invalidação de certificados já emitidos.
- Rotas de autenticação, cadastro de usuários ou alteração dos dados iniciais.
- Códigos de QR de encontro (`GET /encontros/:id/codigo`), que pertencem ao M3.

## 3. Modelo
Entidades expostas pelo M4:
- **Certificado**:
  - `codigo`: string, formato `SA26-XXXX-XXXX` (gerado pelo sistema na primeira emissão)
  - `atividadeId`: string, referência à atividade do M1 (derivado)
  - `participanteId`: string, referência ao participante do M2 (derivado)
  - `cargaHorariaMinutos`: número inteiro, carga horária da atividade (derivado do M1)
  - `presencas`: número inteiro, quantidade de encontros com presença registrada do participante (derivado do M3)
  - `encontros`: número inteiro, total de encontros da atividade (derivado do M1)
  - `emitidoEm`: instante ISO 8601 com fuso, data de emissão (gerado pelo sistema na primeira emissão)
- **Verificacao** (consulta pública):
  - `codigo`: string
  - `participante`: string, nome abreviado (derivado do nome do participante pela regra de abreviação)
  - `atividade`: string, título da atividade (derivado do M1)
  - `cargaHorariaMinutos`: número inteiro
  - `emitidoEm`: instante ISO 8601 com fuso
- **Extrato**:
  - `itens`: lista de `{ atividadeId, titulo, tipo, cargaHorariaMinutos, codigo }` — uma entrada para cada atividade elegível do participante, conforme as regras R13 a R18; `codigo` é o código do certificado quando já emitido para a atividade e `null` caso contrário (R10)
  - `palestrasMinutos`: número inteiro, soma bruta das cargas horárias das palestras, sem teto (calculado)
  - `minicursosMinutos`: número inteiro, soma bruta das cargas horárias dos minicursos, sem teto (calculado)
  - `totalMinutos`: número inteiro, `palestrasMinutos + minicursosMinutos` (calculado)
  - `aproveitadoMinutos`: número inteiro, aplicando a regra de aproveitamento (calculado)

## 4. Endpoints
Métodos, caminhos, papéis e códigos de sucesso conforme `contrato-api.md`:
- `POST /atividades/:id/certificado` (participante) → 201 `Certificado` na primeira vez; 200 `Certificado` depois (sem corpo de entrada definido no contrato)
- `GET /certificados` (participante) → 200 `[Certificado]` — somente os já emitidos
- `GET /certificados/:codigo` (público, sem `X-Usuario`) → 200 `Verificacao`
- `GET /extrato` (participante) → 200 `Extrato`

## 5. Regras
- **R1** (Presença mínima de 75%): O participante tem direito ao certificado somente com presença registrada em pelo menos 75% dos encontros da atividade. O cálculo compara a fração exata `presencas / encontros` contra o limite de 75%, sem arredondamento a favor do participante. Presença insuficiente gera 422 `PRESENCA_INSUFICIENTE`. *(Origem: P-01; RN-404; código no `contrato-api.md`)*
- **R2** (Emissão somente após o encerramento): O certificado só pode ser emitido depois do instante de término do último encontro da atividade. Antes desse momento a emissão é recusada com 422 `ATIVIDADE_NAO_ENCERRADA`. *(Origem: P-02; RN-401; código no `contrato-api.md`)*
- **R3** (Carga horária integral no bruto): No extrato, minicursos e palestras contam pela carga horária integral: `palestrasMinutos` e `minicursosMinutos` são as somas brutas das cargas das atividades de cada tipo, sem aplicação de teto, e `totalMinutos` é a soma bruta das duas. *(Origem: P-03; RN-411)*
- **R4** (Teto de aproveitamento de palestras): Das palestras, aproveita-se no máximo 240 minutos (4 horas). O valor aproveitado das palestras é `min(240, palestrasMinutos)`, enquanto o campo bruto `palestrasMinutos` permanece sem teto. *(Origem: P-03; RN-411)*
- **R5** (Teto total e fórmula do aproveitado): Depois de aplicar o limite das palestras, o total de horas complementares aproveitadas (palestras + minicursos) fica limitado a 1200 minutos (20 horas). Fórmula: `aproveitadoMinutos = min(1200, min(240, palestrasMinutos) + minicursosMinutos)`. *(Origem: P-03; RN-412)*
- **R6** (Formato, alfabeto e unicidade do código): O código do certificado tem formato fixo `SA26-XXXX-XXXX`, usando os caracteres do alfabeto definido para os códigos do sistema; cada certificado tem código único; o código é criado na primeira emissão e permanece o mesmo nas reemissões. *(Origem: P-04; RN-407)*
- **R7** (Abreviação do nome): Na verificação pública, o nome do participante aparece com o primeiro nome por extenso e as iniciais dos demais nomes, cada uma seguida de ponto. As partículas `de`, `da`, `do`, `das` e `dos` permanecem por extenso e em minúsculas. *(Origem: P-05; RN-408, RN-409)*
- **R8** (Verificação pública sem X-Usuario): `GET /certificados/:codigo` é público e não exige o cabeçalho `X-Usuario`, retornando somente código, nome abreviado do participante, título da atividade, carga horária e data de emissão. *(Origem: P-05; RN-408, RN-409)*
- **R9** (Idempotência da emissão): A emissão é idempotente para o par atividade e participante: na primeira solicitação o certificado é criado e retorna 201; nas solicitações seguintes, para a mesma atividade e o mesmo participante, retorna 200 com o mesmo certificado e o mesmo código, sem criar nova emissão. *(Origem: P-06; RN-407)*
- **R10** (Composição dos itens do extrato): O extrato lista as atividades elegíveis do participante — isto é, as atividades que atendem às regras R13 a R18 —, emitidas ou não. Em cada item, `codigo` contém o código do certificado quando ele já tiver sido emitido para aquela atividade; se ainda não houver certificado emitido para a atividade, `codigo` é `null`. *(Origem: P-07; RN-410)*
- **R11** (Alfabeto do código): O código do certificado usa letras maiúsculas e dígitos, excluindo os caracteres `I`, `O`, `0` e `1` para evitar ambiguidades — o mesmo alfabeto utilizado pelos códigos de presença. *(Origem: P-08; RN-407, RN-302)*
- **R12** (Precedência de erros na emissão): Quando, na mesma solicitação, ambos os erros se aplicam, `ATIVIDADE_NAO_ENCERRADA` tem precedência sobre `PRESENCA_INSUFICIENTE`: a validação de encerramento da atividade ocorre antes da validação da frequência. *(Origem: P-09; RN-413)*
- **R13** (Inscrição confirmada elegível): Uma atividade em que o participante tem inscrição `confirmada` pode entrar no extrato, pois o extrato lista as atividades elegíveis, emitidas ou não, e a certificação exige inscrição confirmada. *(Origem: P-10; RN-410, RN-403)*
- **R14** (Inscrição em_espera não elegível): Uma atividade em que a inscrição do participante está `em_espera` não entra no extrato, pois o extrato lista somente atividades elegíveis e a certificação exige inscrição confirmada. *(Origem: P-11; RN-410, RN-403)*
- **R15** (Inscrição convocada não elegível): Uma atividade em que a inscrição do participante está `convocada` não entra no extrato, pois ainda não é uma inscrição confirmada; o extrato lista somente atividades elegíveis e a certificação exige inscrição confirmada. *(Origem: P-12; RN-410, RN-403, RN-214)*
- **R16** (Inscrição cancelada não elegível): Uma atividade em que a inscrição do participante está `cancelada` não entra no extrato, pois a inscrição não está confirmada e, portanto, não é elegível para certificação. *(Origem: P-13; RN-410, RN-403, RN-210)*
- **R17** (Inscrição expirada não elegível): Uma atividade em que a inscrição do participante está `expirada` não entra no extrato, pois a inscrição não está confirmada e, portanto, não é elegível para certificação. *(Origem: P-14; RN-410, RN-403, RN-210)*
- **R18** (Atividade cancelada não elegível): Uma atividade cancelada não permanece no extrato, pois atividade cancelada não certifica e o extrato lista somente atividades elegíveis. *(Origem: P-15; RN-402, RN-410)*

## 6. Critérios de aceite
1. (R1) Atividade encerrada com 4 encontros; participante com presenças em exatamente 3 (75% exato) → `POST /atividades/:id/certificado` → 201 com `presencas: 3` e `encontros: 4`.
2. (R1) Atividade encerrada com 4 encontros; participante com presenças em 2 (50%) → 422 `PRESENCA_INSUFICIENTE`.
3. (R1) Atividade encerrada com 5 encontros; participante com presenças em 3 (60%; 75% de 5 = 3,75, sem arredondamento a favor) → 422 `PRESENCA_INSUFICIENTE`.
4. (R1) Atividade encerrada com 5 encontros; participante com presenças em 4 (80%) → 201.
5. (R2) Relógio antes do término do último encontro, com participante já elegível por presença → 422 `ATIVIDADE_NAO_ENCERRADA`.
6. (R2) Relógio no instante exato do término do último encontro → 201.
7. (R3, R4, R5) Extrato com palestras brutas de 300 minutos e minicursos brutos de 500 minutos → `palestrasMinutos: 300`, `minicursosMinutos: 500`, `totalMinutos: 800` e `aproveitadoMinutos: 740` (min(1200, min(300, 240) + 500)).
8. (R3, R4, R5) Extrato com palestras de 120 minutos e minicursos de 1300 minutos → `totalMinutos: 1420` e `aproveitadoMinutos: 1200` (teto total de 1200).
9. (R3, R4) Extrato com palestras de 250 minutos e nenhum minicurso → `palestrasMinutos: 250` (bruto sem teto) e `aproveitadoMinutos: 240` (teto de palestras).
10. (R3) Extrato com palestras de 90 minutos e nenhum minicurso → `aproveitadoMinutos: 90` (integral, sem teto atingido).
11. (R6) Certificado emitido → `codigo` no formato `SA26-XXXX-XXXX` (bloco fixo `SA26-` mais 4 + 4 caracteres).
12. (R6) Dois certificados emitidos para participantes distintos → códigos diferentes entre si.
13. (R7) Verificação pública do certificado de `p-carla` (Carla Mendes Souza) → `participante: "Carla M. S."`.
14. (R7) Verificação pública de `p-elisa` (Elisa Fernandes da Rocha) → `participante: "Elisa F. da Rocha"`; de `p-isadora` (Isadora Ribeiro dos Santos) → `participante: "Isadora R. dos Santos"`.
15. (R8) `GET /certificados/:codigo` sem o cabeçalho `X-Usuario` → 200 com exatamente `codigo`, `participante` (abreviado), `atividade`, `cargaHorariaMinutos` e `emitidoEm`.
16. (R8) A resposta de verificação pública não expõe `participanteId`, `presencas` nem `encontros`.
17. (R9) Primeira solicitação de `POST /atividades/:id/certificado` → 201; segunda solicitação para a mesma atividade e o mesmo participante → 200 com o mesmo `codigo` e o mesmo `emitidoEm`, sem nova emissão.
18. (R10) Participante com inscrição confirmada em duas atividades, uma com certificado emitido e outra sem → `GET /extrato` retorna `itens` com as duas atividades; o item da atividade com certificado tem `codigo` preenchido e o da outra tem `codigo: null`.
19. (R11) Certificado emitido → todos os caracteres do `codigo` pertencem a letras maiúsculas e dígitos, exceto `I`, `O`, `0` e `1`.
20. (R12) Atividade não encerrada com participante com 50% de presença (abaixo do mínimo de 75%) → `POST /atividades/:id/certificado` → 422 `ATIVIDADE_NAO_ENCERRADA` (e não `PRESENCA_INSUFICIENTE`).
21. (R13) Participante com inscrição `confirmada` em uma atividade sem certificado emitido → a atividade consta no `itens` do `GET /extrato`, com `codigo: null`.
22. (R14) Participante com inscrição `em_espera` em uma atividade → a atividade **não** consta no `itens` do `GET /extrato`.
23. (R15) Participante com inscrição `convocada` em uma atividade → a atividade **não** consta no `itens` do `GET /extrato`.
24. (R16) Participante com inscrição `cancelada` em uma atividade → a atividade **não** consta no `itens` do `GET /extrato`.
25. (R17) Participante com inscrição `expirada` em uma atividade → a atividade **não** consta no `itens` do `GET /extrato`.
26. (R18) Atividade cancelada com inscrição `confirmada` do participante → a atividade **não** consta no `itens` do `GET /extrato`.

## 7. Como será verificado
A verificação será realizada externamente (sem leitura de código), pela camada HTTP:
- Utilizando testes automatizados (Supertest/Vitest) com `MODO_TESTE=1`, `POST /_teste/reset` e `PUT /_teste/relogio`, exercitando a emissão (`POST /atividades/:id/certificado`), a listagem de próprios certificados (`GET /certificados`), a verificação pública sem `X-Usuario` (`GET /certificados/:codigo`) e o extrato (`GET /extrato`).
- Os cenários de contorno são montados com as rotas existentes da API (criação de atividade e encontros via rotas do M1, registro de presenças via rotas do M3) e com o avanço do relógio controlado; a dependência de presenças do M3 é exercitada com dados conhecidos nos testes do módulo.
- Cada regra da spec tem pelo menos um cenário automatizado correspondente, e a demonstração pode ser repetida após `POST /_teste/reset`, sem depender da leitura do código de produção.

## 8. Fatias de entrega
1. **Fatia 1 — emissão do certificado**
   - `POST /atividades/:id/certificado` com presença mínima (R1), emissão somente após o encerramento (R2), precedência de `ATIVIDADE_NAO_ENCERRADA` sobre `PRESENCA_INSUFICIENTE` (R12) e idempotência 201/200 (R9).
2. **Fatia 2 — código e listagem**
   - Geração do código no formato `SA26-XXXX-XXXX` com unicidade (R6) e alfabeto permitido (R11), e `GET /certificados` listando somente os emitidos do participante.
3. **Fatia 3 — verificação pública**
   - `GET /certificados/:codigo` sem `X-Usuario` (R8), com a abreviação do nome (R7) e a projeção somente dos campos públicos.
4. **Fatia 4 — extrato de horas complementares**
   - `GET /extrato` com cargas brutas (R3), teto de palestras (R4), teto total e fórmula de `aproveitadoMinutos` (R5), composição dos itens com `codigo` preenchido ou `null` (R10) e elegibilidade dos itens por status de inscrição e situação da atividade (R13 a R18).

---

## Apêndice A: Matriz Regra → Critério de aceite
- R1 → Critérios 1, 2, 3, 4
- R2 → Critérios 5, 6
- R3 → Critérios 7, 8, 9, 10
- R4 → Critérios 7, 8, 9
- R5 → Critérios 7, 8
- R6 → Critérios 11, 12
- R7 → Critérios 13, 14
- R8 → Critérios 15, 16
- R9 → Critério 17
- R10 → Critério 18
- R11 → Critério 19
- R12 → Critério 20
- R13 → Critério 21
- R14 → Critério 22
- R15 → Critério 23
- R16 → Critério 24
- R17 → Critério 25
- R18 → Critério 26

## Apêndice B: Matriz Origem → Regra/Seção
- P-01 → R1
- P-02 → R2
- P-03 → R3, R4, R5
- P-04 → R6
- P-05 → R7, R8
- P-06 → R9
- P-07 → R10
- P-08 → R11
- P-09 → R12
- P-10 → R13
- P-11 → R14
- P-12 → R15
- P-13 → R16
- P-14 → R17
- P-15 → R18
- RN-210 → R16, R17
- RN-214 → R15
- RN-302 → R11
- RN-401 → R2
- RN-402 → R18
- RN-403 → R13, R14, R15, R16, R17
- RN-404 → R1
- RN-407 → R6, R9, R11
- RN-408 → R7, R8
- RN-409 → R7, R8
- RN-410 → R10, R13, R14, R15, R16, R17, R18
- RN-411 → R3, R4
- RN-412 → R5
- RN-413 → R12
- contrato-api.md → Modelo, Endpoints, R1 (código `PRESENCA_INSUFICIENTE`), R2 (código `ATIVIDADE_NAO_ENCERRADA`)