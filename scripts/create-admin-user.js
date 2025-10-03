const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query'],
});

async function createAdminUser() {
  try {
    console.log('Iniciando criação de usuário administrador...\n');

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { identifier: 'admin' },
          { email: 'admin@sistema.com' },
          { creci: 'ADMIN001' }
        ]
      }
    });

    if (existingUser) {
      console.log('Usuário administrador já existe:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Identifier: ${existingUser.identifier}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   CRECI: ${existingUser.creci}`);
      console.log(`   Nome: ${existingUser.name}`);
      console.log(`   Função: ${existingUser.role}`);
      console.log(`   Ativo: ${existingUser.isActive ? 'Sim' : 'Não'}`);
      return;
    }

    // Criar novo usuário administrador
    const adminUser = await prisma.user.create({
      data: {
        identifier: 'admin',
        email: 'admin@sistema.com',
        password: 'admin123',
        role: 'ADMIN',
        name: 'Administrador do Sistema',
        creci: 'ADMIN001',
        isActive: true,
      },
    });

    console.log('Usuário administrador criado com sucesso!\n');
    console.log('Credenciais de acesso:');
    console.log('   ┌─────────────────────────────────────────────┐');
    console.log('   │  USUÁRIO/IDENTIFIER: admin                   │');
    console.log('   │  SENHA: admin123                              │');
    console.log('   │  EMAIL: admin@sistema.com                    │');
    console.log('   │  CRECI: ADMIN001                              │');
    console.log('   │  NOME: Administrador do Sistema              │');
    console.log('   │  FUNÇÃO: ADMIN                                │');
    console.log('   └─────────────────────────────────────────────┘\n');
    
    console.log('Você também pode fazer login usando:');
    console.log('   - Email: admin@sistema.com');
    console.log('   - CRECI: ADMIN001');
    console.log('   - Identifier: admin');
    console.log('   (Todos com a mesma senha: admin123)\n');

  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error.message);
    if (error.code === 'P2002') {
      console.error('   Já existe um usuário com este identifier, email ou CRECI.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função
createAdminUser();