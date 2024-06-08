import type { ClientEvents } from 'discord.js'
import type { CustomClient } from './client'

export interface DiscordEvent<Event extends keyof ClientEvents> {
  name: Event
  handle: (client: CustomClient, ...args: ClientEvents[Event]) => Promise<void> | void
  once?: boolean
}
