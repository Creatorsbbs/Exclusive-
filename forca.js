const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

// ================= DADOS =================
const salas = new Map();

const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ================= UTIL =================
function gerarId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ================= PALAVRAS =================
const categorias = {
  animais: ["GATO", "CACHORRO", "ELEFANTE", "TIGRE"],
  animes: ["NARUTO", "GOKU", "LUFFY", "SASUKE"],
  jogos: ["MINECRAFT", "VALORANT", "FORTNITE", "ROBLOX"],
  geral: ["BRASIL", "COMPUTADOR", "DISCORD", "MUSICA"],
};

// ================= EMBED =================
function montarEmbed(s) {
  const palavra = s.palavra
    .split("")
    .map(l => (s.acertos.includes(l) ? l : "_"))
    .join(" ");

  const status =
    s.vidas <= 0 ? "❌ Derrota" :
    palavra.replace(/ /g, "") === s.palavra ? "🏆 Vitória" :
    "🎮 Em andamento";

  return new EmbedBuilder()
    .setTitle("🎮 FORCA MULTIPLAYER")
    .setColor(
      status === "🏆 Vitória" ? 0x00ff00 :
      status === "❌ Derrota" ? 0xff0000 :
      0x3498db
    )
    .setDescription(
      `📚 Categoria: **${s.categoria.toUpperCase()}**\n\n` +
      `👥 Jogadores:\n${s.jogadores.map(j => `• ${j}`).join("\n")}\n\n` +
      `👑 Turno: <@${s.vez}>\n\n` +
      `🔤 Palavra:\n\`${palavra}\`\n\n` +
      `❤️ Vidas: ${s.vidas}\n` +
      `❌ Erros: ${s.erros}\n\n` +
      `🔡 Letras: ${s.usadas.join(", ") || "Nenhuma"}\n\n` +
      `📌 Status: **${status}**`
    );
}

// ================= TECLADO =================
function teclado(id, usados = []) {
  const rows = [];
  let row = new ActionRowBuilder();

  letras.forEach((l, i) => {
    const btn = new ButtonBuilder()
      .setCustomId(`forca_${id}_${l}`)
      .setLabel(l)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(usados.includes(l));

    row.addComponents(btn);

    if ((i + 1) % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder();
    }
  });

  if (row.components.length) rows.push(row);

  return rows;
}

// ================= CRIAR JOGO =================
function criarJogo(categoria, jogadores) {
  const id = gerarId();

  const palavras = categorias[categoria] || categorias.geral;
  const palavra = palavras[Math.floor(Math.random() * palavras.length)];

  salas.set(id, {
    id,
    categoria,
    palavra,
    jogadores,
    vez: jogadores[0],
    acertos: [],
    usadas: [],
    erros: 0,
    vidas: 5,
  });

  return id;
}

// ================= PROCESSAR LETRA =================
async function processar(interaction, letra) {
  const id = interaction.customId.split("_")[1];
  const sala = salas.get(id);

  if (!sala) {
    return interaction.reply({
      content: "❌ Partida não encontrada.",
      ephemeral: true,
    }).catch(() => {});
  }

  if (sala.vidas <= 0) {
    return interaction.reply({
      content: "❌ Essa partida já acabou.",
      ephemeral: true,
    }).catch(() => {});
  }

  if (sala.usadas.includes(letra)) {
    return interaction.reply({
      content: "⚠️ Letra já usada.",
      ephemeral: true,
    }).catch(() => {});
  }

  sala.usadas.push(letra);

  if (sala.palavra.includes(letra)) {
    sala.acertos.push(letra);
  } else {
    sala.erros++;
    sala.vidas--;
  }

  const idx = sala.jogadores.indexOf(sala.vez);
  sala.vez = sala.jogadores[(idx + 1) % sala.jogadores.length];

  return interaction.update({
    embeds: [montarEmbed(sala)],
    components: teclado(id, sala.usadas),
  }).catch(() => {});
}

// ================= SETUP =================
module.exports = function setupForca(client) {
  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.isButton()) return;

      if (interaction.customId.startsWith("forca_")) {
        const letra = interaction.customId.split("_")[2];
        return processar(interaction, letra);
      }
    } catch (err) {
      console.log("Erro forca:", err);
    }
  });
};

// export útil
module.exports.criarJogo = criarJogo;
