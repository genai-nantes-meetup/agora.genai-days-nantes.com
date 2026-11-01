import * as React from 'react'
import { Code, Cta, Divider, Frame, H1, H2, P } from './layout'

interface SignupEmailProps { siteName: string; siteUrl: string; recipient: string; confirmationUrl: string }

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <Frame lang="fr" preview="Confirmez votre adresse / Confirm your email">
      <H1>Confirmez votre adresse</H1>
      <P>Merci pour votre inscription à GenAI Days Agora. Confirmez l'adresse {recipient} avec le bouton ci-dessous.</P>
      <Cta href={confirmationUrl}>Confirmer mon adresse</Cta>
      <P small>Vous n'êtes pas à l'origine de cette inscription ? Ignorez cet e-mail.</P>
      <Divider />
      <H2>Confirm your email</H2>
      <P>Thank you for signing up to GenAI Days Agora. Please confirm {recipient} with the button below.</P>
      <Cta href={confirmationUrl}>Confirm my email</Cta>
      <P small>Didn't sign up? You can ignore this email.</P>
  </Frame>
)

export default SignupEmail
