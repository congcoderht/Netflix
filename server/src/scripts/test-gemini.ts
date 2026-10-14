import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const apiKey = process.env.GEMINI_API_KEY
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing from server/.env')
}

const main = async () => {
  const client = new GoogleGenAI({ apiKey })
  const response = await client.interactions.create({
    model,
    input: 'Reply with exactly GEMINI_OK and nothing else.',
  })

  const output = response.output_text?.trim()
  if (!output) throw new Error('Gemini returned an empty response')

  console.log(`Gemini connection OK (${model}): ${output}`)
}

main().catch((error) => {
  console.error('Gemini connection failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
