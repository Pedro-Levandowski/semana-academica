---
name: tdd-m4
description: Implementa M4-certificados por TDD, fatia a fatia — vermelho, verde, refactor. Use quando existir specs/M4-certificados.md e o agente for implementar ou continuar a implementação do módulo de certificados.
---

# TDD para M4-certificados

A fonte de verdade é `specs/M4-certificados.md`. Não invente regras de negócio.
Não altere a spec. Não acesse documentos externos de requisitos.

O ciclo é o mesmo do `tdd` geral — teste que falha, código mínimo, refactor — mas
ancorado nas 4 fatias e 18 regras de M4. Uma regra ou grupo coeso por ciclo TDD.

## Onde o teste mora

Teste verifica comportamento pela interface pública (HTTP), nunca implementação.
Use Vitest + Supertest, a aplicação Express de `createApp()` sem abrir porta,
e as rotas `/_teste/*` com `MODO_TESTE=1` para setup e controle do relógio.

Arquivos de teste em `api/tests/`. Para rodar: `npm --prefix api test`.

Regra do projeto: não importe serviço nem repositório no teste — se importar,
o teste quebra em refatoração sem que o comportamento tenha mudado.

## Fatias e regras

Cada fatia é um entregável vertical que pode ser testado sozinho.
Implemente as fatias nesta ordem. Dentro de cada fatia, uma regra ou grupo
coeso de regras por ciclo TDD.

### Fatia 1 — emissão do certificado

| Regra | Descrição | Critérios de aceite |
|-------|-----------|---------------------|
| R1 | Presença mínima de 75% (`presencas / encontros`, sem arredondamento) | 1, 2, 3, 4 |
| R2 | Emissão somente após encerramento da atividade | 5, 6 |
| R12 | Precedência: `ATIVIDADE_NAO_ENCERRADA` antes de `PRESENCA_INSUFICIENTE` | 20 |
| R9 | Idempotência: 201 na primeira vez, 200 nas seguintes, mesmo código | 17 |

Ordem sugerida dentro da fatia:
1. R1 — teste presence check, implemente, refactor.
2. R2 — teste encerramento, implemente, refactor.
3. R12 — teste precedência quando ambos falham, implemente, refactor.
4. R9 — teste idempotência 201→200, implemente, refactor.
5. Validação adicional do contrato — teste `ATIVIDADE_CANCELADA` na emissão e sua precedência sobre as demais regras, implemente, refactor.

### Fatia 2 — código e listagem

| Regra | Descrição | Critérios de aceite |
|-------|-----------|---------------------|
| R6 | Formato `SA26-XXXX-XXXX`, unicidade, mesmo código na reemissão | 11, 12 |
| R11 | Alfabeto: maiúsculas + dígitos, sem `I`, `O`, `0`, `1` | 19 |

Ordem sugerida dentro da fatia:
1. R6 — teste formato e unicidade, implemente geração, refactor.
2. R11 — teste exclusão de caracteres ambíguos, implemente, refactor.
3. R9 (continuação) — teste `GET /certificados` retornando apenas emitidos.

### Fatia 3 — verificação pública

| Regra | Descrição | Critérios de aceite |
|-------|-----------|---------------------|
| R8 | `GET /certificados/:codigo` sem `X-Usuario`, campos públicos apenas | 15, 16 |
| R7 | Abreviação do nome: primeiro nome + iniciais + partículas por extenso | 13, 14 |

Ordem sugerida dentro da fatia:
1. R8 — teste rota pública sem header, campos corretos, implemente, refactor.
2. R7 — teste abreviação com partículas, implemente, refactor.

### Fatia 4 — extrato de horas complementares

| Regra | Descrição | Critérios de aceite |
|-------|-----------|---------------------|
| R3 | Cargas brutas: `palestrasMinutos`, `minicursosMinutos`, `totalMinutos` sem teto | 7, 8, 9, 10 |
| R4 | Teto de palestras: `min(240, palestrasMinutos)` | 7, 8, 9 |
| R5 | Teto total: `aproveitadoMinutos = min(1200, min(240, palestrasMinutos) + minicursosMinutos)` | 7, 8 |
| R10 | Itens do extrato: `codigo` preenchido ou `null` conforme emissão | 18 |
| R13 | Inscrição `confirmada` é elegível para o extrato | 21 |
| R14 | Inscrição `em_espera` não é elegível para o extrato | 22 |
| R15 | Inscrição `convocada` não é elegível para o extrato | 23 |
| R16 | Inscrição `cancelada` não é elegível para o extrato | 24 |
| R17 | Inscrição `expirada` não é elegível para o extrato | 25 |
| R18 | Atividade cancelada não é elegível para o extrato | 26 |

Ordem sugerida dentro da fatia:
1. R3+R4+R5 — teste cálculos de extrato (juntos, são uma unidade coesa), implemente, refactor.
2. R10+R13 — teste composição dos itens com código/null e a elegibilidade da inscrição confirmada, implemente, refactor.
3. R14, R15, R16, R17 — teste não elegibilidade das inscrições `em_espera`, `convocada`, `cancelada` e `expirada`, implemente, refactor.
4. R18 — teste exclusão de atividade cancelada, implemente, refactor.

## O ciclo TDD, passo a passo

Para cada regra (ou grupo coeso), nestes passos:

1. **RED**: Escreva um teste que prova o critério de aceite. Rode. **Ele tem que falhar.**
   Se passar antes do código existir, algo está errado — descubra o quê antes de seguir.
   O nome do teste descreve a regra em português:
   `it('recusa certificado com menos de 75% de presenca')`.

2. **GREEN**: Escreva o mínimo de código que faz o teste passar.
   Nada de já implementar a regra seguinte "que eu vou precisar mesmo".
   Rode o teste individual. Verde? Rode a suíte inteira. Verde? Próximo passo.

3. **REFACTOR**: Com verde, limpe o código sem alterar comportamento.
   Extraia funções, melhore nomes, remova duplicação. Rode a suíte inteira de novo.
   Ainda verde? Próxima regra.

## A regra que não se quebra

**Quando o teste falha, o suspeito é o código.**

Se você mudar um teste para ele passar, trocou o contrato pela implementação e o
verde virou enfeite. Só se altera um teste quando a **spec** mudou — e aí você diz
qual regra da spec mudou e por quê.

Vale para o valor esperado, para o status HTTP e para o cenário. Trocar
`expect(response.body.presencas).toBe(3)` por `expect(response.body.presencas).toBe(0)`
porque o código deu 0 é a forma mais comum de mentir sozinho.

## Três testes que não valem nada

- **Acoplado à implementação** — chama serviço ou repositório direto, ou confere o
  dado espiando o `Map`/banco. Quebra em refatoração, não em regressão.
- **Tautológico** — o esperado é calculado do mesmo jeito que o código calcula.
  Passa por construção, nunca discorda. O valor esperado vem da spec, escrito na mão.
- **Frouxo** — confere só o status e ignora o corpo. `201` com o `codigo` errado passa.

## Dependências de M2 e M3

M4 depende de dados que vêm de outros módulos. Não implemente esses módulos —
use as interfaces e portas de integração que já existem.

### M3 — Presenças

- Porta: `M3PresencePort` em `src/integrations/m3-presence-port.ts`
- Método: `countPresencas(atividadeId, participanteId) → number`
- Estado atual: `NeutralM3PresenceAdapter` retorna sempre 0.
- Para testes de emissão (R1), registre presenças via rotas HTTP do M3
  (`POST /encontros/:id/presencas`) no setup do teste. O adapter real do M3
  deve ser ativado em ambiente de teste, ou o teste deve montar o cenário
  pelas rotas existentes da API.
- Se M3 não estiver funcional, documente o bloqueio e não simule dados.

### M2 — Inscrições

- Porta: `M2IntegrationPort` em `src/integrations/m2-port.ts`
- Estado atual: `NeutralM2Adapter` não expõe listagem de inscrições por participante.
- Para R10 (extrato), M4 precisa saber em quais atividades o participante está
  inscrito e se há certificado emitido para cada uma.
- Se a porta de M2 não fornecer esse dado, documente o bloqueio — não invente
  persistência de inscrições dentro de M4.

### M1 — Atividades

- Já acessível via `ActivityRepository`. M4 precisa de `titulo`, `tipo`,
  `cargaHorariaMinutos`, `encontros` (total de encontros) e `dataTermino`
  (para R2).
- Não altere o repositório de M1. Se faltar campo, documente o bloqueio.

## Validações adicionais do contrato

Além das regras R1–R18, o `contrato-api.md` lista códigos de erro que o M4
deve retornar. Teste-os quando implementar a rota correspondente:

| Código | HTTP | Quando |
|--------|------|--------|
| `NAO_INSCRITO` | 403 | Participante não inscrito na atividade |
| `ATIVIDADE_CANCELADA` | 422 | Atividade foi cancelada |
| `ATIVIDADE_NAO_ENCERRADA` | 422 | Atividade ainda não encerrada (R2) |
| `PRESENCA_INSUFICIENTE` | 422 | Presença abaixo de 75% (R1) |

## Execução e verificação

Após cada regra implementada (GREEN + REFACTOR):

1. Rode `npm --prefix api test` — suíte inteira tem que estar verde.
2. Rode `npx tsc --noEmit` dentro de `api/` — typecheck tem que passar.
3. Se falhar, corrija antes de seguir para a próxima regra.

Terminada a última fatia, rode a suíte inteira uma vez e relate o número real
de testes que apareceu na saída. Não estime, não arredonde.

## Commits

Faça commits pequenos, um por regra ou grupo coeso de regras dentro da fatia.
Mensagem no padrão do projeto, identificando a regra:

```
M4: implementa R1 — presença mínima de 75%
M4: implementa R2 — emissão após encerramento
M4: implementa R9 — idempotência 201/200
```

Antes de commitar, verifique `git status` e `git diff` para confirmar que
apenas arquivos intencionais estão staged.

## Rastreabilidade

Cada regra da spec deve ter:
- Pelo menos um teste que a comprove (critério de aceite correspondente).
- Implementação que o teste exercita.
- Referência explícita: nome do teste cita a regra, commit cita a regra.

Se uma regra não tem teste, ela não está implementada — pare e escreva o teste.

## O que não fazer

- Não acesse documentos externos de requisitos.
- Não altere `specs/M4-certificados.md`.
- Não altere `contrato-api.md`.
- Não implemente código de M1, M2 ou M3 — apenas use suas portas/interfaces.
- Não altere testes existentes apenas para fazê-los passar.
- Não altere código de outros módulos.
- Não faça commit de código que não esteja verde na suíte inteira.
