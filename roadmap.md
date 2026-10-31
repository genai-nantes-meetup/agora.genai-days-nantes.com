# Phase 2

- [x] Activate Lovable Cloud.
- [x] Re-read live sessions API and verify added closing keynote, breaks and lunch appear correctly.
- [x] Retry updated sessions API and preserve speakers API ordering without alphabetical sorting.
- [x] Keep speaker photos square with identical height, variable text sections and role tags below names; verify mobile and desktop.
- [x] Use a distinct desktop navigation while retaining mobile bottom tabs.
- [x] Profile storage explicitly specified in the phase 2 request.
- [ ] Assign initial admin privileges only after Maxime proves ownership of his email; blocked on email ownership verification.
- [x] Create invitation/profile/status/domain/block/report schema, private avatar bucket and RLS.
- [x] Implement secure invitation redemption, existing-account magic links, status recalculation and account deletion as TanStack server functions.
- [x] Build translated three-step onboarding with square photo cropping and public data/terms page.
- [x] Build protected directory, filters, detail pages, blocks and reports; keep public event screens accessible.
- [x] Build profile reading/editing, language persistence, blocked-person management and sign-out.
- [x] Add speaker-to-networking links, disabled connection CTA and signed-out access screens.
- [x] Create requested Maxime test invitation and provide its join link.
- [x] Test pure rules, two-account cross-read/status protection/mutual blocking, onboarding/profile edit/delete on mobile; check public desktop/mobile layouts.
- [ ] Verify delivered magic-link emails, avatar upload/cropping and authenticated desktop flows; not fully verified this turn.

Phase 2 scope excluded connection requests, messaging, Airscale, AI, invitation email sending and session feedback.

# Phase 3

- [x] Show live Platinum sponsor logos on both welcome/sign-in screens; all four logos rendered, mobile overflow check passed.
- [x] Replace overlapping session likes silently with the newly liked session, without notifications; rule tests and program UI verified.
- [x] Move Platinum sponsor logos into a site-wide footer on every page, with each logo linking to the sponsor's website and a link to https://genai-days-nantes.com/; label becomes "Avec le soutien de...".
- [ ] Verify Twilio credentials: saved, but Twilio rejects Roles and Webhooks reads with 401/code 70051; needs an authorized Standard/Main key.
- [x] Add private connection/conversation/message-event/push-subscription storage, private data-free realtime doorbells and durable block/deletion cleanup.
- [x] Implement request/accept/decline actions and profile/message inbox states; requests, declines and blocking verified with three temporary accounts.
- [x] Implement Twilio provisioning, short-lived identity tokens, realtime client and unread badges; real exchanges blocked by Twilio permissions and unpublished callback configuration.
- [x] Enforce messaging closure on 24 November 2026 at midnight Paris time through authenticated send functions and read-only Twilio client roles; exact date unit-tested.
- [x] Add signed Twilio callbacks, Web Push delivery code and one-time permission invitation.
- [ ] Activate browser push: requires a securely supplied VAPID public/private key pair and real-device verification.
- [ ] Add bilingual per-event emails and five-minute reminder sends: blocked on configuring an owned email domain; no email scaffold or schedule created yet.
- [ ] Activate cleanup/reconciliation schedule and configure read-only Twilio roles/callbacks: blocked on authorized Twilio key and publication.
- [x] Run 29 rule/routing tests, three-account request/decline/block/privacy flows, unsigned-callback rejection and desktop/mobile screenshots.
- [ ] Verify real acceptance/messages/token renewal/unread/read receipts/push/email delivery: blocked on Twilio permissions, VAPID and sender domain.

Phase 3 excludes Airscale, AI, feedback and administration.
- [x] Remove LinkedIn sign-in; retain email magic links.
- [x] Unify email login/signup and skip onboarding for completed profiles; hosted signup enabled and email confirmation on.
- [x] Show the same email form directly on signed-out Profile and login pages, without an extra welcome step.
- [x] Add fixed LinkedIn URL prefix with suffix-only input and automatic stripping of pasted full URLs.
- [x] Add LinkedIn-first onboarding, followed by first name, last name, job title, company and intentions, retaining explicit consent; authenticated save/read-back verified.
- [x] Prefill available public speaker information with a non-blocking manual fallback; arbitrary LinkedIn enrichment still requires Airscale credentials.
- [ ] Enable general LinkedIn enrichment: blocked on a connected enrichment provider or its credentials.
- [x] Remove "Hey" from the header; wordmark only shows GenAI Days.
