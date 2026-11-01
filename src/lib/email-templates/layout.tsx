import * as React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'

// Shared GenAI Days email frame. Inline styles only; Body stays white for client compatibility.
export const colors = { orange: '#fe4d1b', blue: '#3d43ce', cream: '#f9f4ec', navy: '#09122e', ink: '#393636' }
const serif = "'EB Garamond', Garamond, Georgia, 'Times New Roman', serif"

export function Frame({ lang = 'fr', preview, children }: { lang?: string; preview: string; children: React.ReactNode }) {
  return (
    <Html lang={lang} dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }}>
          <Section style={{ backgroundColor: colors.cream, borderTop: `6px solid ${colors.orange}`, padding: '28px 24px' }}>
            <Text style={{ fontFamily: serif, fontSize: '22px', fontWeight: 800, letterSpacing: '1px', color: colors.navy, margin: '0 0 20px' }}>
              GEN<span style={{ fontStyle: 'italic', color: colors.orange }}>AI</span> DAYS
            </Text>
            {children}
          </Section>
          <Text style={{ fontSize: '12px', color: '#777777', margin: '16px 0 0', textAlign: 'center' }}>
            GenAI Days Nantes 2026 · NaoMakers
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const H1 = ({ children }: { children: React.ReactNode }) => (
  <Heading style={{ fontFamily: serif, fontSize: '28px', fontWeight: 800, lineHeight: '1.15', color: colors.navy, margin: '0 0 16px' }}>{children}</Heading>
)
export const H2 = ({ children }: { children: React.ReactNode }) => (
  <Heading as="h2" style={{ fontFamily: serif, fontSize: '22px', fontWeight: 600, color: colors.blue, margin: '0 0 12px' }}>{children}</Heading>
)
export const P = ({ children, small }: { children: React.ReactNode; small?: boolean }) => (
  <Text style={{ fontSize: small ? '13px' : '15px', lineHeight: '1.55', color: small ? '#6b6666' : colors.ink, margin: '0 0 16px' }}>{children}</Text>
)
export const Cta = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Button href={href} style={{ backgroundColor: colors.orange, color: '#ffffff', fontWeight: 'bold', fontSize: '15px', borderRadius: '6px', padding: '13px 22px', textDecoration: 'none', margin: '4px 0 20px' }}>{children}</Button>
)
export const Code = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontFamily: "'Courier New', monospace", fontSize: '26px', fontWeight: 'bold', letterSpacing: '4px', color: colors.blue, margin: '0 0 20px' }}>{children}</Text>
)
export const Divider = () => <Hr style={{ borderColor: '#e4d9c8', margin: '24px 0' }} />
