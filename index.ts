import { GatewayIntentBits } from 'discord.js'
import { config as dotenv } from 'dotenv'
import { CustomClient } from '~/types/client'
import { initDB } from '~/database'

dotenv()

const client = new CustomClient({
  intents: [GatewayIntentBits.GuildMessages],
})

await initDB()

await client.start()
