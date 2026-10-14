import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { sendChatMessage, type ChatMessagePayload, type ChatMovieSuggestion } from '@/services/chat.service'

interface DisplayMessage extends ChatMessagePayload {
  id: string
  movies?: ChatMovieSuggestion[]
}

const messageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

const InlineText = ({ text }: { text: string }) => <>{text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
  if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>
  if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
  return part
})}</>

const FormattedMessage = ({ content }: { content: string }) => <div className="space-y-1.5 text-sm leading-6">
  {content.split('\n').map((line, index) => {
    if (!line.trim()) return <div key={index} className="h-1.5" />
    const ordered = line.match(/^\s*(\d+)\.\s+(.*)$/)
    if (ordered) return <div key={index} className="flex gap-2"><span className="shrink-0 font-semibold text-red-400">{ordered[1]}.</span><span><InlineText text={ordered[2]} /></span></div>
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) return <div key={index} className="flex gap-2 pl-1"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/80" /><span><InlineText text={bullet[1]} /></span></div>
    return <p key={index}><InlineText text={line} /></p>
  })}
</div>

export default function ChatWidget() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const quickPrompts = user?.role === 'ADMIN'
    ? [t('chat.prompts.adminOverview'), t('chat.prompts.contentIssues')]
    : [t('chat.prompts.recommend'), t('chat.prompts.myPlan')]

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (!messages.length) inputRef.current?.focus()
  }, [messages, open, sending])

  if (!user) return null

  const submit = async (text: string) => {
    const content = text.trim()
    if (!content || sending) return

    const userMessage: DisplayMessage = { id: messageId(), role: 'user', content }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const history = nextMessages.slice(-12).map(({ role, content: messageContent }) => ({ role, content: messageContent }))
      const response = await sendChatMessage(history)
      setMessages((current) => [...current, {
        id: messageId(), role: 'assistant', content: response.message, movies: response.movies,
      }])
    } catch (error) {
      const code = axios.isAxiosError(error) ? error.response?.data?.code : undefined
      const key = code === 'AI_DAILY_LIMIT_REACHED' ? 'chat.dailyLimit'
        : code === 'CHAT_RATE_LIMITED' ? 'chat.rateLimit'
          : code === 'AI_PROVIDER_RATE_LIMITED' ? 'chat.providerRateLimit'
          : code === 'AI_CHAT_DISABLED' || code === 'AI_NOT_CONFIGURED' ? 'chat.disabled'
            : 'chat.error'
      setMessages((current) => [...current, { id: messageId(), role: 'assistant', content: t(key) }])
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit(input)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit(input)
    }
  }

  const clear = () => {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  return <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_10px_35px_rgba(229,9,20,0.4)] transition hover:scale-105 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${open ? 'pointer-events-none scale-90 opacity-0' : ''}`}
      aria-label={t('chat.open')}
    >
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 11.5a8.38 8.38 0 0 1-9 8.5 9.4 9.4 0 0 1-4-.86L3 21l1.7-4.25A8.16 8.16 0 0 1 3 11.5a8.38 8.38 0 0 1 9-8.5 8.38 8.38 0 0 1 9 8.5Z" /></svg>
    </button>

    {open && <section
      role="dialog"
      aria-label={t('chat.title')}
      className="fixed inset-0 z-50 flex flex-col border-gray-700 bg-[#101010] shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(680px,calc(100vh-2.5rem))] sm:w-[420px] sm:rounded-2xl sm:border"
    >
      <header className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">AI</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-white">{t('chat.title')}</h2>
          <p className="truncate text-xs text-gray-400">{user.role === 'ADMIN' ? t('chat.adminSubtitle') : t('chat.userSubtitle')}</p>
        </div>
        {messages.length > 0 && <button type="button" onClick={clear} className="rounded-lg px-2 py-1 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white">{t('chat.clear')}</button>}
        <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white" aria-label={t('common.close')}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>

      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {!messages.length && <div className="flex h-full flex-col justify-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/15 text-2xl">✨</div>
          <h3 className="mt-4 text-center text-lg font-bold text-white">{t('chat.welcome')}</h3>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-6 text-gray-400">{t('chat.description')}</p>
          <div className="mt-6 grid gap-2">
            {quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void submit(prompt)} className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-left text-sm text-gray-200 transition hover:border-red-500/70 hover:bg-gray-800">{prompt}</button>)}
          </div>
        </div>}

        <div className="space-y-5">
          {messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${message.role === 'user' ? 'rounded-2xl rounded-br-md bg-red-600 px-4 py-2.5 text-white shadow-lg shadow-red-950/20' : 'ml-1 rounded-2xl rounded-tl-md border border-gray-800 bg-[#181818] px-4 py-3 text-gray-200 shadow-lg shadow-black/20'}`}>
              {message.role === 'assistant' && <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-red-400">Netflix AI</span>}
              {message.role === 'assistant' ? <FormattedMessage content={message.content} /> : <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>}
              {!!message.movies?.length && <div className="mt-3 grid gap-2">
                {message.movies.map((movie) => <Link key={movie.id} to={`/movies/${movie.id}`} onClick={() => setOpen(false)} className="flex overflow-hidden rounded-xl border border-gray-700 bg-gray-900 transition hover:border-red-500/70 hover:bg-gray-800">
                  <div className="h-20 w-14 shrink-0 bg-gray-800">{movie.thumbnail && <img src={movie.thumbnail} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="min-w-0 self-center px-3"><p className="line-clamp-2 text-sm font-semibold text-white">{movie.title}</p>{movie.duration && <p className="mt-1 text-xs text-gray-400">{t('chat.minutes', { count: movie.duration })}</p>}</div>
                </Link>)}
              </div>}
            </div>
          </div>)}
          {sending && <div className="ml-1 flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-md border border-gray-800 bg-[#181818] px-4 py-3 text-red-400" aria-label={t('chat.thinking')}><span className="h-2 w-2 animate-bounce rounded-full bg-current" /><span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:120ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:240ms]" /></div>}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-gray-700 bg-gray-900 p-2 focus-within:border-red-500/70">
          <textarea ref={inputRef} value={input} maxLength={4000} rows={1} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder={t('chat.placeholder')} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-gray-500" />
          <button type="submit" disabled={!input.trim() || sending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40" aria-label={t('chat.send')}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 14-9-4 18-3-7-7-2Zm7 2 3-3" /></svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-gray-600">{t('chat.disclaimer')}</p>
      </form>
    </section>}
  </>
}
