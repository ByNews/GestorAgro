Gestor Agro 4.0 - Electron + PostgreSQL
========================================

Novidades desta versão:
- Atalhos iniciais: Fazenda, Pecuária, Estoque, Agricultura, Financeiro,
  Contas a pagar, Contas a receber e Configurações
- Janelas de atalho sem a barra de outros atalhos
- Configurações com reautenticação
- Controle de acesso por atalho (checkboxes no cadastro de usuário)
- Mapa fictício de qualidade para Pecuária e Agricultura
- Formulários em janela/modal pequena para "Novo registro"
- Visual verde escuro + verde claro + branco

Estrutura de pastas:
--------------------
  INSTALAR.bat              → Execute este arquivo para instalar tudo
  package.json              → Configuração do projeto
  .env                      → Configurações do banco (criado automaticamente)
  codigo-fonte/
    principal/              → Processo principal do Electron (main.js, preload.js)
    interface/              → Telas HTML/CSS/JS da aplicação
    imagens/                → Imagens e ícones
    servidor/               → Servidor Express + integração PostgreSQL
      sql/                  → Scripts SQL (criação de tabelas)
  configuracoes/
    .env.exemplo            → Modelo de configuração do banco de dados
  temporarios/              → Arquivos temporários de testes INMET
  testes/                   → Scripts de teste
  distribuicao/             → Instalador gerado (criado após rodar INSTALAR.bat)

Como instalar:
--------------
1. Certifique-se de ter o Node.js LTS instalado (https://nodejs.org)
2. Certifique-se de ter o PostgreSQL instalado e rodando
3. Crie o banco de dados:  CREATE DATABASE farmmanager;
4. Execute o arquivo INSTALAR.bat — ele faz tudo automaticamente:
   - Instala as dependências
   - Configura o .env
   - Gera o instalador na pasta "distribuicao"

Para desenvolvimento (sem gerar instalador):
--------------------------------------------
1. Siga os passos 1 a 3 acima
2. Execute:  npm install
3. Execute:  npm start

Login inicial:
--------------
  Usuário: DEV
  Senha:   352155

Imagens:
---------

<img width="1909" height="940" alt="Tela_Inicial" src="https://github.com/user-attachments/assets/7f420a11-fe02-4c7b-9bfe-d02be077a30e" />
<img width="1911" height="961" alt="image" src="https://github.com/user-attachments/assets/8a66d4d4-8d36-43c9-9902-5958c90dff20" />


