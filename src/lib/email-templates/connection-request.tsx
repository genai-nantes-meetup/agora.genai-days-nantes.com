import * as React from 'react'
import type { TemplateEntry } from './registry'
import { Cta, Frame, H1, P } from './layout'

interface Props { lang?: 'fr' | 'en'; senderName?: string; url?: string }
const copy = {
  fr: {
    subject: (n: string) => `${n} souhaite se connecter avec vous`,
    title: 'Nouvelle demande de connexion',
    body: (n: string) => `${n} vous a envoyé une demande de connexion sur GenAI Days Agora.`,
    hint: 'Acceptez-la pour ouvrir une conversation.',
    cta: 'Voir la demande',
  },
  en: {
    subject: (n: string) => `${n} would like to connect with you`,
    title: 'New connection request',
    body: (n: string) => `${n} sent you a connection request on GenAI Days Agora.`,
    hint: 'Accept it to start a conversation.',
    cta: 'View the request',
  },
}

const ConnectionRequestEmail = ({ lang = 'fr', senderName, url = 'https://hey.genai-days-nantes.com/messages' }: Props) => {
  const c = copy[lang] ?? copy.fr
  const name = senderName || (lang === 'en' ? 'An attendee' : 'Un·e participant·e')
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
  component: ConnectionRequestEmail,
  subject: (d: Props) => {
    const c = copy[d.lang ?? "fr"] ?? copy.fr
    return c.subject(d.senderName || (d.lang === 'en' ? 'An attendee' : 'Un·e participant·e'))
  },
  displayName: 'Demande de connexion',
  previewData: { lang: 'fr', senderName: 'Camille Martin' },
} satisfies TemplateEntry
