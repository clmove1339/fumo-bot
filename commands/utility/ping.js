const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and latency information.'),

    async execute(interaction) {
        const latency = Math.round(interaction.client.ws.ping);
        await interaction.reply(`Pong! Latency is **\`${latency}ms\`**.`);
    }
};
