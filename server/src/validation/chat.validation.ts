import { z } from 'zod'

export const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(4_000),
  })).min(1).max(12).refine(
    (messages) => messages.at(-1)?.role === 'user',
    'The final message must be from the user',
  ),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>
