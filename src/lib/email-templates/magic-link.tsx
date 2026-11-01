import * as React from 'react'
import { Code, Cta, Divider, Frame, H1, H2, P } from './layout'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Frame lang="fr" preview="Votre lien de connexion / Your login link">
      <H1>Votre lien de connexion</H1>
      <P>Cliquez sur le bouton pour vous connecter à l'app GenAI Days. Ce lien expire rapidement.</P>
      <Cta href={confirmationUrl}>Me connecter</Cta>
      <P small>Vous n'avez rien demandé ? Ignorez simplement cet e-mail.</P>
      <Divider />
      <H2>Your login link</H2>
      <P>Click the button to sign in to the GenAI Days app. This link expires shortly.</P>
      <Cta href={confirmationUrl}>Sign in</Cta>
      <P small>Didn't request this? You can ignore this email.</P>
  </Frame>
)

export default MagicLinkEmail
