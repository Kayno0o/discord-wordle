import { SlashCommandBuilder } from 'discord.js'
import type { Command } from '../types/commands'

const min = 3
const max = 10

export const command: Command = {
  command: new SlashCommandBuilder()
    .setName('wordle')
    .setDescription('Creates a wordle !')
    .addIntegerOption(builder =>
      builder
        .setName('length')
        .setDescription('Word length')
        .addChoices(Array(max - min).map((_, v) => ({ name: String(v + min), value: v + min }))),
    ),
  handle: async (client, interaction) => {
    await interaction.reply('P0ng !')
  },
}
