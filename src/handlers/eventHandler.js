const fs = require('fs');
const path = require('path');

function registerEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');

  for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
    const event = require(path.join(eventsPath, file));
    const listener = (...args) => event.execute(...args, client);

    if (event.once) {
      client.once(event.name, listener);
    } else {
      client.on(event.name, listener);
    }
  }
}

module.exports = { registerEvents };
