import { SlashCommandBuilder } from 'discord.js'
import type { Command } from '../types/commands'

export const command: Command = {
  command: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Returns pong !'),
  handle: async (_, interaction) => {
    await interaction.reply('P0ng !')
  },
}
