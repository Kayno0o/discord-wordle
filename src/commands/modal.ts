import { ActionRowBuilder, type ModalActionRowComponentBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import type { Command } from '../types/commands'

export const command: Command = {
  command: new SlashCommandBuilder()
    .setName('modal')
    .setDescription('Open a modal'),
  handle: async (_, interaction) => {
    const author = interaction.user

    const modal = new ModalBuilder()
      .setCustomId(`${author.id}|modal`)
      .setTitle('My Modal')

    const favoriteColorInput = new TextInputBuilder()
      .setCustomId('favoriteColorInput')
      .setLabel('What\'s your favorite color?')
      .setStyle(TextInputStyle.Short)

    const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(favoriteColorInput)
    modal.addComponents(firstActionRow)

    await interaction.showModal(modal)
  },
}
