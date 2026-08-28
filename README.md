# Analisador IA

Aplicativo Expo/React Native para análise de perfil, conteúdo e listas de
seguidores do Instagram. O backend Express integra o login OAuth do Instagram
e a API Gemini.

## Requisitos

- Node.js 20 ou mais recente
- npm
- Expo Go ou um emulador Android/iOS

Usuários e contas conectadas são persistidos no PostgreSQL. O login por e-mail
usa bcrypt e JWT, armazenado no SecureStore do aparelho. O
`MemorySessionStore` continua sendo usado somente para a compatibilidade das
sessões Instagram atuais; reiniciar o servidor exige reconectar o Instagram,
mas não desconecta a conta principal do usuário.

No aplicativo mobile, identificadores de sessão são armazenados no SecureStore.
Metadados não sensíveis permanecem no AsyncStorage. Sessões de versões antigas
são migradas automaticamente na primeira leitura.

Listas importadas de seguidores são separadas por conta ativa para evitar que
dados de uma conta apareçam ao alternar para outra. Chamadas do aplicativo ao
backend têm timeout e mensagens amigáveis para falhas de rede e HTTP; respostas
401 removem automaticamente a sessão inválida do armazenamento local.

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

Migration disponível: `server/migrations/001_auth.sql`.
