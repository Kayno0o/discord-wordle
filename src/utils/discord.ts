import { ButtonBuilder, type ButtonStyle } from 'discord.js'

export interface ButtonProps {
  id: (string | number)[]
  label: string
  style: ButtonStyle
  disabled?: boolean
  emoji?: string
  url?: string
}

export function button(props: ButtonProps) {
  const button = new ButtonBuilder()
    .setCustomId(props.id.join('|'))
    .setLabel(props.label)
    .setStyle(props.style)

  if (props.disabled)
    button.setDisabled(props.disabled)

  if (props.url)
    button.setURL(props.url)

  return button
}
