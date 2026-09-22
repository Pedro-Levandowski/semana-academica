# Parecer do revisor de contrato — M4 (certificados)

Fontes lidas: `contrato-api.md` (inteiro), `specs/M4-certificados.md` (inteiro), implementação em `api/src/app.ts`, `api/src/certificate/*`, `api/src/repositories/certificate-repository.ts`, portas `api/src/integrations/m2-port.ts` e `m3-presence-port.ts`, migração `api/src/db/migrate.ts`, 16 arquivos de teste da API, e os arquivos da interface (`app/src/api/client.ts`, hooks e componentes M4 com testes). Nenhum documento de requisitos externo foi consultado. Nenhum arquivo foi alterado.

**Alinhamento spec ↔ contrato (procedimento passo 2):** os endpoints, métodos, papéis, campos e status da spec §3–§4 batem exatamente com a seção M4 do `contrato-api.md` (rotas, 201/200 condicional, público sem `X-Usuario`, corpo `Certificado`/`Verificacao`/`Extrato`). Os códigos `PRESENCA_INSUFICIENTE` (422), `ATIVIDADE_NAO_ENCERRADA` (422), `NAO_INSCRITO` (403), `ATIVIDADE_CANCELADA` (422) e `NAO_ENCONTRADO` (404) da spec existem na seção 6 do contrato. **Nenhuma divergência spec↔contrato encontrada.**

---

## Matriz de endpoints

| Método | Rota | Quem | Status sucesso | Status/erro esperado | Implementado? | Achado |
|---|---|---|---|---|---|---|
| POST | `/atividades/:id/certificado` | participante | 201 na 1ª vez; 200 depois | 401, 403 (`SOMENTE_PARTICIPANTE`, `NAO_INSCRITO`), 404, 422 (`ATIVIDADE_CANCELADA`, `ATIVIDADE_NAO_ENCERRADA`, `PRESENCA_INSUFICIENTE`) | SIM | — (ver achado 4, observação de corpo) |
| GET | `/certificados` | participante | 200 `[Certificado]` (só os emitidos do próprio) | 401, 403 | SIM | — |
| GET | `/certificados/:codigo` | público, sem `X-Usuario` | 200 `Verificacao` | 404 `NAO_ENCONTRADO` | SIM | — |
| GET | `/extrato` | participante | 200 `Extrato` | 401, 403 | SIM | — |

Evidências: rota de emissão em `api/src/app.ts:394`; listagem em `api/src/app.ts:432`; extrato em `api/src/app.ts:438`; verificação pública (sem `requireUser`) em `api/src/app.ts:443`. Registro 201/200 em `api/src/app.ts:429`. Projeção pública exata (`codigo`, `participante`, `atividade`, `cargaHorariaMinutos`, `emitidoEm`) em `api/src/app.ts:453-459`.

## Matriz de erros

| Código de erro | Status | Rota | Contrato exige | Implementação retorna | Conforme? |
|---|---|---|---|---|---|
| `USUARIO_DESCONHECIDO` | 401 | POST `/atividades/:id/certificado`, GET `/certificados`, GET `/extrato` | 401 | 401 (`api/src/app.ts:128-141` aplicado em `:394`, `:432`, `:438`) | SIM |
| `USUARIO_DESCONHECIDO` | — | GET `/certificados/:codigo` | rota isenta de `X-Usuario` (contrato §1) | rota não aplica `requireUser` (`api/src/app.ts:443`) — isento corretamente | SIM |
| `SOMENTE_PARTICIPANTE` | 403 | as 3 rotas de participante | 403 | 403 (`api/src/app.ts:396-399` e `requireParticipant` `api/src/app.ts:152-159` em `:432`, `:438`) | SIM |
| `NAO_ENCONTRADO` | 404 | POST certificado (atividade inexistente) | 404 | 404 (`api/src/app.ts:402-406`) | SIM |
| `NAO_ENCONTRADO` | 404 | GET `/certificados/:codigo` (código inexistente) | 404 | 404 (`api/src/app.ts:446`) | SIM |
| `NAO_INSCRITO` | 403 | POST certificado | 403 | 403 (`api/src/certificate/emissao-certificado.ts:49-51` → `api/src/app.ts:425`) | SIM |
| `ATIVIDADE_CANCELADA` | 422 | POST certificado | 422 | 422 (`api/src/certificate/emissao-certificado.ts:43-44` → `api/src/app.ts:425`) | SIM |
| `ATIVIDADE_NAO_ENCERRADA` | 422 | POST certificado | 422 | 422 (`api/src/certificate/emissao-certificado.ts:56-58` → `api/src/app.ts:425`) | SIM |
| `PRESENCA_INSUFICIENTE` | 422 | POST certificado | 422 | 422 (`api/src/certificate/emissao-certificado.ts:62-63` → `api/src/app.ts:425`) | SIM |
| `DADOS_INVALIDOS` | 422 | POST certificado com corpo mal formado | 422 pela convenção genérica do contrato §1 | não aplicado — a rota não instala parser de corpo (`api/src/app.ts:394`) e ignora o corpo | OBSERVAÇÃO (achado 4) |

Precedência (contrato §1: 401 → 403 `SOMENTE_…` → 404 → 422 corpo → regras do recurso): em `api/src/app.ts:394-415` a ordem é `requireUser` (401) → papel (403) → existência (404) → regras de recurso dentro de `EmitirCertificado`. R12 da spec (encerrada antes de presença) implementada em `api/src/certificate/emissao-certificado.ts:53-64` (checagem de término nas linhas 53-58 antes da contagem de presenças nas linhas 60-63). A ordem entre `ATIVIDADE_CANCELADA`/`NAO_INSCRITO` e as demais regras de recurso é regra de negócio (contrato §1) e a spec não a fixa — colocação aceitável. `NAO_INSCRITO` (403, regra de recurso) ocorre após o 404, conforme o rótulo do contrato ("perfil (403 `SOMENTE_…`)") — CONFORME.

Regras da spec verificadas na implementação:
- **R1** (fração exata 75% sem arredondamento): `presencas * 4 < encontros * 3` em `api/src/certificate/emissao-certificado.ts:62` — 3/4 emite, 2/4 e 3/5 recusam. CONFORME.
- **R2** (emissão após término; instante exato permite): `agora < fimDoUltimoEncontro` recusa em `api/src/certificate/emissao-certificado.ts:56` — instante exato não é menor, logo emite. Usa `clock.now()` (`:53`), não `Date` do sistema. CONFORME.
- **R3/R4/R5** (brutas sem teto, teto 240 palestras, teto total 1200): `api/src/certificate/horas-complementares.ts:12-29` (`Math.min(240, …)` e `Math.min(1200, …)`). CONFORME.
- **R6** (formato `SA26-XXXX-XXXX`, unicidade): `api/src/certificate/gerar-codigo.ts:8`; PK em `codigo` (`api/src/db/migrate.ts:62`); retry de colisão em `api/src/certificate/emissao-certificado.ts:76-94`. CONFORME.
- **R7** (abreviação): `api/src/certificate/abreviar-nome.ts:4-32`; exemplos da spec cobertos em `api/tests/abreviar-nome.test.ts:6-16` e no HTTP `api/tests/certificado-r8.test.ts:104`. CONFORME (com observação informativa no achado 6).
- **R8** (público sem `X-Usuario`, só campos públicos): `api/src/app.ts:443-459`; testes critérios 15 e 16 em `api/tests/certificado-r8.test.ts:82-128`. CONFORME.
- **R9** (idempotência 201/200, mesmo código/`emitidoEm`): `api/src/certificate/emissao-certificado.ts:66-69` + `api/src/app.ts:429`; testes em `api/tests/certificado.test.ts:175-193` e `api/tests/certificado-r9.test.ts`. CONFORME.
- **R10** (itens com código preenchido ou `null`, recalculado): `api/src/certificate/extrato.ts:41-47`. CONFORME.
- **R11** (alfabeto sem `I`, `O`, `0`, `1`, mesmo da presença): `api/src/certificate/gerar-codigo.ts:3` (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) = mesmo conjunto de `api/src/application/get-codigo-do-encontro.ts:8` e `register-presenca.ts:10` (ordem distinta, conjunto idêntico). CONFORME.
- **R12**: ver acima. CONFORME.
- **R13–R17** (só inscrição `confirmada` elegível): filtro em `api/src/certificate/extrato.ts:34-36`, via porta M2 `api/src/integrations/m2-port.ts:72-86` (status atual por atividade, deduplicado; `findByActivityAndParticipant` prioriza status ativos em `api/src/repositories/inscricao-repository.ts:25-35`, cobrindo re-inscrição). CONFORME.
- **R18** (atividade cancelada fora do extrato): `api/src/certificate/extrato.ts:38`. CONFORME.

## Dependências de módulos externos

- **M4 ↔ M3 (presenças):** contagem por `SQLiteM3PresenceAdapter.countPresencas` (`api/src/integrations/m3-presence-port.ts:14-28`), que conta encontros da atividade com presença do participante (não linhas brutas). Dependência satisfeita e exercitada nos testes via rotas do M3 (`api/tests/certificado-g3-presenca-offline.test.ts`, `api/tests/certificado-g3-presenca-manual.test.ts`, cenários QR em `api/tests/certificado.test.ts:56-68`).
- **M4 ↔ M2 (inscrições):** `M2IntegrationPort.listarInscricoesDoParticipante` (`api/src/integrations/m2-port.ts:72-86`) para exigir `confirmada` na emissão (`emissao-certificado.ts:47-51`) e filtrar o extrato. Satisfeita; exercitada via rotas do M2 nos testes.
- **M4 ↔ M1 (atividades/encontros/carga):** snapshot de encontros, `cargaHorariaMinutos` e `cancelada` via `ActivityRepository` (`api/src/repositories/activity-repository.ts:22-59`), montado na rota `api/src/app.ts:401-415`. Satisfeita.
- O módulo não escreve em tabelas de outros módulos: só lê `atividades`/`encontros`/`presencas`/`inscricoes` por repositórios/portas e grava em `certificados` (`api/src/db/migrate.ts:61-71`).

## Suíte

Comandos exigidos por `projeto.json` (`projeto.json:8-11`):

- `npm --prefix api test` → **40 arquivos de teste, 273 testes, todos passaram** (duração 14,78s). Dos quais, arquivos do M4: `certificado.test.ts` (7), `certificado-atividade-cancelada.test.ts` (2), `certificado-contrato-http.test.ts` (6), `certificado-colisao.test.ts` (1), `certificado-g3-presenca-manual.test.ts` (1), `certificado-g3-presenca-offline.test.ts` (1), `certificado-listagem.test.ts` (5), `certificado-nao-inscrito.test.ts` (5), `certificado-r8.test.ts` (3), `certificado-r12.test.ts` (1), `certificado-r9.test.ts` (1), `certificado-restart.test.ts` (1), `extrato.test.ts` (14), `horas-complementares.test.ts` (16), `gerar-codigo.test.ts` (12), `abreviar-nome.test.ts` (14) — **90 testes do M4, todos verdes**.
- `npm --prefix app test` → **10 arquivos de teste, 136 testes, todos passaram** (duração 12,10s). M4 na interface: `ExtratoHoras.test.tsx` (6), `MeusCertificados.test.tsx` (5), `VerificarCertificado.test.tsx` (6) e o bloco M4 de `api/client.test.ts` — todos verdes. Aparecem avisos `stderr` de `act(...)` em `App.test.tsx`, sem falhas e sem relação com M4.

Os testes confirmam: status/código de erro, efeito persistido (1 linha por par em `certificado-r9.test.ts:96-99`), campos exatos das respostas e precedência. A interface usa os caminhos exatos do contrato (`app/src/api/client.ts:175-191`) e apresenta `{erro, mensagem}`.

## Achados

1. [CONFORME] Endpoints — os quatro endpoints do M4 existem, com método, caminho, papel e status de sucesso exatos do contrato: `POST /atividades/:id/certificado` (`api/src/app.ts:394`, 201/200 em `:429`), `GET /certificados` (`:432`), `GET /certificados/:codigo` (`:443`), `GET /extrato` (`:438`).
2. [CONFORME] Quem acessa e Headers — `X-Usuario` validado com 401 e 403 `SOMENTE_PARTICIPANTE` nas rotas identificadas; a verificação pública é a única rota M4 sem exigência de cabeçalho, como manda o contrato §1 (`api/src/app.ts:443` vs `:394`, `:432`, `:438`).
3. [CONFORME] Sucesso e erros — corpos `Certificado`, `[Certificado]`, `Verificacao` e `Extrato` com os campos exatos do contrato (`emissao-certificado.ts:19-27`, `certificate-repository.ts:81-89`, `app.ts:453-459`, `extrato.ts:14-20`); todos os status/códigos da matriz de erros conferem; precedência 401→403→404→regras respeitada (`app.ts:394-415`); R12 em `emissao-certificado.ts:53-64`; idempotência 201/200 conforme (`app.ts:429`, `emissao-certificado.ts:66-69`).
4. [OBSERVAÇÃO — BAIXA] `DADOS_INVALIDOS` não coberto na emissão — o contrato §1 exige `422 DADOS_INVALIDOS` para "corpo que não é JSON", mas `POST /atividades/:id/certificado` não instala `express.json()` nem validação de corpo (`api/src/app.ts:394`); um corpo malformado seria ignorado e a emissão prosseguiria. Como o contrato/spec não definem corpo de entrada para esta rota (spec §4), o risco prático é baixo e nenhum teste cobre o caso.
5. [OBSERVAÇÃO — BAIXA] "Último encontro" da R2 — a rota ordena por `inicio` (`api/src/app.ts:408-410`) e o domínio usa o `fim` do último por início (`api/src/certificate/emissao-certificado.ts:54-55`), não o maior `fim`. Havendo encontro sobreposto com término posterior ao último por início, a janela de encerramento ficaria errada; cenário não previsto nem coberto pela spec (R2 fala em "término do último encontro da atividade").
6. [OBSERVAÇÃO — INFORMATIVA] Exceção de abreviação não descrita em R7 — `abreviar-nome.ts:24-26` mantém por extenso o termo após partícula somente quando não está em `i === 2`; assim "Maria da Silva" → "Maria da S." (`api/tests/abreviar-nome.test.ts:63`), enquanto "Elisa Fernandes da Rocha" → "Elisa F. da Rocha". Os três exemplos da spec (critérios 13–14) são atendidos; o caso "partícula logo após o primeiro nome + sobrenome final" não é coberto pela spec.
7. [OBSERVAÇÃO — BAIXA] Idempotência do par sem restrição estrutural — a tabela `certificados` tem PK só em `codigo`, sem `UNIQUE (atividade_id, participante_id)` (`api/src/db/migrate.ts:61-71`); a R9 é garantida apenas na aplicação (`api/src/certificate/emissao-certificado.ts:66-69`). Com better-sqlite3 síncrono single-thread o risco prático de duplicação é nulo na execução sequencial, mas a garantia não é estrutural no banco.
8. [CONFORME] Casos de borda declarados — `emitidoEm` ISO 8601 com fuso via `clock.now().toISO()` (`emissao-certificado.ts:71`); campos `codigo: null` no extrato (`extrato.ts:47`); array vazio em `GET /certificados` e `itens: []` no extrato (testes `certificado-listagem.test.ts:108-115`, `extrato.test.ts:539-551`); reemissão após reinício preserva código/`emitidoEm` (`certificado-restart.test.ts`); unicidade com recuperação de colisão (`certificado-colisao.test.ts`).
9. [CONFORME] Testes como evidência — os 90 testes de API do M4 e os 17+ da interface cobrem todos os critérios de aceite 1–26 da spec (R1 em `certificado.test.ts`, R2 e R12, R3–R5 em `extrato.test.ts`/`horas-complementares.test.ts`, R6/R11 em `gerar-codigo.test.ts`/`certificado-colisao.test.ts`, R7/R8 em `abreviar-nome.test.ts`/`certificado-r8.test.ts`, R9 em `certificado.test.ts`/`certificado-r9.test.ts`, R10 e R13–R18 em `extrato.test.ts`) e verificam status HTTP, código `erro` e efeito persistido.

## Veredito

O M4 pode ser aceito: os quatro endpoints, campos, status, códigos de erro, precedência, idempotência 201/200 e as 18 regras da spec estão implementados conforme `contrato-api.md` e `specs/M4-certificados.md`, com as duas suítes de teste verdes (API 273/273, interface 136/136); restam apenas quatro observações de severidade baixa/informativa (achados 4–7), nenhuma das quais uma divergência confirmada de contrato ou spec.
