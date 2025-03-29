const express = require('express');
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

const app = express();
app.use(express.json());

app.post('/discord', async (req, res) => {
  try {
    // Only allow POST requests and check required parameters.
    const { token, clientId, guildId } = req.body;
    if (!token || !clientId || !guildId) {
      return res.status(400).json({ error: 'token, clientId, and guildId are required' });
    }

    // Define the slash command(s)
    const commands = [
      {
        name: 'ping',
        description: 'Replies with Pong!'
      }
    ];

    // Register the commands as guild commands (useful during development).
    const rest = new REST({ version: '10' }).setToken(token);
    try {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log('✅ Successfully registered application commands.');
    } catch (registrationError) {
      console.error('Error registering commands:', registrationError);
      throw new Error('Failed to register slash commands');
    }

    // Create the Discord bot client.
    const bot = new Client({ intents: [GatewayIntentBits.Guilds] });

    bot.once('ready', () => {
      console.log(`✅ Bot started as ${bot.user.tag}`);
      res.status(200).json({ message: `Bot started as ${bot.user.tag}` });

      // Shut down the bot after 5 minutes.
      setTimeout(() => {
        console.log(`⏳ Shutting down bot: ${bot.user.tag}`);
        bot.destroy();
      }, 5 * 60 * 1000);
    });

    bot.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return;
      if (interaction.commandName === 'ping') {
        try {
          // Defer reply to avoid timeouts.
          await interaction.deferReply();
          await interaction.followUp(`I'm running! Bot Name: ${bot.user.tag}`);
        } catch (interactionError) {
          console.error('Error handling ping command:', interactionError);
        }
      }
    });

    try {
      await bot.login(token);
    } catch (loginError) {
      console.error('Bot login error:', loginError);
      throw new Error('Failed to login the bot');
    }
  } catch (error) {
    console.error("API Error: ", error);
    return res.status(500).json({ error: error.message });
  }
});

// Start the Express server on the port provided by Render or fallback to 3000.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
