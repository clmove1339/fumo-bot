require('dotenv').config();
const { readdir } = require('node:fs/promises');
const { join } = require('node:path');
const { Client, GatewayIntentBits, ActivityType, Collection, Events } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { info, error } = require('./logger');

const client = new Client({
    intents: Object.values(GatewayIntentBits),
    presence: { status: 'dnd', activities: [{ name: 'anime', type: ActivityType.Watching }] }
});

client.commands = new Collection();
client.servers = new Collection();

const loadCommands = async () => {
    const commandFolders = await readdir(join(__dirname, 'commands'));

    for (const folder of commandFolders) {
        const folderPath = join(__dirname, 'commands', folder);
        const commandFiles = (await readdir(folderPath)).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = join(folderPath, file);
            const command = require(filePath);
            if (command.data?.name && typeof command.execute === 'function') {
                client.commands.set(command.data.name, command);
            }
        }
    }

    info(`Loaded ${client.commands.size} commands.`); // Log the number of loaded commands
};

const deployCommands = async () => {
    const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
    const commands = Array.from(client.commands.values()).map(command => command.data.toJSON());

    try {
        await rest.put(Routes.applicationCommands(client.application.id), { body: commands });
        info(`Successfully uploaded ${commands.length} application commands.`); // Log successful upload
    } catch (error) {
        error(`Failed to upload application commands: ${error}`); // Log error
    }
};

client.once(Events.ClientReady, async () => {
    await deployCommands();
    info(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        await command.execute(interaction);
    } catch (error) {
        error(`Error executing command: ${error}`);
        await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
        });
    }
});

client.on(Events.Error, async (e) => {
    error(e);
})

const initialize = (async () => {
    await loadCommands();
    await client.login(process.env.TOKEN);

    return true;
})();

if (!initialize) error('Failed to start bot.');