import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { ActionRowBuilder, Attachment, AttachmentBuilder, ButtonBuilder, ButtonStyle, type ModalActionRowComponentBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { range } from 'lodash'
import { formatDate, getRandomElement } from '@kaynooo/js-utils'
import type { Command } from '../types/commands'
import { db } from '../database'
import type { DBWord } from '../types/entity'
import { UserRepository } from '../database/repository/UserRepository'
import { WordRepository } from '../database/repository/WordRepository'
import { UserTryRepository } from '../database/repository/UserTryRepository'
import { exec } from '../utils/exec'

const min = 3
const max = 10
const maxTry = 6

const platform = os.platform()
const executable = platform === 'win32' ? 'main.exe' : './main'

const uniqueWords = fs.readFileSync(path.resolve(process.cwd(), 'assets/dictionnary/u_ods6.txt'), 'utf-8').toLowerCase().split('\n')
const words = fs.readFileSync(path.resolve(process.cwd(), 'assets/dictionnary/ods6.txt'), 'utf-8').toLowerCase().split('\n')

export function getWordle(length: number): DBWord {
  const day = formatDate(new Date(), 'input')

  const word = WordRepository.findOneBy({ where: { day, length } })

  if (word === null) {
    const word = getRandomElement(uniqueWords.filter(word => word.length === length))
    db.run('INSERT INTO word (word, day, length) VALUES (?, ?, ?)', [word, day, length])
    return getWordle(length)
  }

  return word
}

export function wordExists(word: string): boolean {
  return words.includes(word.toLowerCase())
}

export const command: Command = {
  command: (() => {
    const builder = new SlashCommandBuilder()
      .setName('wordle')
      .setDescription('Starts a wordle !')

    builder
      .addIntegerOption(builder =>
        builder
          .setName('length')
          .setDescription('Word length')
          .addChoices(range((max - min) + 1).map((_, v) => ({ name: String(v + min), value: v + min })))
          .setRequired(true),
      )

    return builder
  })(),
  handle: async (_, interaction) => {
    const lengthOption = interaction.options.get('length')

    if (!lengthOption || typeof lengthOption.value !== 'number') {
      await interaction.reply({ content: 'No length provided', ephemeral: true })
      return
    }

    const length = lengthOption.value

    const word = getWordle(length)

    const guess = new ButtonBuilder()
      .setCustomId(`guess|${word.id}|wordle`)
      .setLabel('Deviner')
      .setStyle(ButtonStyle.Success)

    const view = new ButtonBuilder()
      .setCustomId(`view|${word.id}|wordle`)
      .setLabel('Revoir les indices')
      .setStyle(ButtonStyle.Secondary)

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(guess, view)

    await interaction.reply({
      content: `${interaction.user.toString()} a démarré un mot en ${length} lettres !`,
      components: [row],
    })
  },
  handleButton: async (_, interaction) => {
    const [name, id] = interaction.customId.split('|')

    const word = WordRepository.findById(Number(id))

    if (!word) {
      await interaction.reply({ content: 'Ce mot n\'existe pas', ephemeral: true })
      return
    }

    const user = UserRepository.findOneBy({ where: { discord_id: interaction.user.id } })!
    const tries = UserTryRepository.findAllBy({ where: { user_id: user.id, word_id: word.id } })

    if (name === 'guess') {
      if (tries.length >= maxTry) {
        await interaction.reply({ content: 'Vous avez déjà perdu...', ephemeral: true })
        return
      }

      if (tries.find(t => t.guess === word.word)) {
        await interaction.reply({ content: 'Vous avez déjà gagné !', ephemeral: true })
        return
      }

      const modal = new ModalBuilder()
        .setCustomId(`guess|${id}|wordle`)
        .setTitle(`Devinez le mot du jour en ${word?.length} lettres`)

      const guessInput = new TextInputBuilder()
        .setCustomId('guessInput')
        .setLabel('Mot :')
        .setStyle(TextInputStyle.Short)
        .setMinLength(word.length)
        .setMaxLength(word.length)
        .setRequired(true)

      const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(guessInput)
      modal.addComponents(firstActionRow)

      await interaction.showModal(modal)

      return
    }

    if (name === 'view') {
      if (tries.length === 0) {
        await interaction.reply({ content: 'Vous n\'avez jamais essayé de mot!', ephemeral: true })
        return
      }

      const image = exec(`${executable} ${tries.map(t => `${word.word} ${t.guess}`).join(' ')}`, { dir: 'go/wordle', isBase64: true })
      const attachment = new AttachmentBuilder(image, { name: 'mots.png' })
      await interaction.reply({ ephemeral: true, files: [attachment] })
    }
  },
  handleModal: async (_, interaction) => {
    const [name, id] = interaction.customId.split('|')
    if (name === 'guess') {
      const guess = interaction.fields.getField('guessInput').value
      if (!wordExists(guess)) {
        await interaction.reply({ content: 'Ce mot n\'existe pas dans le dictionnaire', ephemeral: true })
        return
      }

      const word = WordRepository.findById(Number(id))
      const user = UserRepository.findOneBy({ where: { discord_id: interaction.user.id } })!

      if (!word) {
        await interaction.reply({ content: 'Ce mot n\'existe pas', ephemeral: true })
        return
      }

      UserTryRepository.create({
        user_id: user.id,
        word_id: Number(id),
        guess,
      })

      const tries = UserTryRepository.findAllBy({ where: { user_id: user.id, word_id: word.id } })

      if (word.word === guess.toLowerCase() || tries.length === maxTry) {
        const noLettersImage = exec(`${executable} --no-letter ${tries.map(t => `${word.word} ${t.guess}`).join(' ')}`, { dir: 'go/wordle', isBase64: true })
        const noLettersAttachment = new AttachmentBuilder(noLettersImage, { name: 'indices.png' })
        await interaction.reply({
          content: word.word === guess.toLowerCase()
            ? `C\'est gagné pour ${interaction.user.toString()} ! (${tries.length}/${maxTry})`
            : `Dommage, ${interaction.user.toString()} a perdu... (${tries.length}/${maxTry})`,
          files: [noLettersAttachment],
        })
        return
      }

      const lettersImage = exec(`${executable} ${tries.map(t => `${word.word} ${t.guess}`).join(' ')}`, { dir: 'go/wordle', isBase64: true })
      const attachment = new AttachmentBuilder(lettersImage, { name: 'mots.png' })
      await interaction.reply({ content: `Mauvaise réponse. (${tries.length}/${maxTry})`, ephemeral: true, files: [attachment] })
    }
  },
}
