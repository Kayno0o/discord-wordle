import fs from 'node:fs'
import path from 'node:path'
import { REST, Routes } from 'discord.js'
import _ from 'lodash'
import chalk from 'chalk'
import type { Command, RestCommand } from '~/types/commands'

let lastCall = 0

export async function checkCommands(commands: Command[]) {
  const jsonCommands = JSON.parse(JSON.stringify(commands.map(c => c.command.toJSON())))

  const oldCommandsPath = path.resolve(process.cwd(), 'src', 'commands', 'commands.json')
  if (!fs.existsSync(oldCommandsPath))
    fs.writeFileSync(oldCommandsPath, '{}')
  const oldCommands = JSON.parse(fs.readFileSync(oldCommandsPath, 'utf-8'))

  if (_.isEqual(oldCommands, jsonCommands))
    return

  await deployCommands(jsonCommands)

  fs.writeFileSync(oldCommandsPath, JSON.stringify(jsonCommands))
}

export async function deployCommands(jsonCommands: any[]) {
  const { BOT_TOKEN: token, CLIENT_ID: clientId } = process.env

  if (!token || !clientId)
    process.exit(1)

  const rest = new REST().setToken(token)

  if (Date.now() - lastCall < 300)
    return

  lastCall = Date.now()

  try {
    console.log(chalk.cyan('[REST:post]'), jsonCommands.length, 'commands')

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: jsonCommands },
    ) as RestCommand[]

    console.log(chalk.green('[REST:success]'), 'reloaded', data.length, 'commands')
  }
  catch (error) {
    console.error(chalk.red('[REST:error]'), error)
  }
}
