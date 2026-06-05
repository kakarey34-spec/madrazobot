const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config');
const { loadCommands } = require('./handlers/commandHandler');

const commands = [...loadCommands().values()].map((cmd) => cmd.data.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash command(s)...`);

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    console.log('Slash commands registered successfully.');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
    process.exit(1);
  }
})();
