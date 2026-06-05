const fs = require('fs');
const path = require('path');

function loadCommands() {
  const commands = new Map();
  const commandsPath = path.join(__dirname, '..', 'commands');

  for (const entry of fs.readdirSync(commandsPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const folderPath = path.join(commandsPath, entry.name);
      for (const file of fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'))) {
        const command = require(path.join(folderPath, file));
        commands.set(command.data.name, command);
      }
      continue;
    }

    if (entry.name.endsWith('.js')) {
      const command = require(path.join(commandsPath, entry.name));
      commands.set(command.data.name, command);
    }
  }

  return commands;
}

module.exports = { loadCommands };
