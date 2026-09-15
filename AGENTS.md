# Instruções do repositório

## Projeto

Sistema da Semana Acadêmica composto por uma API HTTP/JSON e uma interface web.

Cada módulo possui um responsável definido em `EQUIPE.md`. Antes de modificar
um módulo, confira seu responsável e preserve o trabalho dos demais integrantes.

## Stack

- Node.js 22.
- TypeScript.
- Express na API.
- SQLite como banco embutido.
- React com Vite na interface.
- Vitest para testes.
- Supertest para testes HTTP da API.
- npm como gerenciador de pacotes.

## Fontes de verdade

- `contrato-api.md` define rotas, métodos, campos, formatos e códigos de retorno.
- `contrato-api.md` é somente leitura e não deve ser alterado.
- `entrevistas/` registra as perguntas e respostas levantadas no processo.
- `specs/` contém as regras implementáveis de cada módulo.
- Nenhuma regra de negócio pode ser inventada durante a implementação.
- Uma regra funcional somente pode ser implementada quando estiver na spec do módulo.
- Cada regra da spec deve ter origem em uma pergunta da entrevista.

## Documento de requisitos

Documentos externos de requisitos são sigilosos e não pertencem ao repositório.

O agente não deve procurar, abrir, copiar ou solicitar esses documentos.
Eles são consultados somente pelo integrante humano durante a Rodada 2.

## Comandos

A partir da raiz:

- Instalar a API: `npm --prefix api install`
- Iniciar a API: `npm --prefix api start`
- Testar a API: `npm --prefix api test`
- Instalar a interface: `npm --prefix app install`
- Iniciar a interface: `npm --prefix app run dev`
- Testar a interface: `npm --prefix app test`

## Regras técnicas globais

- A API deve usar HTTP e JSON UTF-8.
- A API deve cumprir exatamente `contrato-api.md`.
- O banco deve ser SQLite e não pode depender de servidor externo.
- O projeto não pode depender de Docker ou de serviço em nuvem.
- A interface deve acessar os dados exclusivamente pela API.
- A identificação do usuário deve usar o cabeçalho `X-Usuario`.
- Toda lógica temporal deve usar a abstração central de relógio.
- O código de produção não deve acessar diretamente a hora do sistema quando houver regra temporal.
- As rotas `/_teste/*` somente podem existir quando `MODO_TESTE=1`.
- Erros da API devem seguir o formato definido no contrato.
- API e interface devem possuir testes automatizados.
- Testes da interface devem usar uma API falsa ou mock.
- Datas devem ser tratadas como instantes com fuso, sem depender do fuso da máquina.

## Organização dos módulos

- Cada módulo deve manter separadas as camadas HTTP, aplicação, domínio e persistência.
- Integrações entre módulos devem usar interfaces ou portas explícitas.
- Um módulo não deve acessar diretamente detalhes internos de outro módulo.
- Não alterar o contrato público ou o módulo de outro integrante sem alinhamento.
- Mudanças compartilhadas devem preservar os testes existentes dos outros módulos.

## Processo de desenvolvimento

- Fazer entrevista antes da spec.
- Fazer a Rodada 1 antes de consultar respostas oficiais.
- Fazer a Rodada 2 somente para perguntas pendentes.
- Gerar a spec somente a partir da entrevista.
- Implementar uma regra ou fatia da spec por vez.
- Em cada ciclo TDD, escrever e executar o teste falhando antes do código.
- Não alterar um teste existente somente para fazê-lo passar.
- Executar testes relacionados depois de cada alteração.
- Fazer commits pequenos e identificar a regra da spec quando aplicável.
- Não apagar sessões do OpenCode usadas no projeto.

## Segurança das alterações

- Não modificar `contrato-api.md`.
- Não adicionar documentos externos de requisitos.
- Não adicionar segredos, chaves ou arquivos `.env`.
- Não sobrescrever alterações existentes de outros integrantes.
- Antes de editar, verificar `git status`.
- Antes de criar uma abstração compartilhada, verificar se ela já existe.
