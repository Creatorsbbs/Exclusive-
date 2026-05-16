const { REST, Routes, SlashCommandBuilder } = require("discord.js");

module.exports = async (client) => {

  const commands = [
    new SlashCommandBuilder()
      .setName("painel")
      .setDescription("Abre o painel de tickets"),

    new SlashCommandBuilder()
      .setName("forca")
      .setDescription("Inicia forca multiplayer"),

    new SlashCommandBuilder()
      .setName("setstaff")
      .setDescription("Define staff")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Comandos registrados");
  } catch (err) {
    console.log("❌ erro:", err);
  }
};
