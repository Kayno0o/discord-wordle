import { UserRepository } from '../database/repository/UserRepository'
import type { DiscordEvent } from '../types/events'

export const event: DiscordEvent<'interactionCreate'> = {
  name: 'interactionCreate',
  handle: (client, interaction) => {
    UserRepository.findOneBy({ where: { discord_id: interaction.user.id } }) ?? UserRepository.create({ discord_id: interaction.user.id })

    if (interaction.isCommand()) {
      const name = interaction.commandName
      const command = client.commands.find(c => c.command.name === name)
      if (command && command.handle)
        command.handle(client, interaction)
      return
    }

    if (interaction.isModalSubmit()) {
      const args = interaction.customId.split('|')
      const name = args[args.length - 1]
      const command = client.commands.find(c => c.command.name === name)
      if (command && command.handleModal)
        command.handleModal(client, interaction)
      return
    }

    if (interaction.isButton()) {
      const args = interaction.customId.split('|')
      const name = args[args.length - 1]
      const command = client.commands.find(c => c.command.name === name)
      if (command && command.handleButton)
        command.handleButton(client, interaction)
    }
  },
}
