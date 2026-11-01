import * as React from 'react'
import type { TemplateEntry } from './registry'
import { Cta, Frame, H1, P } from './layout'

interface Props { lang?: 'fr' | 'en'; firstName?: string; url?: string }
const copy = {
  fr: {
    subject: 'Votre accès à l\'app GenAI Days',
    preview: 'Votre lien personnel pour le mardi 17 novembre 2026',
    hello: (n?: string) => (n ? `Bonjour ${n},` : 'Bonjour,'),
    title: 'Votre app GenAI Days est prête',
    when: 'Rendez-vous le mardi 17 novembre 2026 à l\'Hôtel de Région, à Nantes.',
    what: 'Avec l\'app, consultez le programme, parcourez l\'annuaire des participant·es, envoyez des demandes de connexion et échangez par messagerie.',
    cta: 'Créer mon profil',
    note: 'Ce lien est personnel, merci de ne pas le transférer.',
  },
  en: {
    subject: 'Your access to the GenAI Days app',
    preview: 'Your personal link for Tuesday 17 November 2026',
    hello: (n?: string) => (n ? `Hello ${n},` : 'Hello,'),
    title: 'Your GenAI Days app is ready',
    when: 'See you on Tuesday 17 November 2026 at the Hôtel de Région, Nantes.',
    what: 'With the app, browse the programme and the attendee directory, send connection requests and chat with other attendees.',
    cta: 'Create my profile',
    note: 'This link is personal, please do not forward it.',
  },
}

const InvitationEmail = ({ lang = 'fr', firstName, url = 'https://hey.genai-days-nantes.com' }: Props) => {
  const c = copy[lang] ?? copy.fr
  return (
    <Frame lang={lang} preview={c.preview}>
      <H1>{c.title}</H1>
      <P>{c.hello(firstName)}</P>
      <P>{c.when}</P>
      <P>{c.what}</P>
      <Cta href={url}>{c.cta}</Cta>
      <P small>{c.note}</P>
    </Frame>
  )
}

export const template = {
  component: InvitationEmail,
  subject: (d: Record<string, any>) => (copy[d.lang as 'fr' | 'en'] ?? copy.fr).subject,
  displayName: 'Invitation',
  previewData: { lang: 'fr', firstName: 'Camille', url: 'https://hey.genai-days-nantes.com/join?token=exemple' },
} satisfies TemplateEntry
