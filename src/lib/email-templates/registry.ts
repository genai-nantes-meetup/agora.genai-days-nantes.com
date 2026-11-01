import type { ComponentType } from 'react'
import { template as invitation } from "./invitation"
import { template as connectionRequest } from "./connection-request"
import { template as connectionAccepted } from "./connection-accepted"
import { template as unreadDigest } from "./unread-digest"

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'invitation': invitation,
  'connection-request': connectionRequest,
  'connection-accepted': connectionAccepted,
  'unread-digest': unreadDigest,
}
