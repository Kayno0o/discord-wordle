import fs from 'node:fs'
import path from 'node:path'

const dictionnary = fs.readFileSync(path.resolve(process.cwd(), 'assets/dictionnary/pli07.txt'), 'utf-8')
const words = dictionnary.split('\n')

const uniqueLetterWords = words.filter((word) => {
  const letters = new Set(word)
  return letters.size === word.length
})

uniqueLetterWords.sort((a, b) => a.length - b.length || a.localeCompare(b))

const outputPath = path.resolve(process.cwd(), 'assets/dictionnary/u_pli07.txt')
fs.writeFileSync(outputPath, uniqueLetterWords.join('\n'), 'utf-8')
