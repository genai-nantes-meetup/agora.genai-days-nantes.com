import * as React from 'react'
import type { TemplateEntry } from './registry'
import { Cta, Frame, H1, P } from './layout'

// Never include message content in this email.
interface Props { lang?: 'fr' | 'en'; senderName?: string; url?: string }
const copy = {
  fr: {
    subject: (n: string) => `Message non lu de ${n}`,
    title: 'Un message vous attend',
    body: (n: string) => `${n} vous a écrit sur l'app GenAI Days.`,
    cta: 'Lire le message',
  },
  en: {
    subject: (n: string) => `Unread message from ${n}`,
    title: 'A message is waiting for you',
    body: (n: string) => `${n} sent you a message on the GenAI Days app.`,
    cta: 'Read the message',
  },
}
const fallback = (lang?: string) => (lang === 'en' ? 'An attendee' : 'Un·e participant·e')

const UnreadReminderEmail = ({ lang = 'fr', senderName, url = 'https://hey.genai-days-nantes.com/messages' }: Props) => {
  const c = copy[lang] ?? copy.fr
  const name = senderName || fallback(lang)
  return (
    <Frame lang={lang} preview={c.body(name)}>
      <H1>{c.title}</H1>
      <P>{c.body(name)}</P>
      <Cta href={url}>{c.cta}</Cta>
    </Frame>
  )
}

export const template = {
  component: UnreadReminderEmail,
  subject: (d: Record<string, any>) => (copy[d.lang as 'fr' | 'en'] ?? copy.fr).subject(d.senderName || fallback(d.lang)),
  displayName: 'Rappel de message non lu',
  previewData: { lang: 'fr', senderName: 'Camille Martin' },
} satisfies TemplateEntry
