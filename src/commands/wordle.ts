import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, type ModalActionRowComponentBuilder, ModalBuilder, type SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { range } from 'lodash'
import { formatDate, getRandomElement } from '@kaynooo/js-utils'
import { type DBWord, UserRepository, UserTryRepository, type WordDifficulty, WordRepository } from '~/database/entity'
import { exec } from '~/utils/exec'
import { button } from '~/utils/discord'
import { Command } from '~/types/commands'

const min = 3
const max = 10
const maxTry = 6

const platform = os.platform()
const executable = platform === 'win32' ? 'main.exe' : './main'

const dictionnariesDir = path.resolve(process.cwd(), 'assets/dictionnary')

const words = fs.readFileSync(path.resolve(dictionnariesDir, 'merge.txt'), 'utf-8').split('\n')

const dictionnaries: Record<WordDifficulty, string> = {
  easy: 'u_liste_francais.txt',
  normal: 'u_pli07.txt',
  hard: 'u_ods6.txt',
}

const difficultyTranslations: Record<WordDifficulty, string> = {
  easy: 'Facile',
  normal: 'Normal',
  hard: 'Difficile',
}

export function getWordle(length: number, difficulty: WordDifficulty = 'normal'): DBWord {
  const uniqueWords = fs.readFileSync(path.resolve(dictionnariesDir, dictionnaries[difficulty]), 'utf-8').split('\n')

  const day = formatDate(new Date(), 'input', { utc: true })

  const word = WordRepository.findOneBy({ where: { day, length, difficulty } })

  if (word === null) {
    const word = getRandomElement(uniqueWords.filter(word => word.trim().length === length))
    return WordRepository.create({ word, day, length, difficulty })
  }

  return word
}

function createWordleModal(word: DBWord) {
  const modal = new ModalBuilder()
    .setCustomId(`guess|${word.id}|wordle`)
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

  return modal
}

export default new Command({
  command: {
    name: 'wordle',
    description: 'Démarre un Wordle !',
  },
  setup: (builder: SlashCommandBuilder) => builder
    .addIntegerOption(builder => builder
      .setName('length')
      .setDescription('Nombre de lettres')
      .addChoices(range((max - min) + 1).map((_, v) => ({ name: `${v + min} lettres`, value: v + min })))
      .setRequired(true),
    )
    .addStringOption(builder => builder
      .setName('difficulty')
      .setDescription('Difficulté')
      .addChoices(Object.keys(dictionnaries).map((d: string) => ({ name: difficultyTranslations[d as WordDifficulty], value: d }))),
    ),
  handle: async (_, interaction) => {
    const lengthOption = interaction.options.get('length')
    if (!lengthOption || typeof lengthOption.value !== 'number') {
      await interaction.reply({ content: 'Aucune longueur spécifiée', ephemeral: true })
      return
    }

    const difficulty: WordDifficulty = (interaction.options.get('difficulty')?.value as WordDifficulty | undefined) ?? 'normal'

    const length = lengthOption.value
    const word = getWordle(length, difficulty)

    const guessButton = button({
      id: ['guess', word.id, 'wordle'],
      label: 'Deviner',
      style: ButtonStyle.Success,
    })

    const viewButton = button({
      id: ['view', word.id, 'wordle'],
      label: 'Revoir les indices',
      style: ButtonStyle.Secondary,
    })

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents([guessButton, viewButton])

    await interaction.reply({
      content: `${interaction.user.toString()} a démarré un mot ${difficultyTranslations[word.difficulty].toLocaleLowerCase()} de ${length} lettres !`,
      components: [actionRow],
    })
  },
  handleButton: async (_, interaction) => {
    const [name, id] = interaction.customId.split('|')

    const word = WordRepository.findById(Number(id))

    if (!word) {
      await interaction.reply({ content: 'Une erreur est survenue : ce mot n\'existe pas', ephemeral: true })
      return
    }

    const user = UserRepository.findOneBy({ where: { discord_id: interaction.user.id } })!
    const tries = UserTryRepository.findAllBy({ where: { user_id: user.id, word_id: word.id } })

    if (name === 'guess') {
      if (tries.find(t => t.guess === word.word)) {
        await interaction.reply({ content: 'Tu as déjà gagné !', ephemeral: true })
        return
      }

      if (tries.length >= maxTry) {
        await interaction.reply({ content: 'Tu as déjà perdu...', ephemeral: true })
        return
      }

      const modal = createWordleModal(word)

      await interaction.showModal(modal)

      return
    }

    if (name === 'view') {
      if (tries.length === 0) {
        await interaction.reply({ content: 'Tu n\'as jamais essayé de mot !', ephemeral: true })
        return
      }

      const image = exec(`${executable} ${word.word} ${tries.map(t => t.guess).join(' ')}`, { dir: 'go/wordle', isBase64: true })
      const attachment = new AttachmentBuilder(image, { name: 'mots.png' })
      await interaction.reply({ ephemeral: true, files: [attachment] })
      return
    }

    if (name === 'result') {
      if (!tries.find(t => t.guess === word.word) && tries.length !== maxTry) {
        await interaction.reply({ content: 'Tu ne peux pas voir le mot, petit filou !', ephemeral: true })
        return
      }

      await interaction.reply({ content: `Mot : ${word.word}`, ephemeral: true })
    }
  },
  handleModal: async (_, interaction) => {
    const [name, id] = interaction.customId.split('|')
    if (name === 'guess') {
      const guess = interaction.fields.getField('guessInput').value.toLowerCase()
      if (!words.includes(guess.toLowerCase())) {
        await interaction.reply({ content: 'Ce mot n\'existe pas dans le dictionnaire...', ephemeral: true })
        return
      }

      const word = WordRepository.findById(Number(id))
      const user = UserRepository.findOneBy({ where: { discord_id: interaction.user.id } })!

      if (!word) {
        await interaction.reply({ content: 'Ce wordle n\'existe pas...', ephemeral: true })
        return
      }

      UserTryRepository.create({
        user_id: user.id,
        word_id: Number(id),
        guess,
      })

      const tries = UserTryRepository.findAllBy({ where: { user_id: user.id, word_id: word.id } })

      if (word.word === guess || tries.length === maxTry) {
        const guessButton = new ButtonBuilder()
          .setCustomId(`guess|${word.id}|wordle`)
          .setLabel('Deviner')
          .setStyle(ButtonStyle.Success)

        const viewButton = new ButtonBuilder()
          .setCustomId(`view|${word.id}|wordle`)
          .setLabel('Revoir les indices')
          .setStyle(ButtonStyle.Secondary)

        const resultButton = new ButtonBuilder()
          .setCustomId(`result|${word.id}|wordle`)
          .setLabel('Voir le mot')
          .setStyle(ButtonStyle.Primary)

        const actionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(guessButton, viewButton, resultButton)

        const noLettersImage = exec(`${executable} --no-letter ${word.word} ${tries.map(t => t.guess).join(' ')}`, { dir: 'go/wordle', isBase64: true })
        const noLettersAttachment = new AttachmentBuilder(noLettersImage, { name: 'indices.png' })
        await interaction.reply({
          content: word.word === guess
            ? `C\'est gagné pour ${interaction.user.toString()} ! (${tries.length}/${maxTry})`
            : `Dommage, ${interaction.user.toString()} a perdu... (${tries.length}/${maxTry})`,
          files: [noLettersAttachment],
          components: [actionRow],
        })
        return
      }

      const guessButton = new ButtonBuilder()
        .setCustomId(`guess|${word.id}|wordle`)
        .setLabel('Continuer')
        .setStyle(ButtonStyle.Success)

      const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(guessButton)

      const lettersImage = exec(`${executable} ${word.word} ${tries.map(t => t.guess).join(' ')}`, { dir: 'go/wordle', isBase64: true })
      const attachment = new AttachmentBuilder(lettersImage, { name: 'mots.png' })
      await interaction.reply({ content: `Mauvaise réponse. (${tries.length}/${maxTry})`, ephemeral: true, files: [attachment], components: [actionRow] })
    }
  },
})
