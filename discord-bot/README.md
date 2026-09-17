# Bot de Presença de Voz do Discord — Central dos Torres (Hashira)

Este bot conecta-se ao Gateway do Discord via WebSocket persistente e monitora eventos de entrada/saída em canais de voz (`voiceStateUpdate`), atualizando a tabela `discord_status` no Supabase em tempo real.

Graças ao **Supabase Realtime**, qualquer alteração é refletida na interface do painel web em poucos segundos, **sem necessidade de reload ou polling manual**.

---

## 🚀 Como Colocar o Bot em Produção (Railway, Fly.io ou VPS)

> ⚠️ **IMPORTANTE:** O bot **NÃO** deve rodar em plataformas serverless como Vercel ou AWS Lambda sem conexão contínua, pois a conexão WebSocket do Discord precisa permanecer aberta 24/7.

### 1. Criar a Aplicação no Discord Developer Portal
1. Acesse [Discord Developer Portal](https://discord.com/developers/applications).
2. Clique em **"New Application"** e dê o nome `Hashira Voice Sentinel` (ou similar).
3. Na aba lateral **"Bot"**:
   - Clique em **"Reset Token"** e copie o **DISCORD_BOT_TOKEN**.
   - Na seção **"Privileged Gateway Intents"**, ative:
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent** (opcional)
4. Na aba **"OAuth2" -> "URL Generator"**:
   - Marque os escopos: `bot`.
   - Nas permissões de bot: `View Channels`, `Connect`.
   - Copie o link gerado e abra-o no navegador para adicionar o bot ao servidor Discord da Hashira.
5. Copie o **ID do Servidor Discord** (Guild ID):
   - No Discord (com Modo Desenvolvedor ativo em Configurações -> Avançado), clique com o botão direito no ícone do servidor e selecione **"Copiar ID do Servidor"**.

---

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` dentro da pasta `discord-bot/` (ou configure no painel do Railway/Fly.io):

```env
DISCORD_BOT_TOKEN=seu_token_aqui
DISCORD_GUILD_ID=seu_guild_id_aqui
SUPABASE_URL=https://smzfetgrxmejhzvxuovv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

> **Atenção:** A chave `SUPABASE_SERVICE_ROLE_KEY` deve ser mantida estritamente confidencial e usada apenas neste bot backend!

---

### 3. Deploy no Railway (Opção Recomendada - 3 Minutos)
1. Crie uma conta no [Railway.app](https://railway.app).
2. Clique em **"New Project" -> "Deploy from GitHub repo"**.
3. Selecione o repositório e indique o diretório raiz como `discord-bot` (Root Directory: `/discord-bot`).
4. Adicione as 4 variáveis de ambiente listadas acima na aba **Variables**.
5. O Railway fará o build com o `Dockerfile` e manterá o bot rodando 24 horas por dia.

---

### 4. Rodando Localmente para Testes
```bash
cd discord-bot
npm install
npm run dev
```

Quando o bot iniciar, você verá no terminal:
```text
======================================================
🤖 [DISCORD BOT] Conectado com sucesso como: Hashira Sentinel#1234
⏰ [DISCORD BOT] Horário: 17/09/2026, 14:50:00
======================================================
🔍 [DISCORD BOT] Varrendo canais de voz da guilda "HASHIRA OFICIAL"...
✅ [DISCORD BOT] Varredura inicial concluída: 3 membros em chamada de voz.
```
