const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query'],
});

async function listUsers() {
  try {
    console.log('📋 Listando todos os usuários cadastrados...\n');

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        identifier: true,
        email: true,
        creci: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (users.length === 0) {
      console.log('📭 Nenhum usuário encontrado no banco de dados.');
      return;
    }

    console.log(`👥 Total de usuários: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || user.identifier}`);
      console.log('   ┌─────────────────────────────────────────────┐');
      console.log(`   │  ID: ${user.id}`);
      console.log(`   │  Identifier: ${user.identifier}`);
      if (user.email) console.log(`   │  Email: ${user.email}`);
      if (user.creci) console.log(`   │  CRECI: ${user.creci}`);
      console.log(`   │  Função: ${user.role}`);
      console.log(`   │  Status: ${user.isActive ? '✅ Ativo' : '❌ Inativo'}`);
      console.log(`   │  Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
      console.log(`   │  Atualizado em: ${user.updatedAt.toLocaleString('pt-BR')}`);
      console.log('   └─────────────────────────────────────────────┘');
      console.log('');
    });

    console.log('💡 Dica: Use "node scripts/create-user.js --help" para criar novos usuários.');

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função
listUsers();