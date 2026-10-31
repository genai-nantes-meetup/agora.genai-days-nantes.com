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

- [x] Replace overlapping session likes silently with the newly liked session, without notifications; rule tests and program UI verified.
- [ ] Confirm Twilio credentials and verified app-email sender domain.
- [ ] Add private connection/conversation/message-event/push-subscription storage and block cleanup.
- [ ] Implement request/accept/decline actions and profile/message inbox states.
- [ ] Add Twilio provisioning, short-lived identity tokens, realtime messaging and unread badges.
- [ ] Enforce messaging closure on 24 November 2026 at midnight Paris time.
- [ ] Add signed Twilio event handling, browser push and one-time permission invitation.
- [ ] Add bilingual per-event emails and five-minute unread reminder checks with deduplication.
- [ ] Run rule tests and two-account end-to-end checks; report blockers and webhook URL.

Phase 3 excludes Airscale, AI, feedback and administration.