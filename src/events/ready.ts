import chalk from 'chalk'
import type { DiscordEvent } from '../types/events'

export const event: DiscordEvent<'ready'> = {
  name: 'ready',
  once: true,
  handle: async (client) => {
    console.log(chalk.green('[started]'), 'bot', client.user.tag)
  },
}
