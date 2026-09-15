# Instruções da API

Estas instruções complementam o `AGENTS.md` da raiz.

## Execução

- A API usa Node.js 22, TypeScript, Express e SQLite.
- `npm start` deve iniciar a API.
- A porta vem da variável `PORT`, com padrão 3000.
- A criação da aplicação deve ficar separada da abertura da porta.
- Importar a aplicação nos testes não pode iniciar um servidor automaticamente.
- A API não pode depender de Docker, banco externo ou serviço de nuvem.

## Contrato HTTP

- Seguir exatamente `../contrato-api.md`.
- Não renomear rotas ou campos.
- Não alterar métodos HTTP ou códigos de retorno.
- Respostas comuns usam JSON UTF-8.
- Erros seguem o formato `{"erro":"CODIGO","mensagem":"texto"}`.
- A ordem geral das validações deve seguir o contrato.
- A identificação usa o cabeçalho `X-Usuario`.
- Rotas públicas são somente as explicitamente definidas pelo contrato.

## Banco

- Usar SQLite.
- Todas as alterações estruturais devem ocorrer por migrations.
- A inicialização deve ser reproduzível.
- Os dados iniciais definidos no contrato devem ser carregados automaticamente.
- Os testes devem usar um banco isolado.
- Testes não podem depender do banco utilizado durante o desenvolvimento.
- Não criar tabelas pertencentes a outro módulo sem alinhamento com seu responsável.

## Relógio e modo de teste

- Toda regra temporal deve depender de uma interface central de relógio.
- Não chamar `new Date()` ou equivalente diretamente dentro de regras de negócio.
- Com `MODO_TESTE=1`, o relógio fica parado e é controlado pelas rotas de teste.
- Sem `MODO_TESTE`, as rotas `/_teste/*` respondem 404.
- O reset de teste deve limpar os dados, executar migrations, carregar os dados iniciais e restaurar o relógio.
- Os testes de tempo não podem esperar o tempo real passar.

## Arquitetura

- Rotas HTTP apenas validam transporte e delegam para casos de uso.
- Regras de negócio ficam em domínio ou casos de uso.
- Acesso ao SQLite fica atrás de repositórios.
- Integrações entre módulos ficam atrás de portas ou interfaces.
- Não acessar tabelas internas de outro módulo diretamente sem acordo entre os responsáveis.
- Não duplicar a mesma regra em rota, serviço e repositório.

## Testes

- Usar Vitest.
- Usar Supertest para testes das rotas.
- Criar a aplicação em memória sem abrir porta nos testes.
- Cada regra da spec deve possuir prova automatizada.
- Seguir o ciclo vermelho, verde e refatoração.
- Executar primeiro o teste novo e depois os testes relacionados.
- Não reduzir asserções para fazer um teste passar.
- Testar status HTTP, código de erro e efeito persistido.
