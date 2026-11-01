import * as React from 'react'
import type { TemplateEntry } from './registry'
import { Cta, Frame, H1, P } from './layout'

interface Props { lang?: 'fr' | 'en'; recipientName?: string; url?: string }
const copy = {
  fr: {
    subject: (n: string) => `${n} a accepté votre demande`,
    title: 'Vous êtes connecté·es',
    body: (n: string) => `${n} a accepté votre demande de connexion.`,
    hint: 'Vous pouvez maintenant lui écrire dans l\'app.',
    cta: 'Écrire un message',
  },
  en: {
    subject: (n: string) => `${n} accepted your request`,
    title: 'You are now connected',
    body: (n: string) => `${n} accepted your connection request.`,
    hint: 'You can now send them a message in the app.',
    cta: 'Send a message',
  },
}

const ConnectionAcceptedEmail = ({ lang = 'fr', recipientName, url = 'https://hey.genai-days-nantes.com/messages' }: Props) => {
  const c = copy[lang] ?? copy.fr
  const name = recipientName || (lang === 'en' ? 'An attendee' : 'Un·e participant·e')
  return (
    <Frame lang={lang} preview={c.body(name)}>
      <H1>{c.title}</H1>
      <P>{c.body(name)}</P>
      <P>{c.hint}</P>
      <Cta href={url}>{c.cta}</Cta>
    </Frame>
  )
}

export const template = {
  component: ConnectionAcceptedEmail,
  subject: (d: Props) => {
    const c = copy[d.lang ?? "fr"] ?? copy.fr
    return c.subject(d.recipientName || (d.lang === 'en' ? 'An attendee' : 'Un·e participant·e'))
  },
  displayName: 'Connexion acceptée',
  previewData: { lang: 'fr', recipientName: 'Camille Martin' },
} satisfies TemplateEntry
