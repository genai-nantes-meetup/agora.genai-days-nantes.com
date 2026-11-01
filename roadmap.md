# Roadmap

Current tasks:

- [x] Add Organizer badge for seven specified emails, including future accounts, without administrative privileges; matching existing account updated and verified in directory and participant page

- [x] Replace Twilio with in-house messaging (Postgres + Realtime): accept flow, send/edit/delete/reactions/reply/seen/typing, push by sender name with presence suppression, 30-minute unread digest email, purge/delete/block cleaned of Twilio. Twilio no longer blocks acceptance.
- [ ] User: delete unused Twilio secrets in Project Settings → Secrets.

- [x] Retirer le badge speaker de Maxime Pitussi en base, et corriger l'attribution automatique (LinkedIn vides considérés comme identiques) pour que le badge ne revienne pas
- [x] City: LinkedIn prefill during onboarding and editable autosaved profile field
- [x] Participant page: visible contact request button below the profile header
- [x] Messages: discreet notification activation button
- [x] Onboarding step 2: optional LinkedIn URL field added (empty accepted by schema and DB trigger)
- [x] Onboarding: at least one professional job tag required before finishing (onboarding schema + updated validation message)
- [x] Participant page: program section removed (sessions no longer listed on a member profile)
- [x] Signed-in end-to-end verification of the onboarding additions (real session, step 2 screenshot, submission blocked without a tag)

- [x] Back buttons: link pointer cursor
- [x] Profile edit page: single page, all fields editable without steps; Save button removed (autosave only)
- [x] Autosave: saves on field blur and ~2 s after any change, with a "saved" toast on each save
- [x] Removed "Personnes bloquées", "My data" link and language editor from the profile page; blocking UI removed from participant page (backend tables/policies kept)
- [x] Intentions and job tags render 2 per line in onboarding and profile editing
- [x] Participant directory grid: 2 columns on mobile, 3 on tablet, 4 on desktop
- [x] Directory filters: status filter removed (keyword, tags, intentions, AI level, size, sector remain)

