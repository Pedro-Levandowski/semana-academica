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
