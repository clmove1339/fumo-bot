const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

class MusicQueue {
    constructor(interaction) {
        this.textChannel = interaction.channel;
        this.voiceChannel = interaction.member.voice.channel;
        this.connection = null;
        this.songs = [];
        this.volume = 1;
        this.player = createAudioPlayer();
        this.setupListeners();
    }

    setupListeners() {
        this.player.on(AudioPlayerStatus.Idle, () => this.nextSong());
        this.player.on('error', error => this.handleError(error));
    }

    async nextSong() {
        try {
            await this.play();
        } catch (error) {
            this.handleError(error);
        }
    }

    async play() {
        if (this.songs.length === 0) {
            this.textChannel.send('The queue has ended.');
            this.leaveChannel();
            return;
        }

        try {
            const song_url = this.songs.shift();
            const stream = await play.stream(song_url);
            const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
            resource.volume.setVolume(this.volume);
            await this.ensureConnection();
            this.player.play(resource);
            this.connection.subscribe(this.player);
            await this.announceSong(song_url);
        } catch (error) {
            throw new Error(`Error playing song: ${error.message}`);
        }
    }

    async announceSong(song_url) {
        try {
            const songInfo = await this.fetchSongInfo(song_url);
            this.textChannel.send(`Now playing: ${songInfo.title}`);
        } catch (error) {
            this.textChannel.send(`Error fetching song info: ${error.message}`);
        }
    }

    async fetchSongInfo(song_url) {
        if (play.yt_validate(song_url)) {
            const videoDetails = await play.video_info(song_url);
            return { title: videoDetails.video_details.title };
        } else if (play.so_validate(song_url)) {
            const trackInfo = await play.soundcloud(song_url);
            return { title: trackInfo.name };
        }
        throw new Error('Invalid song URL');
    }

    async ensureConnection() {
        if (!this.voiceChannel) throw new Error('Voice channel is not available.');
        if (this.connection?.state.status === VoiceConnectionStatus.Destroyed) this.connection = null;
        if (this.connection) return this.connection;

        this.connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guild.id,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        });

        await entersState(this.connection, VoiceConnectionStatus.Ready, 30e3);
        this.connection.on(VoiceConnectionStatus.Disconnected, () => this.leaveChannel());
        return this.connection;
    }

    leaveChannel() {
        this.textChannel.send('Disconnected from the voice channel, the queue has been cleared.');
        this.connection?.destroy();
        this.connection = null;
    }

    setVolume(newVolume) {
        if (typeof newVolume !== 'number' || newVolume < 0 || newVolume > 1) {
            throw new Error('Volume must be a number between 0 and 1.');
        }
        this.volume = newVolume;
        const resource = this.player.state.resource;
        if (resource?.volume) {
            resource.volume.setVolume(newVolume);
        }
    }

    handleError(error) {
        this.textChannel.send(`Error: ${error.message}`);
        this.connection?.destroy();
        this.connection = null;
    }
}

const validateURL = (url) => play.validate(url);

module.exports = { MusicQueue, validateURL };
