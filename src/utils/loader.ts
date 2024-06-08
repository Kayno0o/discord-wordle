import fs from 'node:fs'
import path from 'node:path'
import type { ClientEvents } from 'discord.js'
import chalk from 'chalk'
import type { Command } from '../types/commands'
import type { DiscordEvent } from '../types/events'
import { notEmpty } from './arrayUtils'

function deleteModule(moduleName: string) {
  const solvedName = require.resolve(moduleName)
  delete require.cache[solvedName]
}

async function loadImport<T>(filepath: string, name: string): Promise<T | null> {
  deleteModule(filepath)

  const obj = (await import(filepath))

  if (!obj)
    return null

  if (name in obj)
    return obj[name] ?? null

  return obj.default ?? null
}

export async function loadCommands() {
  const commandsPath = path.resolve(process.cwd(), 'src/commands')
  const files = loadFiles(commandsPath, 'ts')

  console.log(chalk.cyan('[load]'), 'commands')
  files.map(filepath => console.log(' -', filepath.replace(commandsPath, '')))

  return (await Promise.all(files.map(filepath => loadImport<Command>(filepath, 'command')))).filter(notEmpty)
}

export async function loadEvents() {
  const eventsPath = path.resolve(process.cwd(), 'src/events')
  const files = loadFiles(eventsPath, 'ts')

  return (await Promise.all(files.map(filepath => loadImport<DiscordEvent<keyof ClientEvents>>(filepath, 'event')))).filter(notEmpty)
}

export function loadFiles(pathname: string, extension?: string) {
  const dir = path.resolve(process.cwd(), pathname)
  return (fs.readdirSync(dir, { recursive: true }) as string[])
    .map(filepath => path.resolve(dir, filepath))
    .filter(
      filepath =>
        fs.existsSync(filepath)
        && !fs.lstatSync(filepath).isDirectory()
        && (extension ? filepath.endsWith(toExtension(extension)) : true),
    )
}

export function toExtension(extension: string) {
  if (extension.startsWith('.'))
    return extension

  return `.${extension}`
}
