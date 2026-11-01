import * as React from 'react'
import type { TemplateEntry } from './registry'
import { Cta, Frame, H1, P } from './layout'

// Never include message content in this email: sender names and unread counts only.
interface Item { senderName?: string; unread?: number }
interface Props { lang?: 'fr' | 'en'; items?: Item[]; url?: string }
const copy = {
  fr: {
    subject: 'Des messages vous attendent sur GenAI Days Agora',
    title: 'Messages non lus',
    intro: 'Vous avez des messages non lus dans ces conversations :',
    line: (n: string, c: number) => `${n} : ${c} message${c > 1 ? 's' : ''} non lu${c > 1 ? 's' : ''}`,
    cta: 'Ouvrir mes messages',
    someone: 'Un·e participant·e',
  },
  en: {
    subject: 'Messages are waiting for you on GenAI Days Agora',
    title: 'Unread messages',
    intro: 'You have unread messages in these conversations:',
    line: (n: string, c: number) => `${n}: ${c} unread message${c > 1 ? 's' : ''}`,
    cta: 'Open my messages',
    someone: 'An attendee',
  },
}

const UnreadDigestEmail = ({ lang = 'fr', items = [], url = 'https://hey.genai-days-nantes.com/messages' }: Props) => {
  const c = copy[lang] ?? copy.fr
  return (
    <Frame lang={lang} preview={c.intro}>
      <H1>{c.title}</H1>
      <P>{c.intro}</P>
      {items.map((i, k) => <P key={k}>{c.line(i.senderName || c.someone, Math.max(1, i.unread ?? 1))}</P>)}
      <Cta href={url}>{c.cta}</Cta>
    </Frame>
  )
}

export const template = {
  component: UnreadDigestEmail,
  subject: (d: Props) => (copy[d.lang ?? 'fr'] ?? copy.fr).subject,
  displayName: 'Récapitulatif des messages non lus',
  previewData: { lang: 'fr', items: [{ senderName: 'Camille Martin', unread: 2 }, { senderName: 'Alex Dupont', unread: 1 }] },
} satisfies TemplateEntry
