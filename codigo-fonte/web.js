const fs = require('fs');
const path = require('path');
const startServer = require('./servidor');

function ensureEnvFile(rootDir) {
  const envPath = path.join(rootDir, '.env');
  const exampleCandidates = [
    path.join(rootDir, '.env.exemplo'),
    path.join(rootDir, 'configuracoes', '.env.exemplo')
  ];

  if (fs.existsSync(envPath)) return envPath;

  const examplePath = exampleCandidates.find((candidate) => fs.existsSync(candidate));
  if (examplePath) {
    fs.copyFileSync(examplePath, envPath);
  }

  return envPath;
}

async function bootstrapWeb() {
  const rootDir = path.resolve(__dirname, '..');
  const envPath = ensureEnvFile(rootDir);

  require('dotenv').config({ path: envPath });

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'farmmanager',
    appPort: Number(process.env.APP_PORT || 4312)
  };

  try {
    await startServer(config);
    console.log(`Gestor Agro Web em http://localhost:${config.appPort}`);
  } catch (error) {
    console.error('Erro ao iniciar o Gestor Agro Web:', error.message || error);
    process.exit(1);
  }
}

bootstrapWeb();
