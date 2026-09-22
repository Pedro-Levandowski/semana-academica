# Respondendo pendências em M4-certificados.md

| | |
|---|---|
| Sessão | `ses_f5a5ee375ffeh5n6at56SDVDDt` |
| Pasta | Semana Tech/semana-academica |
| Período | 15/09 12:13 → 15/09 13:41 |
| Modelo | opencode/big-pickle |
| Requisições ao modelo | 16 |
| Tokens de entrada / saída | 87.963 / 3.717 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 6 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `15/09 12:13` **prompt** — Vamos responder as perguntas marcadas como PENDENTE em entrevistas/M4-certificados.md, uma de cada vez. Eu consultei o documento de requisitos fora do repositório e vou fornecer cada resposta com minhas próprias palavras, citando a regra RN correspondente. Registre cada resposta na Rodada 2 e preencha a fonte correspondente. Não crie perguntas novas. Não altere as respostas da Rodada 1. Não consu…
- `15/09 12:14` **prompt** — O participante precisa ter presença em pelo menos 75% dos encontros da atividade para ter direito ao certificado, sem arredondar o percentual a favor dele. Fonte: RN-404.
- `15/09 12:14` edita entrevista `entrevistas/M4-certificados.md` (2×)
- `15/09 12:15` **prompt** — O certificado só pode ser emitido depois que o último encontro da atividade terminar. Antes desse momento, a emissão não é permitida. Fonte: RN-401.
- `15/09 12:15` edita entrevista `entrevistas/M4-certificados.md`
- `15/09 13:36` **prompt** — Minicursos e palestras contam pela sua carga horária integral. Porém, das palestras podem ser aproveitados no máximo 240 minutos (4 horas). Depois de aplicar esse limite às palestras, o total de horas complementares aproveitadas, somando palestras e minicursos, fica limitado a 1200 minutos (20 horas). Fontes: RN-411 e RN-412.
- `15/09 13:36` edita entrevista `entrevistas/M4-certificados.md`
- `15/09 13:37` **prompt** — O formato do código é fixo: SA26-XXXX-XXXX. Os caracteres devem usar o alfabeto definido para os códigos do sistema, e cada certificado deve ter um código único. O código é criado na primeira emissão e não pode mudar nas reemissões. Fonte: RN-407.
- `15/09 13:37` edita entrevista `entrevistas/M4-certificados.md`
- `15/09 13:38` **prompt** — A abreviação é uma regra de negócio. Na verificação pública deve aparecer o primeiro nome completo e as iniciais dos demais nomes com ponto. As partículas de, da, do, das e dos permanecem por extenso e em minúsculas. A consulta é pública, sem X-Usuario, e deve exibir somente nome abreviado, atividade, carga horária e data de emissão. Fontes: RN-408 e RN-409.
- `15/09 13:39` **prompt** — Sim. A emissão é idempotente. Na primeira emissão o certificado é criado e retorna 201. Nas solicitações seguintes para a mesma atividade e participante, deve retornar 200 com o mesmo certificado e o mesmo código, sem criar uma nova emissão. Fonte: RN-407.
- `15/09 13:41` **prompt** — Sim. A emissão é idempotente. Na primeira emissão o certificado é criado e retorna 201. Nas solicitações seguintes para a mesma atividade e participante, deve retornar 200 com o mesmo certificado e o mesmo código, sem criar uma nova emissão. Fonte: RN-407.
- `15/09 13:41` edita entrevista `entrevistas/M4-certificados.md`
