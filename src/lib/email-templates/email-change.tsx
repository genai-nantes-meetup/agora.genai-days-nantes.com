import * as React from 'react'
import { Code, Cta, Divider, Frame, H1, H2, P } from './layout'

interface EmailChangeEmailProps { siteName: string; oldEmail: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ oldEmail, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Frame lang="fr" preview="Confirmez votre nouvelle adresse / Confirm your new email">
      <H1>Confirmez votre nouvelle adresse</H1>
      <P>Vous avez demandé à remplacer {oldEmail || email} par {newEmail}.</P>
      <Cta href={confirmationUrl}>Confirmer le changement</Cta>
      <P small>Vous n'avez rien demandé ? Sécurisez votre compte sans attendre.</P>
      <Divider />
      <H2>Confirm your new email</H2>
      <P>You asked to change {oldEmail || email} to {newEmail}.</P>
      <Cta href={confirmationUrl}>Confirm the change</Cta>
      <P small>Didn't request this? Please secure your account right away.</P>
  </Frame>
)

export default EmailChangeEmail
