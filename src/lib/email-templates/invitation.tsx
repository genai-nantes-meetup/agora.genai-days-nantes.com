import * as React from 'react'
import type { TemplateEntry } from './registry'
import { Cta, Frame, H1, P } from './layout'

interface Props { lang?: 'fr' | 'en'; firstName?: string; url?: string }
const copy = {
  fr: {
    subject: 'Votre accès à GenAI Days Agora',
    preview: 'Votre lien personnel pour le mardi 17 novembre 2026',
    hello: (n?: string) => (n ? `Bonjour ${n},` : 'Bonjour,'),
    title: 'Votre app GenAI Days Agora est prête',
    when: 'Rendez-vous le mardi 17 novembre à 8h30, à l\'Hôtel de Région, 1 rue de la Loire à Nantes.',
    what: 'Créez votre profil dès maintenant : vous repérez dans l\'annuaire les personnes à rencontrer et vous leur envoyez une demande de connexion avant même d\'arriver. Le programme et le plan des salles sont aussi dans l\'app.',
    cta: 'Créer mon profil',
    note: 'Ce lien est personnel, merci de ne pas le transférer.',
  },
  en: {
    subject: 'Your access to GenAI Days Agora',
    preview: 'Your personal link for Tuesday 17 November 2026',
    hello: (n?: string) => (n ? `Hello ${n},` : 'Hello,'),
    title: 'Your GenAI Days Agora app is ready',
    when: 'See you on Tuesday 17 November at 8:30am, at the Hôtel de Région, 1 rue de la Loire, Nantes.',
    what: 'Create your profile now: find the people you want to meet in the directory and send them a connection request before you even arrive. The programme and the venue map are in the app too.',
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
  subject: (d: Props) => (copy[d.lang ?? "fr"] ?? copy.fr).subject,
  displayName: 'Invitation',
  previewData: { lang: 'fr', firstName: 'Camille', url: 'https://hey.genai-days-nantes.com/join?token=exemple' },
} satisfies TemplateEntry
