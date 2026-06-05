const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { token, port } = require('./config');
const { createWebServer } = require('./web/server');
const { loadCommands } = require('./handlers/commandHandler');
const { registerEvents } = require('./handlers/eventHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection(loadCommands());
registerEvents(client);
createWebServer(port);

client.login(token);
