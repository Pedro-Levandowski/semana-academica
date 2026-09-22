# Rodada 2 do M3: entrevistas/M3-presenca.md

| | |
|---|---|
| Sessão | `ses_f53775565ffe9OKEK9EtoBULfK` |
| Pasta | Trabalho Opencode/semana-academica |
| Período | 16/09 20:23 → 16/09 22:22 |
| Modelo | google/gemini-3.5-flash-lite |
| Requisições ao modelo | 57 |
| Tokens de entrada / saída | 628.661 / 12.309 |
| Skills | — |
| Subagentes | — |
| Execuções de teste | 0 vermelhas, 0 verdes |
| TDD | 0 ciclo(s) vermelho → verde · 0 teste(s) que já nasceram verdes · 0 vez(es) teste e código juntos |
| Arquivos editados | 0 de teste, 0 de código, 16 de entrevista, 0 de spec, 0 de contexto, 0 de auditoria |
| Alertas | — |

## Linha do tempo

- `16/09 20:23` **prompt** — Vamos fazer a Rodada 2 do M3. Leia entrevistas/M3-presenca.md. Vou responder as perguntas marcadas como Pendente, uma de cada vez, com minhas próprias palavras e citando a regra oficial quando existir. Registre cada resposta no lugar certo (Resposta e Fonte) sem criar perguntas novas e sem alterar respostas já resolvidas. Não altere nenhum outro trecho do arquivo. Vamos começar pela P-01.
- `16/09 20:28` **prompt** — A duração da janela vai funcionar assim, vai ser de 15 minutos antes até 30 minutos depois do início do encontro, incluindo essas bordas. Além dessa janela, a organização não vai consegui obter o código, e também não é possível conseguir o código de uma atividade cancelada. (RN-301, RN-302)
- `16/09 20:28` edita entrevista `entrevistas/M3-presenca.md` (2×)
- `16/09 20:34` **prompt** — Antes de continuar, corrija a P-01: você duplicou as linhas de Resposta e Fonte. Remova as duas linhas antigas que ainda dizem "(Pendente)" e "(Pendente — Consultar requisitos)", deixando só a Resposta e a Fonte novas que você acabou de escrever. Não altere mais nada no arquivo.
- `16/09 20:34` **prompt** — Antes de continuar, me mostre exatamente como ficou a seção da P-01 agora no arquivo, mostrando as linhas de Resposta e Fonte.
- `16/09 20:44` **prompt** — Certo, a resposta para a P-02 agora: O código muda a cada minuto, ele se alinha ao relógio (de hh:mm:00 até hh:mm:59). São aceitos o código do minuto atual e o do minuto imediatamente anterior. Qualquer código mais antigo ou de outro encontro é inválido. O formato tem 6 caracteres, usando um alfabeto que evite letras e números parecidos (sem 0, O, 1, I). (RN-303, RN304, RN-305)
- `16/09 20:44` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 20:44` **prompt** — Antes de continuar, corrija a P-02 removendo as duas linhas antigas (*(Pendente)* e *(Pendente — Consultar requisitos)*), deixando só a Resposta e Fonte novas — igual você fez com a P-01. Além disso, para todas as próximas perguntas: ao registrar uma resposta, SUBSTITUA as linhas antigas de Resposta e Fonte pelo texto novo, em vez de adicionar linhas extras. Confirme que entendeu antes de irmos p…
- `16/09 21:42` **prompt** — A resta do P-03: Quando o campo lidoEm é enviado, a janela e a validade do código são conferidas usando o instante da leitura, e não o instante do envio. Isso só é aceito até 2 horas depois do fim do encontro; passado esse prazo, o sistema retorna SINCRONIZACAO_TARDIA. (RN-308, RN-310)
- `16/09 21:42` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:46` **prompt** — A presença manual só pode ser feita pela organização, exclusivamente para participante com inscrição confirmada, e exige uma justificativa com no mínimo 10 caracteres. Pode ser lançada desde a abertura da janela normal até 2 horas depois do fim do encontro. O limite é de 10% das inscrições confirmadas daquele encontro, arredondando para cima. (RN-311, RN-312, RN-313)
- `16/09 21:46` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:46` **prompt** — Só participante com inscrição confirmada pode ter presença registrada, seja por QR ou manual. Se não estiver confirmado, o sistema retorna o erro 403 NAO_INSCRITO. (RN-306)
- `16/09 21:46` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:47` **prompt** — O código gerado é vinculado exclusivamente ao encontro que o gerou. Se o código pertencer a outro encontro, o sistema recusa como inválido — não existe reaproveitamento entre encontros diferentes. (RN-304)
- `16/09 21:47` edita entrevista `entrevistas/M3-presenca.md` (2×)
- `16/09 21:47` **prompt** — Na leitura do código, o sistema aceita letras minúsculas e ignora espaços digitados pelo participante. (RN-305)
- `16/09 21:47` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:47` **prompt** — Só existe uma presença por participante e encontro. Se a mesma presença for enviada de novo, o sistema não cria duplicata: retorna 200 com a presença que já existia. Essa checagem acontece antes de qualquer outra regra do módulo. No primeiro registro, retorna 201. (RN-307)
- `16/09 21:47` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:48` **prompt** — Quando o campo lidoEm não é enviado, o sistema usa o próprio instante do envio da requisição como referência de leitura.
- `16/09 21:48` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:49` **prompt** — Antes de continuar, corrija a P-09: remova as duas linhas antigas (*(Pendente)* e *(Pendente — Consultar requisitos)*), deixando só a Resposta e Fonte novas. Isso está se repetindo em várias perguntas — a partir de agora, depois de CADA edição, releia a seção da pergunta que acabou de editar e me mostre o resultado final antes de perguntar a próxima, para eu confirmar que não duplicou.
- `16/09 21:51` **prompt** — Para registro pelo participante, a ordem de checagem é: encontro inexistente (404), presença já existente (200), não inscrito, sincronização tardia, fora da janela, código inválido. Para presença manual, a ordem é: justificativa, presença já existente (200), não inscrito, fora da janela, limite de manuais. (RN-314)
- `16/09 21:51` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:51` **prompt** — Essa pergunta não corresponde a nenhuma regra oficial do documento de requisitos — foi uma pergunta adicional que o próprio agente levantou por conta própria. Não há resposta oficial obrigatória aqui; ficará como decisão de design da equipe, sem regra RN associada.
- `16/09 21:51` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:52` **prompt** — Se o lidoEm informado for posterior ao instante em que a requisição chegou ao servidor, o sistema considera o instante do envio como o momento efetivo — ou seja, um celular adiantado não pode gerar uma leitura no futuro. (RN-309)
- `16/09 21:52` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:52` **prompt** — A origem registrada pode ser: qr, quando lida e enviada na hora; qr_offline, quando enviada com lidoEm; ou manual, quando lançada pela organização. (RN-315)
- `16/09 21:52` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 21:53` **prompt** — Mesmo que o código tenha o formato correto de 6 caracteres, o servidor só considera válido o código do minuto atual ou do minuto imediatamente anterior, e apenas se pertencer ao encontro correto. Qualquer outro caso retorna CODIGO_INVALIDO. (RN-303, RN-304)
- `16/09 21:53` edita entrevista `entrevistas/M3-presenca.md`
- `16/09 22:22` **prompt** — opencode
