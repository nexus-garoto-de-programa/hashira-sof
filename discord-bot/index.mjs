import { Client, GatewayIntentBits } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const {
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!DISCORD_BOT_TOKEN) {
  console.error("❌ [DISCORD BOT] ERRO: DISCORD_BOT_TOKEN não foi informado no .env!");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ [DISCORD BOT] ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env!");
  process.exit(1);
}

// Inicializa cliente do Supabase com privilégios de Service Role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Inicializa cliente do Discord com as intents necessárias para escutar canais de voz
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

/**
 * Encontra o colaborador na tabela 'usuarios' associado ao ID do Discord
 */
async function getColaboradorPorDiscordId(discordUserId) {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, como_quer_ser_chamado")
      .eq("discord_user_id", discordUserId)
      .maybeSingle();

    if (error) {
      console.warn(`⚠️ [DISCORD BOT] Falha ao consultar colaborador para Discord ID ${discordUserId}:`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("💥 [DISCORD BOT] Exceção ao buscar colaborador:", err);
    return null;
  }
}

/**
 * Atualiza o status do colaborador na tabela discord_status
 */
async function atualizarStatusVoz(discordUserId, emCall, canalAtual = null) {
  try {
    const colab = await getColaboradorPorDiscordId(discordUserId);
    const colaboradorId = colab ? colab.id : discordUserId;
    const nomeIdentificado = colab ? (colab.como_quer_ser_chamado || colab.nome) : `DiscordUser#${discordUserId}`;

    const { error } = await supabase.from("discord_status").upsert(
      {
        colaborador_id: colaboradorId,
        discord_user_id: discordUserId,
        em_call: emCall,
        canal_atual: emCall ? canalAtual : null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "colaborador_id" }
    );

    if (error) {
      console.error(`❌ [DISCORD BOT] Falha ao sincronizar status de ${nomeIdentificado}:`, error.message);
    } else {
      console.log(
        `📡 [DISCORD BOT] ${nomeIdentificado} -> ${
          emCall ? `🟢 EM CALL: [${canalAtual}]` : "⚪ FORA DE CALL"
        }`
      );
    }
  } catch (err) {
    console.error("💥 [DISCORD BOT] Exceção ao atualizar status:", err);
  }
}

// 1. Evento quando o bot conecta com sucesso
client.once("ready", async () => {
  console.log(`\n======================================================`);
  console.log(`🤖 [DISCORD BOT] Conectado com sucesso como: ${client.user.tag}`);
  console.log(`⏰ [DISCORD BOT] Horário: ${new Date().toLocaleString("pt-BR")}`);
  console.log(`======================================================\n`);

  // Varredura preventiva dos canais de voz existentes para sincronizar membros que já estão em call
  if (DISCORD_GUILD_ID) {
    try {
      const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
      if (guild) {
        console.log(`🔍 [DISCORD BOT] Varrendo canais de voz da guilda "${guild.name}"...`);
        const voiceStates = guild.voiceStates.cache;
        let count = 0;

        for (const [userId, vs] of voiceStates) {
          if (vs.channelId && vs.channel) {
            count++;
            await atualizarStatusVoz(userId, true, vs.channel.name);
          }
        }
        console.log(`✅ [DISCORD BOT] Varredura inicial concluída: ${count} membros em chamada de voz.`);
      }
    } catch (err) {
      console.warn("⚠️ [DISCORD BOT] Não foi possível fazer a varredura inicial da guilda:", err.message);
    }
  }
});

// 2. Evento quando qualquer usuário entra, sai ou troca de canal de voz
client.on("voiceStateUpdate", async (oldState, newState) => {
  const userId = newState.id || oldState.id;
  const member = newState.member || oldState.member;

  // Ignora se for o próprio bot
  if (member?.user?.bot) return;

  const entrouOuTrocou = newState.channelId !== null;
  const saiuTotalmente = newState.channelId === null;

  if (entrouOuTrocou && newState.channel) {
    const canalNome = newState.channel.name;
    await atualizarStatusVoz(userId, true, canalNome);
  } else if (saiuTotalmente) {
    await atualizarStatusVoz(userId, false, null);
  }
});

// Conecta ao Gateway
client.login(DISCORD_BOT_TOKEN).catch((err) => {
  console.error("❌ [DISCORD BOT] Erro fatal ao logar no Discord:", err.message);
});
