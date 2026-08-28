# Analisador IA

Aplicativo Expo/React Native para análise de perfil, conteúdo e listas de
seguidores do Instagram. O backend Express integra o login OAuth do Instagram
e a API Gemini.

## Requisitos

- Node.js 20 ou mais recente
- npm
- Expo Go ou um emulador Android/iOS

O projeto não usa banco de dados. O backend usa `MemorySessionStore` por padrão,
com sessões que expiram após 24 horas. A interface `SessionStore` permite trocar
essa implementação futuramente sem alterar as rotas. Reiniciar ou escalar o
servidor com o armazenamento em memória invalida as sessões atuais.

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

Mantenha `SESSION_STORE=memory` no desenvolvimento local. Outros drivers ainda
não estão implementados e são rejeitados explicitamente durante a inicialização.

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

Não há migrations ou serviço de banco de dados para iniciar neste repositório.
