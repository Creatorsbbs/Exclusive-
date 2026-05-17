const {
    EmbedBuilder
} = require("discord.js");

module.exports = async (interaction) => {

    if (interaction.commandName !== "skin") return;

    const username = interaction.options.getString("usuario");

    try {

        const response = await fetch(
            "https://users.roblox.com/v1/usernames/users",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    usernames: [username]
                })
            }
        );

        const data = await response.json();

        if (!data.data.length) {
            return interaction.reply({
                content: "Usuário não encontrado.",
                ephemeral: true
            });
        }

        const user = data.data[0];

        const avatarResponse = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${user.id}&size=720x720&format=Png&isCircular=false`
        );

        const avatarData = await avatarResponse.json();

        const avatar = avatarData.data[0].imageUrl;

        const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(`Skin de ${user.name}`)
            .setImage(avatar);

        interaction.reply({
            embeds: [embed]
        });

    } catch (err) {

        console.log(err);

        interaction.reply({
            content: "Erro ao buscar skin.",
            ephemeral: true
        });
    }
};
