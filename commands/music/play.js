const { SlashCommandBuilder } = require('discord.js');
const { MusicQueue, validateURL } = require('../../utils.js');
const { info, error } = require('../../logger');
const play = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or playlist from YouTube or SoundCloud')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('The URL of the song or playlist to play')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const songUrl = interaction.options.getString('song');

        try {
            if (!await validateURL(songUrl)) {
                return await interaction.followUp('The URL provided is not supported.');
            }

            let queue = interaction.client.servers.get(interaction.guildId);
            if (!queue) {
                queue = new MusicQueue(interaction);
                interaction.client.servers.set(interaction.guildId, queue);
            }

            const songs = await getSongs(songUrl);
            if (!songs.length) {
                return await interaction.followUp('No valid songs found in the provided URL.');
            }

            queue.songs.push(...songs);
            await interaction.followUp(`${songs.length} song(s) added to the queue.`);

            if (!queue.connection) {
                await queue.play();
            }
        } catch (err) {
            error(`Error executing play command: ${err.message}`);
            await interaction.followUp(`Error: ${err.message}`);
        }
    }
};

async function getSongs(url) {
    const validate = await validateURL(url);

    if (validate === 'yt_video') {
        return [url];
    } else if (validate === 'yt_playlist') {
        const playlist = await play.playlist_info(url, { incomplete: true });
        return playlist.videos.map(video => video.url);
    }
    return [];
}
