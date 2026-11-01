import * as React from 'react'
import { Code, Cta, Divider, Frame, H1, H2, P } from './layout'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Frame lang="fr" preview="Votre invitation / Your invitation">
      <H1>Vous êtes invité·e</H1>
      <P>Vous êtes invité·e à rejoindre l'app GenAI Days. Acceptez l'invitation pour créer votre compte.</P>
      <Cta href={confirmationUrl}>Accepter l'invitation</Cta>
      <Divider />
      <H2>You have been invited</H2>
      <P>You have been invited to join the GenAI Days app. Accept the invitation to create your account.</P>
      <Cta href={confirmationUrl}>Accept the invitation</Cta>
  </Frame>
)

export default InviteEmail
