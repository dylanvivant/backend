#!/usr/bin/env node

/**
 * Script d'installation et de configuration du backend S4V
 * Execute: node install-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Installation et configuration du backend S4V...\n');

// Vérifier si Node.js est installé
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error(
    "❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
  );
  process.exit(1);
}

// Vérifier si npm est installé
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ NPM version: ${npmVersion}`);
} catch (error) {
  console.error("❌ NPM n'est pas installé.");
  process.exit(1);
}

// Installer les dépendances
console.log('\n📦 Installation des dépendances...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dépendances installées avec succès');
} catch (error) {
  console.error(
    "❌ Erreur lors de l'installation des dépendances:",
    error.message
  );
  process.exit(1);
}

// Vérifier si le fichier .env existe
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('\n📋 Création du fichier .env...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Fichier .env créé à partir de .env.example');
    console.log(
      '⚠️  Veuillez éditer le fichier .env avec vos valeurs de configuration'
    );
  } else {
    console.log('⚠️  Fichier .env.example non trouvé');
  }
} else {
  console.log('✅ Fichier .env déjà présent');
}

// Créer les dossiers nécessaires
const directories = ['logs', 'uploads', 'temp', 'backups'];

console.log('\n📁 Création des dossiers...');
directories.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Dossier créé: ${dir}`);
  } else {
    console.log(`✅ Dossier existant: ${dir}`);
  }
});

// Créer les fichiers de logs
const logFiles = ['logs/app.log', 'logs/error.log', 'logs/access.log'];

console.log('\n📄 Création des fichiers de logs...');
logFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
    console.log(`✅ Fichier créé: ${file}`);
  } else {
    console.log(`✅ Fichier existant: ${file}`);
  }
});

// Vérifier la configuration Supabase
console.log('\n🔍 Vérification de la configuration...');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'PORT',
  ];

  const missingVars = requiredVars.filter((varName) => {
    return (
      !envContent.includes(`${varName}=`) ||
      envContent.includes(`${varName}=your_`)
    );
  });

  if (missingVars.length > 0) {
    console.log("⚠️  Variables d'environnement manquantes ou à configurer:");
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📝 Veuillez éditer le fichier .env avec vos valeurs');
  } else {
    console.log('✅ Configuration de base présente');
  }
}

// Créer un script package.json s'il n'existe pas
const packagePath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packagePath)) {
  console.log('\n📦 Création du package.json...');

  const packageJson = {
    name: 's4v-backend',
    version: '1.0.0',
    description: 'Backend pour plateforme esport S4V',
    main: 'server.js',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'test:endpoints': 'node test-endpoints.js',
      setup: 'node src/scripts/setup.js',
      lint: 'eslint . --ext .js',
      'lint:fix': 'eslint . --ext .js --fix',
    },
    keywords: ['esport', 'backend', 'nodejs', 'api'],
    author: 'S4V Team',
    license: 'MIT',
    dependencies: {
      express: '^4.18.2',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      'express-rate-limit': '^6.10.0',
      dotenv: '^16.3.1',
      '@supabase/supabase-js': '^2.38.0',
      bcrypt: '^5.1.1',
      jsonwebtoken: '^9.0.2',
      joi: '^17.9.2',
      nodemailer: '^6.9.4',
      axios: '^1.5.0',
      'node-cache': '^5.1.2',
      uuid: '^9.0.0',
    },
    devDependencies: {
      nodemon: '^3.0.1',
      jest: '^29.6.2',
      supertest: '^6.3.3',
      eslint: '^8.47.0',
    },
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json créé');
}

console.log('\n🎉 Installation terminée !');
console.log('\n📋 Prochaines étapes:');
console.log('1. Éditez le fichier .env avec vos configurations');
console.log('2. Configurez votre base de données Supabase');
console.log('3. Lancez le serveur avec: npm start');
console.log('4. Testez les endpoints avec: npm run test:endpoints');
console.log('\n📚 Documentation: ./FONCTIONNALITES_AVANCEES.md');
console.log('🔧 Configuration exemple: ./.env.example');
console.log('\n🚀 Bon développement !');
