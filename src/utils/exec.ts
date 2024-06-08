import { execSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'
import chalk from 'chalk'

export function exec(command: string, options?: { dir?: string | string[], isBase64?: boolean }) {
  let dir = process.cwd()
  if (options?.dir)
    dir = path.resolve(process.cwd(), ...(Array.isArray(options.dir) ? options.dir : [options.dir]))

  console.log(chalk.yellow('[RUN]'), command)
  const buffer = execSync(command, { cwd: dir, stdio: 'pipe' })

  if (options?.isBase64) {
    return Buffer.from(buffer.toString(), 'base64')
  }

  return buffer
}
