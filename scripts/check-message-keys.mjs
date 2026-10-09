import { readFileSync } from 'node:fs'

const locales = ['az', 'en', 'ru']
const messages = Object.fromEntries(locales.map((locale) => [locale, JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8'))]))

function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(child)) return child.flatMap((item, index) => flatten({ [index]: item }, path))
    return child && typeof child === 'object' && !Array.isArray(child)
      ? flatten(child, path)
      : [[path, child]]
  })
}

const flattened = Object.fromEntries(locales.map((locale) => [locale, new Map(flatten(messages[locale]))]))
const referenceKeys = new Set(flattened.az.keys())
let failed = false
for (const locale of locales.slice(1)) {
  const keys = new Set(flattened[locale].keys())
  const missing = [...referenceKeys].filter((key) => !keys.has(key))
  const extra = [...keys].filter((key) => !referenceKeys.has(key))
  const placeholders = []
  for (const key of referenceKeys) {
    if (!keys.has(key)) continue
    const reference = [...flattened.az.get(key).matchAll(/\{([\w.]+)(?:[,}])/g)].map((match) => match[1]).sort().join(',')
    const translated = [...flattened[locale].get(key).matchAll(/\{([\w.]+)(?:[,}])/g)].map((match) => match[1]).sort().join(',')
    if (reference !== translated) placeholders.push(key)
  }
  if (missing.length || extra.length || placeholders.length) {
    failed = true
    console.error(`${locale}: missing=[${missing.join(', ')}] extra=[${extra.join(', ')}] placeholderMismatch=[${placeholders.join(', ')}]`)
  }
}
if (failed) process.exit(1)
console.log(`Locale message keys and placeholders match (${referenceKeys.size} keys).`)
