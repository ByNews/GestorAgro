Gestor Agro 4.0 - Web + PostgreSQL
==================================

Novidades desta versao:
- Atalhos iniciais: Fazenda, Pecuaria, Estoque, Agricultura, Financeiro,
  Contas a pagar, Contas a receber e Configuracoes
- Configuracoes com reautenticacao
- Controle de acesso por atalho
- Mapa de qualidade para Pecuaria e Agricultura
- Interface HTML/CSS/JS servida direto pelo Express

Estrutura de pastas:
--------------------
  INSTALAR.bat              -> Prepara o ambiente e inicia a versao web
  package.json              -> Configuracao do projeto
  .env                      -> Configuracoes do banco
  codigo-fonte/
    web.js                  -> Inicializador da aplicacao web
    interface/              -> Telas HTML/CSS/JS da aplicacao
    imagens/                -> Imagens e icones
    servidor/               -> Servidor Express + integracao PostgreSQL
      sql/                  -> Scripts SQL
  configuracoes/
    .env.exemplo            -> Modelo de configuracao do banco
  testes/                   -> Scripts de teste
  distribuicao/             -> Artefatos antigos da versao desktop

Como instalar:
--------------
1. Certifique-se de ter o Node.js LTS instalado: https://nodejs.org
2. Certifique-se de ter o PostgreSQL instalado e rodando
3. Crie o banco de dados: `CREATE DATABASE farmmanager;`
4. Execute `INSTALAR.bat`

Para desenvolvimento:
---------------------
1. Execute `npm install`
2. Execute `npm start`
3. Abra `http://localhost:4312`

Login inicial:
--------------
Usuario: DEV
Senha: 352155
