import { type BaseInteraction, type ButtonInteraction, type CommandInteraction, type ModalSubmitInteraction, SlashCommandBuilder } from 'discord.js'
import type { CustomClient } from './client'

type Handler<T extends BaseInteraction> = (client: CustomClient, interaction: T) => (Promise<void> | void)

interface PropsType {
  command: {
    name: string
    description: string
    nsfw?: boolean
  }
  setup?: (command: SlashCommandBuilder) => void
  handle?: Handler<CommandInteraction>
  handleModal?: Handler<ModalSubmitInteraction>
  handleButton?: Handler<ButtonInteraction>
}

export class Command {
  command: SlashCommandBuilder

  handle?: Handler<CommandInteraction>
  handleModal?: Handler<ModalSubmitInteraction>
  handleButton?: Handler<ButtonInteraction>

  constructor(props: PropsType) {
    this.command = new SlashCommandBuilder()
      .setName(props.command.name)
      .setDescription(props.command.description)

    if (props.command.nsfw)
      this.command.setNSFW(props.command.nsfw)

    if (props.setup)
      props.setup(this.command)

    this.handle = props.handle
    this.handleModal = props.handleModal
    this.handleButton = props.handleButton
  }
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
