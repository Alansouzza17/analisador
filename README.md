# Analisador

Aplicativo Expo/React Native para análise de perfil, conteúdo e listas de
seguidores do Instagram. O backend Express integra o login OAuth do Instagram
e a API Gemini.

## Requisitos

- Node.js 20 ou mais recente
- npm
- Expo Go ou um emulador Android/iOS

Usuários e contas conectadas são persistidos no PostgreSQL. O login por e-mail
usa bcrypt e JWT, armazenado no SecureStore do aparelho. O
`MemorySessionStore` continua sendo usado para compatibilidade das sessões
Instagram atuais. Reiniciar o servidor invalida o identificador de sessão do
aplicativo, mas a conexão da conta permanece no PostgreSQL para coletas futuras
do backend. A restauração completa da sessão do aplicativo ainda exige uma
etapa separada; o projeto não inventa renovação automática de token.

No aplicativo mobile, identificadores de sessão são armazenados no SecureStore.
Metadados não sensíveis permanecem no AsyncStorage. Sessões de versões antigas
são migradas automaticamente na primeira leitura.

Listas importadas de seguidores são separadas por conta ativa para evitar que
dados de uma conta apareçam ao alternar para outra. Chamadas do aplicativo ao
backend têm timeout e mensagens amigáveis para falhas de rede e HTTP; respostas
401 removem automaticamente a sessão inválida do armazenamento local.

Snapshots detectam mudanças na contagem total de seguidores, mas não identificam
quem deixou de seguir. Essa identificação só é feita comparando duas listas
exportadas e importadas manualmente. As listas continuam no armazenamento local
para preservar compatibilidade e nenhum resultado é inferido.

## Limitações da API do Instagram

O fluxo atual usa a API oficial com Instagram Login. A área Concorrentes é um
cadastro manual: não faz scraping, não usa API privada e não exibe métricas que
não foram obtidas. A Meta oferece Business Discovery no fluxo distinto com
Facebook Login, limitado a contas profissionais e sujeito a permissões e análise
do aplicativo. Como esse não é o fluxo configurado, a consulta não foi implementada.

Referência oficial: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api

## Configuração

Copie `.env.example` para `.env` e `server/.env.example` para `server/.env`.
Preencha as credenciais reais somente no arquivo local `server/.env`, que é
ignorado pelo Git.

Crie um PostgreSQL, defina `DATABASE_URL` e `JWT_SECRET`, instale o backend e
aplique a migration sem apagar tabelas existentes:

```bash
cd server
npm ci
npm run migrate
```

Para cifrar tokens do Instagram em repouso, configure
`INSTAGRAM_TOKEN_ENCRYPTION_KEY` com 32 bytes em Base64. Novas conexões usam
AES-256-GCM; contas antigas são migradas gradualmente quando acessadas. Guarde a
chave fora do repositório e faça backup seguro: perdê-la exige reconectar contas.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Tokens do Instagram não são enviados ao frontend nem registrados em logs. O
backend não tenta renovar tokens sem suporte explícito da API; expiração conhecida
e falhas de validação orientam a reconexão.

Para Google, crie um cliente OAuth Web e cadastre
`<BASE_URL>/auth/google/callback` como URI autorizada. Configure
`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no backend.

Para recuperação real de senha, configure `RESEND_API_KEY`, `EMAIL_FROM` e,
opcionalmente, `RESET_URL_BASE`. Sem provedor de e-mail, a rota mantém a
resposta neutra por segurança, mas nenhum e-mail é enviado. Apenas em ambiente
local pode-se ativar `RESET_TOKEN_LOG=true` para testar o token pelo terminal.

No desenvolvimento em um aparelho físico, `EXPO_PUBLIC_API_URL` deve apontar
para um endereço do backend acessível pelo aparelho, e não para `localhost`.
Configure no painel da Meta o callback `<BASE_URL>/auth/app/instagram/callback`.

## Instalação e execução

Backend:

```bash
cd server
npm ci
npm start
```

Aplicativo (em outro terminal, na raiz):

```bash
npm ci
npm start
```

Atalhos disponíveis:

```bash
npm run android
npm run ios
npm run web
```

## Validação

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
npx expo export --platform web

cd server
npm run check
npm test
```

Migrations disponíveis em `server/migrations/`; o comando aplica todos os arquivos em ordem.

## Deploy

1. Neon: use uma URL direta, sem `-pooler`, e execute `cd server && npm run migrate`.
2. Render: configure `INSTAGRAM_TOKEN_ENCRYPTION_KEY` antes de publicar o backend.
3. Render: publique o backend e confirme `/health`; não use variáveis `EXPO_PUBLIC_*` para segredos.
4. Vercel: mantenha apenas `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_WEB_URL` e publique o export web.

As migrations `004_competitor_profiles.sql`, `005_instagram_token_encryption.sql`
e `006_oauth_states.sql` são aditivas e não apagam dados existentes. A migration
`006` mantém o estado temporário do OAuth válido durante reinicializações ou trocas
de instância do backend.
