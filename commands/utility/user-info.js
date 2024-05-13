const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user-info')
        .setDescription('Provides information about the user.')
        .addUserOption(option => option.setName('user')
            .setDescription('Select a user to get information about.')
            .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.editReply('The user is not on this server.');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(user.tag)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'ID', value: user.id, inline: false },
                { name: 'Account Creation Date', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false },
                { name: 'Joined Server At', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
                { name: 'Flags', value: user.flags.toArray().join(', ') || 'none', inline: false },
                { name: 'Status', value: member.presence?.status || 'offline', inline: false },
                { name: 'Roles', value: member.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString()).join(' ') || 'none', inline: false },
                { name: 'Permissions', value: member.permissions.toArray().join(', ') || 'none', inline: false }
            )
            .setDescription('User information retrieved successfully.');

        if (user.globalName) {
            embed.setTitle(`${user.tag} (${user.globalName})`);
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
