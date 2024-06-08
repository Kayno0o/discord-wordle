import { type FSWatcher, watch } from 'node:fs'
import path from 'node:path'
import { Client, type ClientEvents, type ClientOptions } from 'discord.js'
import { debounce } from 'lodash'
import chalk from 'chalk'
import { loadCommands, loadEvents } from '../utils/loader'
import { checkCommands } from '../utils/deploy'
import type { Command } from './commands'
import type { DiscordEvent } from './events'

export class CustomClient extends Client<true> {
  commands: Command[] = []
  events: DiscordEvent<keyof ClientEvents>[] = []
  watcher?: FSWatcher

  constructor(options: ClientOptions) {
    super(options)
  }

  async loadCommands() {
    this.commands = await loadCommands()
    checkCommands(this.commands)
  }

  async loadEvents() {
    this.events = await loadEvents()
  }

  async start() {
    await Promise.all([this.loadCommands(), this.loadEvents()])

    for (const event of this.events) {
      if (event.once)
        this.once(event.name, (...args: ClientEvents[typeof event.name]) => event.handle(this, ...args))
      else
        this.on(event.name, (...args: ClientEvents[typeof event.name]) => event.handle(this, ...args))
    }

    this.login(process.env.BOT_TOKEN)

    const debounceReload = debounce(async () => await this.loadCommands(), 300)

    const watchPath = path.resolve(process.cwd(), 'src/commands')
    console.log(chalk.cyan('[watch]'), watchPath)
    this.watcher = watch(
      watchPath,
      { recursive: true },
      (event, filename) => {
        console.log(event, filename)
        if (!filename || !filename.endsWith('.ts'))
          return

        debounceReload()
      },
    )

    process.on('SIGINT', () => {
      console.log(chalk.red('[kill]'), 'watchers')
      this.watcher?.close()

      process.exit(0)
    })
  }
}
