import * as React from 'react'
import { Code, Cta, Divider, Frame, H1, H2, P } from './layout'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Frame lang="fr" preview="Votre code / Your code">
      <H1>Votre code de vérification</H1>
      <Code>{token}</Code>
      <P small>Ce code expire rapidement. Vous n'avez rien demandé ? Ignorez cet e-mail.</P>
      <Divider />
      <H2>Your verification code</H2>
      <P small>This code expires shortly. Didn't request it? You can ignore this email.</P>
  </Frame>
)

export default ReauthenticationEmail
