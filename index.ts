import { GatewayIntentBits } from 'discord.js'
import { config as dotenv } from 'dotenv'
import { CustomClient } from './src/types/client'
import { initDB } from './src/database'

dotenv()

const client = new CustomClient({
  intents: [GatewayIntentBits.GuildMessages],
})

initDB()

await client.start()
