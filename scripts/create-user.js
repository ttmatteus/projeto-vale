const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query'],
});

function showHelp() {
  console.log(`
📖 Como usar: node scripts/create-user.js [opções]

Opções:
  --identifier <valor>     Identificador único do usuário (obrigatório)
  --password <valor>       Senha do usuário (obrigatório)
  --email <valor>          Email do usuário
  --creci <valor>          CRECI do usuário
  --name <valor>           Nome completo do usuário
  --role <ADMIN|USER>      Função do usuário (padrão: USER)
  --help                   Mostra esta ajuda

Exemplos:
  node scripts/create-user.js --identifier admin --password admin123 --role ADMIN
  node scripts/create-user.js --identifier joao --password 123456 --email joao@teste.com --name "João Silva"
  node scripts/create-user.js --identifier maria --password senha123 --creci CRECI001 --role ADMIN
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    if (key.startsWith('--')) {
      params[key.substring(2)] = value;
    }
  }
  
  return params;
}

async function createUser(params) {
  try {
    const { identifier, password, email, creci, name, role, help } = params;

    if (help) {
      showHelp();
      return;
    }

    if (!identifier || !password) {
      console.log('❌ Erro: --identifier e --password são obrigatórios!\n');
      showHelp();
      return;
    }

    console.log('🚀 Iniciando criação de usuário...\n');

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { identifier: identifier },
          ...(email ? [{ email: email }] : []),
          ...(creci ? [{ creci: creci }] : [])
        ]
      }
    });

    if (existingUser) {
      console.log('⚠️  Usuário já existe com os seguintes dados:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Identifier: ${existingUser.identifier}`);
      console.log(`   Email: ${existingUser.email || 'Não informado'}`);
      console.log(`   CRECI: ${existingUser.creci || 'Não informado'}`);
      console.log(`   Nome: ${existingUser.name || 'Não informado'}`);
      console.log(`   Função: ${existingUser.role}`);
      console.log(`   Ativo: ${existingUser.isActive ? 'Sim' : 'Não'}`);
      return;
    }

    // Criar novo usuário
    const userData = {
      identifier: identifier,
      password: password,
      role: role || 'USER',
      isActive: true,
    };

    if (email) userData.email = email;
    if (creci) userData.creci = creci;
    if (name) userData.name = name;

    const newUser = await prisma.user.create({
      data: userData,
    });

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Dados do usuário:');
    console.log('   ┌─────────────────────────────────────────────┐');
    console.log(`   │  ID: ${newUser.id}`);
    console.log(`   │  USUÁRIO/IDENTIFIER: ${newUser.identifier}   │`);
    console.log(`   │  SENHA: ${password}                         │`);
    if (newUser.email) console.log(`   │  EMAIL: ${newUser.email}                    │`);
    if (newUser.creci) console.log(`   │  CRECI: ${newUser.creci}                    │`);
    if (newUser.name) console.log(`   │  NOME: ${newUser.name}                      │`);
    console.log(`   │  FUNÇÃO: ${newUser.role}                       │`);
    console.log(`   │  ATIVO: Sim                                   │`);
    console.log('   └─────────────────────────────────────────────┘\n');
    
    console.log('💡 Você pode fazer login usando:');
    console.log(`   - Identifier: ${newUser.identifier}`);
    if (newUser.email) console.log(`   - Email: ${newUser.email}`);
    if (newUser.creci) console.log(`   - CRECI: ${newUser.creci}`);
    console.log(`   (Todos com a mesma senha: ${password})\n`);

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    if (error.code === 'P2002') {
      console.error('   Já existe um usuário com este identifier, email ou CRECI.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função
const params = parseArgs();
createUser(params);