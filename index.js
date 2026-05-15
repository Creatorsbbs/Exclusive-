const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

// ================= DADOS =================
const ticketOwners = new Map();
const ticketData = new Map();

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

require("./forca")(client);

// ================= START =================
client.once("clientReady", async () => {
  console.log(`🤖 Online como ${client.user.tag}`);

  client.guilds.cache.forEach(guild => setupServer(guild));
});

// ================= AUTO SETUP =================
async function setupServer(guild) {
  try {

    // ================= CARGO STAFF =================
    let staffRoleId = await db.get(`staffRole_${guild.id}`);

    if (!staffRoleId) {
      staffRoleId = "1491095314550100100";
    }

    let staffRole = staffRoleId
      ? guild.roles.cache.get(staffRoleId)
      : null;

    // ================= CANAL TICKETS ABERTOS =================
    let openLogs = guild.channels.cache.find(
      c => c.name === "📂・tickets-abertos"
    );

    if (!openLogs) {

      openLogs = await guild.channels.create({
        name: "📂・tickets-abertos",
        type: ChannelType.GuildText,

        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },

          {
            id: guild.members.me.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels
            ]
          },

          ...(staffRole ? [{
            id: staffRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }] : [])
        ]
      });

      console.log("✔ Canal tickets-abertos criado");
    }

    // ================= CANAL TICKETS FECHADOS =================
    let closeLogs = guild.channels.cache.find(
      c => c.name === "🔒・tickets-fechados"
    );

    if (!closeLogs) {

      closeLogs = await guild.channels.create({
        name: "🔒・tickets-fechados",
        type: ChannelType.GuildText,

        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },

          {
            id: guild.members.me.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels
            ]
          },

          {
  id: "1491095314550100100",
  allow: [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.ReadMessageHistory
  ]
},

          ...(staffRole ? [{
            id: staffRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }] : [])
        ]
      });

      console.log("✔ Canal tickets-fechados criado");
    }

    // ================= CATEGORIA =================
    let ticketCategory = guild.channels.cache.find(
      c =>
        c.name === "🎫 TICKETS" &&
        c.type === ChannelType.GuildCategory
    );

    if (!ticketCategory) {

      ticketCategory = await guild.channels.create({
        name: "🎫 TICKETS",
        type: ChannelType.GuildCategory
      });

      console.log("✔ Categoria de tickets criada");
    }

  } catch (err) {
    console.log("Erro setup:", err);
  }
}

// ================= PAINEL =================
client.on("interactionCreate", async (interaction) => {

  try {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "painel") {

      await interaction.deferReply();

      const embed = new EmbedBuilder()
        .setTitle("🎫 CENTRAL DE ATENDIMENTO")
        .setThumbnail("https://cdn.discordapp.com/attachments/1264564541979627604/1504187640524701726/file_000000005270720e895d4916721bd3ce.png?ex=6a08b667&is=6a0764e7&hm=9ffdfd4d3da6d142e8cfaacb51b9088c34025d4947ccadb67a3df9c7b49f7240&")
        .setDescription(`
Aqui você pode abrir um atendimento de forma rápida e organizada. Escolha a opção que melhor se encaixa na sua necessidade e nossa equipe irá te atender o mais rápido possível.

💬 Suporte
Dúvidas, problemas ou ajuda geral com o servidor.

💰 Vendas
Informações sobre compras, serviços e negociações.

🚨 Denúncia
Reporte comportamentos inadequados ou situações irregulares.

🤝 Parceria
Propostas de parceria, divulgação ou colaboração entre servidores.

⚡ Nosso sistema é automático, então seu ticket será criado instantaneamente e encaminhado para a equipe responsável.

📌 Importante:
Explique sua situação com o máximo de detalhes possível para agilizar o atendimento.
`)
        .setImage("https://cdn.discordapp.com/attachments/1264564541979627604/1504187640524701726/file_000000005270720e895d4916721bd3ce.png?ex=6a08b667&is=6a0764e7&hm=9ffdfd4d3da6d142e8cfaacb51b9088c34025d4947ccadb67a3df9c7b49f7240&")
        .setColor("#00b0f4");

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId("ticket_suporte")
          .setLabel("💬 Suporte")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("ticket_vendas")
          .setLabel("💰 Vendas")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("ticket_denuncia")
          .setLabel("🚨 Denúncia")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId("ticket_parceria")
          .setLabel("🤝 Parceria")
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.editReply({
        embeds: [embed],
        components: [row]
      });
    }

  } catch (err) {

    console.log("Erro painel:", err);

    if (interaction.deferred) {
      interaction.editReply({
        content: "❌ Erro ao abrir painel."
      });
    }
  }
});

// ================= TICKETS =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  const staffRoleId = await db.get(`staffRole_${guild.id}`);

  const staffRole = staffRoleId
    ? guild.roles.cache.get(staffRoleId)
    : null;

  async function createTicket(type) {

    try {

      await interaction.deferReply({
        flags: 64
      });

      const category = guild.channels.cache.find(
        c =>
          c.name === "🎫 TICKETS" &&
          c.type === ChannelType.GuildCategory
      );

      if (!category) {
        return interaction.editReply({
          content: "❌ Categoria de tickets não encontrada."
        });
      }

      const channel = await guild.channels.create({
        name: `🎫-${type}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`,
        type: ChannelType.GuildText,
        parent: category.id,

        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },

          {
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          },

          ...(staffRole ? [{
            id: staffRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }] : [])
        ]
      });

      ticketOwners.set(channel.id, user.id);

      ticketData.set(channel.id, {
        createdAt: new Date(),
        messages: 0,
        users: new Set([user.id])
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket ${type}`)
        .setDescription(`
Olá ${user}!

Seu ticket foi criado com sucesso e nossa equipe já foi notificada.

📌 Informações importantes

• Descreva seu problema de forma clara e detalhada.
• Caso necessário, envie prints, vídeos ou comprovantes.
• Evite mencionar membros da equipe sem necessidade.
• Mantenha o respeito durante todo o atendimento.

⏳ Nossa equipe responderá assim que possível.

🔒 Este canal é privado e visível apenas para você e a equipe responsável.

✨ Equipe de Suporte
`)
        .setImage("https://cdn.discordapp.com/attachments/1264564541979627604/1504187640524701726/file_000000005270720e895d4916721bd3ce.png?ex=6a08b667&is=6a0764e7&hm=9ffdfd4d3da6d142e8cfaacb51b9088c34025d4947ccadb67a3df9c7b49f7240&")
        .setColor("#00b0f4");

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId("call_staff")
          .setLabel("🔔 Chamar Staff")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("notify_client")
          .setLabel("📨 Notificar Cliente")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Fechar")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
  content: `<@&1491095314550100100> <@${user.id}>`,
  embeds: [embed],
  components: [row]
});

      // ================= LOG ABERTO =================
      const log = guild.channels.cache.find(
        c => c.name === "📂・tickets-abertos"
      );

      if (log) {

        const data = ticketData.get(channel.id);

        const embedLog = new EmbedBuilder()
          .setTitle("🎫 Ticket Aberto")
          .setColor("Green")
          .addFields(
            {
              name: "🏠 Servidor",
              value: guild.name
            },
            {
              name: "🎫 Ticket",
              value: channel.name
            },
            {
              name: "👤 Aberto por",
              value: user.tag
            },
            {
              name: "📂 Tipo",
              value: type
            },
            {
              name: "📅 Aberto em",
              value: `<t:${Math.floor(data.createdAt.getTime() / 1000)}:F>`
            },
            {
              name: "💬 Mensagens",
              value: "0"
            },
            {
              name: "👥 Participantes",
              value: "1"
            }
          )
          .setTimestamp();

        await log.send({
          embeds: [embedLog]
        });
      }

      return interaction.editReply({
        content: `✅ Ticket criado: ${channel}`
      });

    } catch (err) {

      console.log("Erro ao criar ticket:", err);

      return interaction.editReply({
        content: "❌ Erro ao criar ticket."
      });
    }
  }

  // ================= BOTÕES =================
  if (interaction.customId === "ticket_suporte") {
    return createTicket("suporte");
  }

  if (interaction.customId === "ticket_vendas") {
    return createTicket("vendas");
  }

  if (interaction.customId === "ticket_denuncia") {
    return createTicket("denuncia");
  }

  if (interaction.customId === "ticket_parceria") {
    return createTicket("parceria");
  }

  // ================= STAFF =================
  if (interaction.customId === "call_staff") {

    await interaction.channel.send(
      `🔔 ${staffRole ? `<@&${staffRole.id}>` : ""} ${user} chamou a staff!`
    );

    return interaction.reply({
      content: "✅ Staff notificada!",
      flags: 64
    });
  }

  // ================= NOTIFICAR CLIENTE =================
  if (interaction.customId === "notify_client") {

    const ownerId = ticketOwners.get(interaction.channel.id);

    if (!ownerId) {
      return interaction.reply({
        content: "❌ Dono do ticket não encontrado.",
        flags: 64
      });
    }

    try {

      const ticketUser = await client.users.fetch(ownerId);

      const embed = new EmbedBuilder()
        .setTitle("📨 Atualização no Atendimento")
        .setDescription(`
Olá ${ticketUser},

Sua ticket recebeu uma nova resposta da equipe.

Volte ao servidor para continuar o atendimento.
`)
        .setColor("Blue")
        .setTimestamp();

      await ticketUser.send({
        embeds: [embed]
      });

      return interaction.reply({
        content: "✅ Cliente notificado no privado.",
        flags: 64
      });

    } catch (err) {

      return interaction.reply({
        content: "❌ Não consegui enviar mensagem no privado do cliente.",
        flags: 64
      });
    }
  }

  // ================= FECHAR =================
  if (interaction.customId === "close_ticket") {

    await interaction.deferUpdate();

    const channel = interaction.channel;
    const closer = interaction.user;

    const ownerId = ticketOwners.get(channel.id);

    const owner = ownerId
      ? await guild.members.fetch(ownerId).catch(() => null)
      : null;

    const data = ticketData.get(channel.id);

    const embed = new EmbedBuilder()
      .setTitle("🔒 Ticket Fechado")
      .setColor("Red")
      .addFields(
        {
          name: "🏠 Servidor",
          value: guild.name
        },
        {
          name: "🎫 Ticket",
          value: channel.name
        },
        {
          name: "👤 Fechado por",
          value: closer.tag
        },
        {
          name: "👤 Aberto por",
          value: owner
            ? owner.user.tag
            : "Desconhecido"
        },
        {
          name: "💬 Mensagens",
          value: data
            ? `${data.messages}`
            : "0"
        },
        {
          name: "👥 Participantes",
          value: data
            ? [...data.users].length.toString()
            : "0"
        },
        {
          name: "📅 Aberto em",
          value: data
            ? `<t:${Math.floor(data.createdAt.getTime() / 1000)}:F>`
            : "Desconhecido"
        }
      )
      .setTimestamp();

    const log = guild.channels.cache.find(
      c => c.name === "🔒・tickets-fechados"
    );

    if (log) {
      await log.send({
        embeds: [embed]
      });
    }

    if (owner) {
      owner.send({
        embeds: [embed]
      }).catch(() => {});
    }

    await channel.send("🔒 Fechando ticket...");

    setTimeout(() => {

      ticketOwners.delete(channel.id);
      ticketData.delete(channel.id);

      channel.delete().catch(() => {});

    }, 4000);
  }
});

// ================= CONTADOR =================
client.on("messageCreate", (message) => {

  if (!message.guild) return;

  const data = ticketData.get(message.channel.id);

  if (!data) return;

  data.messages++;

  if (!data.users.has(message.author.id)) {
    data.users.add(message.author.id);
  }
});

// ================= ERROS =================
process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});

// ================= UPTIME ROBOT =================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot online!");
});

app.listen(3000, () => {
  console.log("🌐 Servidor web online.");
});


// ================= LOGIN =================
client.login(process.env.TOKEN);
