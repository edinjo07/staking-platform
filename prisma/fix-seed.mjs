import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const p = join(__dirname, 'seed.ts')
let c = readFileSync(p, 'utf8')

// 1. Replace any remaining curly apostrophes with escaped straight apostrophe
c = c.replace(/\u2019/g, "\\'")
c = c.replace(/\u2018/g, "\\'")

// 2. Escape word-contraction apostrophes that are between word characters
//    e.g.  Avalanche's  →  Avalanche\'s
//    Only affect unescaped apostrophes that are surrounded by word chars
c = c.replace(/([a-zA-Z])'([a-zA-Z])/g, "$1\\'$2")

writeFileSync(p, c, 'utf8')
console.log('seed.ts fixed successfully')
