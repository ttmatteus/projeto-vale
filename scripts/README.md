# Scripts de Gerenciamento de Usuários

Esta pasta contém scripts para facilitar o gerenciamento de usuários no sistema.

## Scripts Disponíveis

### 1. create-admin-user.js
Cria um usuário administrador padrão com credenciais fixas.

**Uso:**
```bash
node scripts/create-admin-user.js
```

**Credenciais criadas:**
- Identifier: `admin`
- Senha: `admin123`
- Email: `admin@sistema.com`
- CRECI: `ADMIN001`
- Função: ADMIN

### 2. create-user.js
Cria um usuário personalizado com parâmetros específicos.

**Uso:**
```bash
node scripts/create-user.js [opções]
```

**Opções disponíveis:**
- `--identifier <valor>` - Identificador único do usuário (obrigatório)
- `--password <valor>` - Senha do usuário (obrigatório)
- `--email <valor>` - Email do usuário (opcional)
- `--creci <valor>` - CRECI do usuário (opcional)
- `--name <valor>` - Nome completo do usuário (opcional)
- `--role <ADMIN|USER>` - Função do usuário (padrão: USER)
- `--help` - Mostra ajuda

**Exemplos:**
```bash
# Criar usuário administrador
node scripts/create-user.js --identifier admin --password admin123 --role ADMIN

# Criar usuário com todos os dados
node scripts/create-user.js --identifier joao --password 123456 --email joao@teste.com --name "João Silva" --creci CRECI001

# Criar usuário básico
node scripts/create-user.js --identifier maria --password senha123
```

### 3. list-users.js
Lista todos os usuários cadastrados no sistema.

**Uso:**
```bash
node scripts/list-users.js
```

## Como Fazer Login no Sistema

Você pode fazer login usando qualquer um dos seguintes campos:
- **Identifier** (ex: "admin", "joao", "maria")
- **Email** (ex: "admin@sistema.com", "joao@teste.com")
- **CRECI** (ex: "ADMIN001", "CRECI001")

Todos com a mesma senha cadastrada.

## Observações

- Os scripts usam o Prisma Client para interagir com o banco de dados
- Verificam automaticamente se o usuário já existe antes de criar
- Mostram mensagens de erro detalhadas em caso de problemas
- Não é necessário reiniciar o servidor após criar usuários