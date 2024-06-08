import { execSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import chalk from 'chalk'

export function exec(command: string, options?: { dir?: string | string[] }) {
  let dir = process.cwd()
  if (options?.dir)
    dir = path.resolve(process.cwd(), ...(Array.isArray(options.dir) ? options.dir : [options.dir]))

  console.log(chalk.yellow('[RUN]'), command)
  return execSync(command, { cwd: dir, stdio: 'pipe' })
}
