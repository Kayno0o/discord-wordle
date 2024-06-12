import * as fs from 'node:fs'
import chalk from 'chalk'

const filesToMerge = fs.readdirSync('./').filter(name => /\.txt$/.test(name) && /^(?!u_)/.test(name) && name !== 'merge.txt')

// to lower case all origins files
for (const file of filesToMerge) {
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').toLowerCase().trim())
}

function mergeFiles(filePaths: string[], outputFilePath: string) {
  const words = new Set()

  filePaths.forEach((filePath) => {
    const data = fs.readFileSync(filePath, 'utf8').split('\n')
    for (const line of data)
      words.add(line)
  })

  fs.writeFileSync('merge.txt', [...words.values()].sort().join('\n').trim())
  console.log(`Files merged into ${outputFilePath}`)
}

function uniqueFile(filename: string) {
  console.log(chalk.cyan('[load]'), filename)

  const dictionnary = fs.readFileSync(filename, 'utf-8')
  const words = dictionnary.split('\n')

  const uniqueLetterWords = words.filter((word) => {
    const letters = new Set(word)
    return letters.size === word.length
  })

  uniqueLetterWords.sort((a, b) => a.length - b.length || a.localeCompare(b))

  fs.writeFileSync(`u_${filename}`, uniqueLetterWords.join('\n').trim(), 'utf-8')

  for (let i = 3; i <= 10; i++) {
    console.log('mots en', i, 'lettres :', uniqueLetterWords.filter(word => word.length === i).length)
  }
}

mergeFiles(filesToMerge, 'merge.txt')

for (const unique of filesToMerge) {
  uniqueFile(unique)
}
