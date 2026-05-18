# OCVEL — Painel ECD/ECF

Sistema web para controle de fechamentos contábeis e declarações ECD/ECF.

## Stack

- **Frontend:** Vite 5 + React 18 + TypeScript + Tailwind v4 + shadcn/ui
- **Backend:** Supabase (Postgres + Storage + Auth + RLS + Edge Functions)
- **Orquestração:** n8n (webhook gClick → fechamento automático)

## Setup local

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha `.env` com as credenciais do projeto Supabase:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_FUNCTIONS_URL=https://xxx.supabase.co/functions/v1
```

### 3. Aplicar migrações

As migrações já estão aplicadas no projeto remoto. Para desenvolvimento local:

```bash
supabase start
supabase db push
```

### 4. Deploy das Edge Functions

```bash
supabase functions deploy manual-fechamento
supabase functions deploy signed-url
```

### 5. Iniciar em desenvolvimento

```bash
pnpm dev
```

### 6. Testes

```bash
pnpm test
```

## Estrutura

```
src/
├── components/    # Componentes UI (shadcn + domínio)
├── contexts/      # AuthContext
├── hooks/         # TanStack Query hooks
├── lib/           # Supabase client, utils, formatters
├── pages/         # Páginas (Dashboard, Detalhe, Carteira)
└── types/         # Tipos TypeScript (database + domain)

supabase/
├── migrations/    # 15 migrações SQL (PT-BR)
└── functions/     # Edge Functions (Deno)

n8n/workflows/     # Workflow de zeramento (JSON)
```

## Usuários e perfis

| Perfil | Acesso |
|--------|--------|
| `analista` | Empresas da carteira própria |
| `consultoria` | Empresas atribuídas explicitamente |
| `gestor` | Todas as empresas |
| `admin` | Tudo + configurações |

Crie o primeiro usuário admin via **Supabase Dashboard → Auth → Users**.  
Após criar, execute no SQL Editor:

```sql
update usuarios_perfis set perfil = 'admin' where usuario_id = '<uuid>';
```
