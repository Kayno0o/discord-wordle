import type { DiscordEvent } from '../types/events'

export const event: DiscordEvent<'interactionCreate'> = {
  name: 'interactionCreate',
  handle: (client, interaction) => {
    if (interaction.isCommand()) {
      const name = interaction.commandName
      const command = client.commands.find(c => c.command.name === name)
      if (command && command.handle)
        command.handle(client, interaction)
      return
    }

    if (interaction.isModalSubmit()) {
      const name = interaction.customId.split('|')[1]
      const command = client.commands.find(c => c.command.name === name)
      if (command && command.handleModal)
        command.handleModal(client, interaction)
    }
  },
}
