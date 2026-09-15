# Instruções da interface

Estas instruções complementam o `AGENTS.md` da raiz.

## Stack

- React.
- TypeScript.
- Vite.
- Vitest.
- Testing Library.
- npm como gerenciador de pacotes.

## Integração com a API

- A interface consome a API definida em `../contrato-api.md`.
- Não inventar rotas ou formatos alternativos.
- Concentrar chamadas HTTP em um cliente de API.
- O cliente de API deve adicionar `X-Usuario` quando a rota exigir identificação.
- A seleção do usuário de demonstração deve ficar centralizada.
- Componentes visuais não devem fazer chamadas HTTP diretamente.
- Erros devolvidos pela API devem ser apresentados de forma compreensível.
- A API continua sendo a autoridade para as regras de negócio.

## Componentes e páginas

- Organizar componentes por módulo.
- Evitar componentes que conheçam detalhes internos de vários módulos.
- Pontos de integração entre módulos devem usar propriedades ou interfaces explícitas.
- Não implementar componentes pertencentes a outro módulo sem alinhamento com o responsável.
- Manter estados de carregamento, vazio, sucesso e erro.
- Evitar duplicar na interface validações que pertencem exclusivamente à API.

## Testes

- Usar Vitest e Testing Library.
- Os testes não devem iniciar a API real.
- Substituir o cliente HTTP por uma implementação falsa ou mock.
- Testar carregamento, sucesso, vazio e erro.
- Testar as ações visíveis permitidas para cada tipo de usuário.
- Testar atualização da página depois de operações bem-sucedidas.
- Não depender da internet nos testes.

## Qualidade

- Usar HTML semântico.
- Associar rótulos aos campos dos formulários.
- Permitir uso por teclado.
- Exibir mensagens de erro próximas da ação correspondente.
- Não mostrar controles administrativos para participantes.
- Evitar estado global quando o estado pertence somente a uma página.
