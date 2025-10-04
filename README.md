

## Pré-requisitos

* Node.js 18+
* npm ou yarn

## Instalação

1. **Clone o repositório:**

```bash
git clone https://github.com/ttmatteus/projeto-vale.git
cd projeto-vale
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure as variáveis de ambiente:**

```bash
cp .env-example .env
```

4. **Edite o arquivo `.env` com suas credenciais:**

```env
DATABASE_URL="file:./prisma/db/custom.db"
JWT_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_SECRET="seu-nextauth-secret-aqui"
```

5. **Configure o banco de dados:**

```bash
npx prisma generate
npx prisma db push
```

6. **Inicie o servidor:**

```bash
npm run dev
```

## Scripts Disponíveis

* `npm run dev` – Inicia o servidor de desenvolvimento
* `npm run build` – Gera build para produção
* `npm run start` – Inicia o servidor em produção
* `npm run lint` – Executa o linter


