const express = require("express");
const app = express();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionsBitField,
  ChannelType,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// ===== WEB =====
app.get("/", (req, res) => res.send("Bot online ✅"));
app.listen(process.env.PORT || 3000);

// ===== CONFIG =====
const STAFF_ROLE_NAME = "Suporte";
const LOG_CHANNEL_NAME = "logs-tickets";

const categorias = {
  parceria: "📁 PARCERIAS",
  compras: "📁 COMPRAS",
  outros: "📁 OUTROS",
  denuncias: "📁 DENÚNCIAS",
  duvidas: "📁 DÚVIDAS"
};

// ===== READY =====
client.once("ready", async () => {
  console.log(`Logado como ${client.user.tag}`);

  const commands = [
    { name: "painel", description: "Enviar painel de tickets" }
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
});

// ===== FUNÇÕES =====
async function getOrCreateCategory(guild, nome) {
  let cat = guild.channels.cache.find(
    c => c.name === nome && c.type === ChannelType.GuildCategory
  );

  if (!cat) {
    cat = await guild.channels.create({
      name: nome,
      type: ChannelType.GuildCategory
    });
  }

  return cat;
}

async function gerarTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });
  let html = `<h2>${channel.name}</h2>`;
  messages.reverse().forEach(m => {
    html += `<p><b>${m.author.tag}:</b> ${m.content}</p>`;
  });
  return html;
}

// ===== INTERAÇÕES =====
client.on("interactionCreate", async (interaction) => {

  // COMANDO /painel
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "painel") {

      const embed = new EmbedBuilder()
        .setTitle("🎟️ CENTRAL DE ATENDIMENTO")
        .setDescription(
`𝖈𝖔𝖒𝖒𝖚𝖓𝖓𝖎𝖙𝖞 𝖁𝕻

Escolha uma opção:

🤝 Parceria
💰 Compras
📩 Outros
🚨 Denúncias
❓ Dúvidas`
        )
        .setColor("Purple");

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("🎟️ Abrir Ticket")
        .addOptions([
          { label: "Parceria", value: "parceria", emoji: "🤝" },
          { label: "Compras", value: "compras", emoji: "💰" },
          { label: "Outros", value: "outros", emoji: "📩" },
          { label: "Denúncias", value: "denuncias", emoji: "🚨" },
          { label: "Dúvidas", value: "duvidas", emoji: "❓" }
        ]);

      await interaction.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)]
      });
    }
  }

  // MENU
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "ticket_menu") {

      const tipo = interaction.values[0];

      const categoria = await getOrCreateCategory(
        interaction.guild,
        categorias[tipo]
      );

      const staffRole = interaction.guild.roles.cache.find(
        r => r.name === STAFF_ROLE_NAME
      );

      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: categoria.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("assumir")
          .setLabel("Assumir")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("fechar")
          .setLabel("Fechar")
          .setStyle(ButtonStyle.Danger)
      );

      await canal.send({
        content: `🎟️ Ticket de ${interaction.user}\n📂 ${tipo}`,
        components: [row]
      });

      await interaction.reply({
        content: `✅ Ticket criado: ${canal}`,
        ephemeral: true
      });
    }
  }

  // BOTÕES
  if (interaction.isButton()) {

    if (interaction.customId === "assumir") {
      await interaction.reply(`👨‍💻 ${interaction.user} assumiu o ticket`);
    }

    if (interaction.customId === "fechar") {
      try {
        const transcript = await gerarTranscript(interaction.channel);

        const logChannel = interaction.guild.channels.cache.find(
          c => c.name === LOG_CHANNEL_NAME
        );

        if (logChannel) {
          await logChannel.send({
            content: `📁 ${interaction.channel.name}`,
            files: [{
              attachment: Buffer.from(transcript),
              name: "transcript.html"
            }]
          });
        }

        try {
          await interaction.user.send("📩 Ticket encerrado!");
        } catch {}

        await interaction.reply("🔒 Fechando...");
        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 2000);

      } catch (e) {
        console.error(e);
      }
    }
  }

});

client.login(process.env.TOKEN);
