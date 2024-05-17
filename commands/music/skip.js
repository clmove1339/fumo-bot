const { SlashCommandBuilder } = require('discord.js');
const { error } = require('../../logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the currently playing song or multiple songs')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Number of songs to skip')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const queue = interaction.client.servers.get(interaction.guildId);
        if (!queue || !queue.songs.length) {
            return await interaction.followUp('There are no songs to skip.');
        }

        const number = interaction.options.getInteger('number') || 1;

        if (number > queue.songs.length) {
            return await interaction.followUp(`There are only ${queue.songs.length} songs in the queue.`);
        }

        try {
            // Skipping songs by removing them from the queue and stopping the player
            if (number > 1) {
                queue.songs.splice(0, number - 1);
            }
            queue.player.stop();

            await interaction.followUp(`Skipped ${number} song(s).`);
        } catch (err) {
            error(`Error executing skip command: ${err.message}`);
            await interaction.followUp(`Error: ${err.message}`);
        }
    }
};
