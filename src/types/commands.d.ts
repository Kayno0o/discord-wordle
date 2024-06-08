import type { ButtonInteraction, CommandInteraction, ModalSubmitInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js'
import type { CustomClient } from './client'

export interface Command {
  command: SlashCommandBuilder
  handle?: (client: CustomClient, interaction: CommandInteraction) => Promise<void> | void
  handleModal?: (client: CustomClient, interaction: ModalSubmitInteraction) => Promise<void> | void
  handleButton?: (client: CustomClient, interaction: ButtonInteraction) => Promise<void> | void
}

export interface RestCommand {
  application_id: string
  default_member_permissions: null
  description: string
  description_localizations: string
  guild_id: string
  id: string
  name: string
  name_localizations: string
  nsfw: false
  type: number
  version: string
}
