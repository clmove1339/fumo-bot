const { SlashCommandBuilder, OAuth2Scopes, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Generates a link to invite the bot to your server.'),

    async execute(interaction) {
        await interaction.deferReply();
        const link = interaction.client.generateInvite({
            scopes: [OAuth2Scopes.Bot],
            permissions: [PermissionFlagsBits.Administrator]
        });

        await interaction.reply(`You can invite me using this [link](${link}).`);
    }
};
