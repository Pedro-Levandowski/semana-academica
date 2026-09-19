# Entrevista — M4 Certificados e Horas Complementares

## Rodada 1

| # | Pergunta | Resposta |
|---|----------|----------|
| P1 | Presença mínima para certificado — qual percentual mínimo de presenças (em relação ao total de encontros da atividade)? | PENDENTE |
| P2 | Certificado só após encerramento — só pode emitir depois que `situacao: "encerrada"`? Ou pode emitir durante a atividade? | PENDENTE |
| P3 | Horas complementares — regra de contagem: minicurso conta 100% e palestra 50%? Existe teto por tipo? Existe teto total? Qual a fórmula de `aproveitadoMinutos`? | PENDENTE |
| P4 | Código do certificado — formato `SA26-7K2M-9QXA` é fixo? Quem gera (UUID + formatação no backend)? | PENDENTE |
| P5 | Verificação pública — truncagem do nome (`Carla M. S.`) é regra de negócio (primeiro nome + iniciais) ou o contrato define o formato? | PENDENTE |
| P6 | Um certificado por atividade — idempotente (primeiro 201, depois 200)? | PENDENTE |

## Rodada 2

| # | Resposta | Fonte |
|---|----------|-------|
| P1 | Participante precisa de presença em pelo menos 75% dos encontros da atividade para ter direito ao certificado, sem arredondamento a favor dele. | RN-404 |
| P2 | Certificado só pode ser emitido depois que o último encontro da atividade terminar. Antes desse momento, a emissão não é permitida. | RN-401 |
| P3 | Minicursos e palestras contam pela carga horária integral. Das palestras, aproveita-se no máximo 240 minutos (4 horas). Depois de aplicar esse limite às palestras, o total de horas complementares aproveitadas (palestras + minicursos) fica limitado a 1200 minutos (20 horas). | RN-411 e RN-412 |
| P4 | Formato do código é fixo: SA26-XXXX-XXXX. Os caracteres usam o alfabeto definido para os códigos do sistema, e cada certificado tem código único. O código é criado na primeira emissão e não muda nas reemissões. | RN-407 |
| P5 | A abreviação é regra de negócio. Na verificação pública aparece o primeiro nome completo e as iniciais dos demais nomes com ponto. Partículas de, da, do, das e dos permanecem por extenso e minúsculas. A consulta é pública, sem X-Usuario, e exibe somente nome abreviado, atividade, carga horária e data de emissão. | RN-408 e RN-409 |
| P6 | A emissão é idempotente. Na primeira emissão o certificado é criado e retorna 201. Nas solicitações seguintes para a mesma atividade e participante, retorna 200 com o mesmo certificado e o mesmo código, sem criar nova emissão. | RN-407 |

## Rodada Complementar

| # | Pergunta | Resposta |
|---|----------|----------|
| P7 | Composição dos itens do extrato — quando o campo `codigo` do item deve vir preenchido e quando deve vir `null`? | PENDENTE |
| P8 | Alfabeto do código do certificado — quais caracteres são permitidos nos 8 caracteres do formato `SA26-XXXX-XXXX` (ex.: `0-9A-Z` completo ou alfabeto restrito)? | PENDENTE |
| P9 | Precedência de erros na emissão — entre `ATIVIDADE_NAO_ENCERRADA` e `PRESENCA_INSUFICIENTE`, qual aparece primeiro quando ambos se aplicam? | PENDENTE |

## Rodada Complementar 2

| # | Resposta | Fonte |
|---|----------|-------|
| P7 | O extrato deve listar todas as atividades em que o participante está inscrito. Em cada item, o campo codigo deve conter o código do certificado quando ele já tiver sido emitido para aquela atividade. Se ainda não houver certificado emitido, o campo codigo deve ser null. | RN-410 |
| P8 | O código do certificado deve usar letras maiúsculas e dígitos, excluindo os caracteres I, O, 0 e 1 para evitar ambiguidades. Esse é o mesmo alfabeto utilizado pelos códigos de presença. | RN-407 e RN-302 |
| P9 | Quando os dois erros puderem ocorrer ao mesmo tempo, ATIVIDADE_NAO_ENCERRADA deve ter precedência sobre PRESENCA_INSUFICIENTE. A validação de encerramento da atividade ocorre antes da validação da frequência. | RN-413 |

## Rodada 1 Complementar

| # | Pergunta | Resposta |
|---|----------|----------|
| P10 | Inscrição confirmada aparece no extrato? | PENDENTE |
| P11 | Inscrição em_espera aparece no extrato? | PENDENTE |
| P12 | Inscrição convocada aparece no extrato? | PENDENTE |
| P13 | Inscrição cancelada aparece no extrato? | PENDENTE |
| P14 | Inscrição expirada aparece no extrato? | PENDENTE |
| P15 | Atividade cancelada permanece no extrato? | PENDENTE |
