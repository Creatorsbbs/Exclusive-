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

// ================= READY =================
client.once("ready", async () => {
  console.log(`🤖 Online como ${client.user.tag}`);

  client.guilds.cache.forEach(guild => setupServer(guild));
});

// ================= SETUP =================
async function setupServer(guild) {
  try {

    let staffRoleId = await db.get(`staffRole_${guild.id}`);

    if (!staffRoleId) staffRoleId = "1491095314550100100";

    let staffRole = staffRoleId
      ? guild.roles.cache.get(staffRoleId)
      : null;

    // OPEN LOGS
    let openLogs = guild.channels.cache.find(c => c.name === "📂・tickets-abertos");

    if (!openLogs) {
      openLogs = await guild.channels.create({
        name: "📂・tickets-abertos",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
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

      console.log("✔ tickets-abertos criado");
    }

    // CLOSE LOGS
    let closeLogs = guild.channels.cache.find(c => c.name === "🔒・tickets-fechados");

    if (!closeLogs) {
      closeLogs = await guild.channels.create({
        name: "🔒・tickets-fechados",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
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

      console.log("✔ tickets-fechados criado");
    }

    // CATEGORY
    let ticketCategory = guild.channels.cache.find(
      c => c.name === "🎫 TICKETS" && c.type === ChannelType.GuildCategory
    );

    if (!ticketCategory) {
      ticketCategory = await guild.channels.create({
        name: "🎫 TICKETS",
        type: ChannelType.GuildCategory
      });

      console.log("✔ categoria criada");
    }

  } catch (err) {
    console.log("Erro setup:", err);
  }
}

// ================= PAINEL (NÃO ALTERADO VISUALMENTE) =================
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.content.toLowerCase() !== "painel") return;

    const embed = new EmbedBuilder()
      .setTitle("🎫 CENTRAL DE ATENDIMENTO")
      .setThumbnail("https://cdn.discordapp.com/attachments/1264564541979627604/1504187640524701726/file_000000005270720e895d4916721bd3ce.png")
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

⚡ Sistema automático

📌 Explique sua situação com detalhes.
`)
      .setImage("https://cdn.discordapp.com/attachments/1264564541979627604/1504187640524701726/file_000000005270720e895d4916721bd3ce.png")
      .setColor("#00b0f4");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_suporte").setLabel("💬 Suporte").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ticket_vendas").setLabel("💰 Vendas").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_denuncia").setLabel("🚨 Denúncia").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ticket_parceria").setLabel("🤝 Parceria").setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({
      embeds: [embed],
      components: [row]
    });

  } catch (err) {
    console.log("Erro painel:", err);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  const staffRoleId = await db.get(`staffRole_${guild.id}`);
  const staffRole = staffRoleId ? guild.roles.cache.get(staffRoleId) : null;

  async function createTicket(type) {
    try {

      await interaction.deferReply({ flags: 64 });

      const category = guild.channels.cache.find(
        c => c.name === "🎫 TICKETS" && c.type === ChannelType.GuildCategory
      );

      if (!category) {
        return interaction.editReply({ content: "❌ Categoria não encontrada." });
      }

      const channel = await guild.channels.create({
        name: `🎫-${type}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        type: ChannelType.GuildText,
        parent: category.id,

        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
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

      // 🔥 TEU EMBED ORIGINAL MANTIDO
      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket ${type}`)
        .setDescription(`
Olá ${user}

Seu ticket foi criado com sucesso.

📌 Informações importantes:
• Explique tudo com detalhes
• Envie provas se necessário
• Aguarde atendimento
`)
        .setColor("#00b0f4");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Fechar")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `<@${user.id}>`,
        embeds: [embed],
        components: [row]
      });

      // LOG ABERTO (NÃO MEXI NO TEU SISTEMA)
      const log = guild.channels.cache.find(c => c.name === "📂・tickets-abertos");

      if (log) {
        const data = ticketData.get(channel.id);

        const embedLog = new EmbedBuilder()
          .setTitle("🎫 Ticket Aberto")
          .setColor("Green")
          .addFields(
            { name: "Servidor", value: guild.name },
            { name: "Ticket", value: channel.name },
            { name: "Usuário", value: user.tag },
            { name: "Tipo", value: type },
            { name: "Data", value: `<t:${Math.floor(data.createdAt.getTime() / 1000)}:F>` }
          );

        await log.send({ embeds: [embedLog] });
      }

      return interaction.editReply({
        content: `✅ Ticket criado: ${channel}`
      });

    } catch (err) {
      console.log("Erro ticket:", err);
      return interaction.editReply({ content: "❌ erro ao criar ticket" });
    }
  }

  if (interaction.customId === "ticket_suporte") return createTicket("suporte");
  if (interaction.customId === "ticket_vendas") return createTicket("vendas");
  if (interaction.customId === "ticket_denuncia") return createTicket("denuncia");
  if (interaction.customId === "ticket_parceria") return createTicket("parceria");
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
