import * as React from 'react'
import { Code, Cta, Divider, Frame, H1, H2, P } from './layout'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Frame lang="fr" preview="Réinitialisation / Reset">
      <H1>Réinitialiser votre accès</H1>
      <P>Cliquez sur le bouton pour choisir un nouveau mot de passe.</P>
      <Cta href={confirmationUrl}>Réinitialiser</Cta>
      <P small>Vous n'avez rien demandé ? Ignorez cet e-mail.</P>
      <Divider />
      <H2>Reset your access</H2>
      <P>Click the button to choose a new password.</P>
      <Cta href={confirmationUrl}>Reset</Cta>
      <P small>Didn't request this? You can ignore this email.</P>
  </Frame>
)

export default RecoveryEmail
