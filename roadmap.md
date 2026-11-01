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
- [x] Bilingual per-event emails built; five-minute reminder prepared (see Emails section).
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
- [x] General LinkedIn enrichment implemented and verified in Phase 4 using the existing Airscale secret.
- [x] Remove "Hey" from the header; wordmark only shows GenAI Days.

# Phase 4
- [x] Airscale official contract verified: POST /v1/profile and /v1/company with linkedin_profile_url; private server key already present.
- [x] Enrichment: eight-second provider deadline, durable one-account/URL reservation, five-call lifetime limit, editable prefill, no overwrite of manual fields, safe manual fallback. Verified real public-profile prefill and timeout/failure fallback with temporary accounts.
- [x] Staff sizes tested at 9/10/249/250/4999/5000 boundaries. Private avatar copying implemented with image-host/type/size validation; no remote photo URL stored.
- [ ] Verify every Airscale field and successful private avatar rendering/copy with multiple real profiles; exact company-size enrichment may fall back when the eight-second deadline expires.
- [x] AI tags, pitch, natural-language filters and icebreaker functions implemented through server-only Gateway SDK with strict JSON schema plus closed-list validation and content-free database logs.
- [x] Verified live tag generation, editable <=160-character pitch saved/read back, natural-language search chips and chip removal, failure/quota fallback.
- [x] Verified database reservations: five enrichments/account, one URL once, 20 lifetime pitches, 60 searches/hour and 10 icebreakers/hour; client cannot invoke reservation RPCs.
- [ ] Verify real icebreaker suggestions/send/edit in an empty Twilio conversation: blocked on existing Twilio credentials; key unchanged.
- [x] Feedback: server checks actual session start from fresh official JSON, six stable keys, <=500-character comments, one editable entry/account/session. Verified uniqueness, direct-write denial, aggregates, block-hidden comments, suspended-author hiding and signed-in UI display using temporary fixtures.
- [ ] Verify actual post-start feedback submission end-to-end on event day; time boundary unit tests pass, current real sessions are not open.
- [x] Admin: server-protected roles, CSV parsing/preview/import/export preserving tokens, reports handled, suspension/reactivation, manual speaker override, sponsor-domain add/remove and metrics. Verified these actions plus verified-account admin addition using temporary accounts, then removed fixtures and restored purge controls.
- [ ] Assign Maxime as initial admin: blocked because verified ownership is not yet established. Add Samuel through /admin after he has a verified account; his email remains to be supplied. Purge retains exactly two designated admins and stays paused until then.
- [x] n8n endpoint implemented: POST https://hey.genai-days-nantes.com/api/public/invitations; JSON email, first_name, last_name, billetweb_ref; Authorization Bearer shared secret; idempotent email upsert preserves token and returns {url: joinLink}. Missing-secret request safely returns JSON 401 (no server-crash signal).
- [ ] Activate/test signed n8n requests: blocked on N8N_INVITE_SECRET and publishing the endpoint. Secure secret form tool is unavailable; user must enter it in Project Settings -> Secrets. Use the same strong random value in n8n.
- [x] App emails sent via Lovable managed email (sender domain verified).
- [x] Purge: dated 2026-12-17 00:00 Paris guard, paused control, simulation, atomic retained-admin settings, lease and bounded deletion stages; checks pause before destructive stages. Simulation and pre-date rejection verified. No actual purge run in tests.
- [x] Managed purge schedule created: December, twice hourly (00/30 UTC), /api/public/jobs/purge; may start within ~30 seconds of scheduled minute, then processes batches. Handler needs publication. Purge is currently paused.
- [ ] Verify destructive Twilio/avatar/auth purge in production after credentials recovery and two retained-admin designation; never tested destructively. Existing Twilio denial safely leaves purge blocked for later recovery.
- [x] 50 pure-rule/routing tests passed, including all existing phases 1–3 suites and silent overlapping-like replacement. Latest preview build OK. Temporary test users, feedback, reports, invites and uploaded test avatars removed.

## n8n request
POST https://hey.genai-days-nantes.com/api/public/invitations
Headers: Content-Type: application/json; Authorization: Bearer <N8N_INVITE_SECRET configured securely in n8n>
Body: {"email":"participant@example.com","first_name":"Camille","last_name":"Martin","billetweb_ref":"12345"}
Response: {"url":"https://hey.genai-days-nantes.com/join?token=..."}

# Emails
- [x] Invitation email (FR), admin bulk send with count + confirmation, invitation_sent_at, per-row Resend, no send on CSV import. Real send + no double send verified.
- [x] Late n8n invitations auto-sent only when the admin switch is on (off by default). Verified off/on.
- [x] Connection request email (one per request) and accepted email (to requester), profile language. Real sends + dedupe verified.
- [x] Unread reminder (5 min, one per conversation until read, no message content); per-minute November schedule on the messaging job. Template delivery verified; job safely skips while Twilio rejects reads (401/70051).
- [ ] Verify the reminder end-to-end: blocked on an authorized Twilio key, and publishing.
- [x] No app emails from 24 Nov 2026 00:00 Paris (tested); auth emails unaffected.
- [x] Auth emails bilingual FR then EN, same branding. Rendering checked; live delivery of the new version needs publishing.
- [ ] User proofreading of email copy.

# En cours
- [x] Feedback sans connexion : token appareil anonyme, user_id enregistré si connecté, lectures publiques. Vérifié sans compte (compteurs affichés, pas d'erreur); envoi réel testable le jour J (sessions fermées avant le début).
- [x] Programme : heure et lieu du talk sur deux lignes (vérifié sur capture).
- [x] Titres des conférences affichés entre guillemets « » (vérifié sur capture).
- [x] Favoris : table session_likes, copie local -> base à la connexion, lecture/écriture en base. Vérifié connecté : ajout (POST), rechargement depuis la base, retrait (DELETE); compte de test nettoyé.
- [x] Profil : enregistrement automatique (champ quitté ou 10 s d'inactivité, cases à cocher incluses). Vérifié e2e avec un compte de test : champ sauvegardé au blur, case à cocher sauvegardée après 10 s ; compte et invitations de test supprimés.
- [x] Footer : lien vers l'asso NaoMakers (https://naomakers.com/), libellé traduit FR/EN, vérifié sur capture.
- [x] Profil : boutons IA « Proposer des tags » et « Proposer une phrase » supprimés ; la suggestion automatique des tags à partir du poste reste active (63 tests src/lib au vert, suite complète 64).
