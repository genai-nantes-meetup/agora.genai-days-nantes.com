# Phase 2: access, profiles and directory

Lovable Cloud is enabled. The program, the speakers, the sponsors and the floor plan stay public and usable offline.

## Two confirmations before authentication

- Do you confirm the storage of the profile data described in your request: identity, photo, activity, intentions and preferences?
- Do you confirm immediate sign-in at the end of registration, without prior confirmation of the editable email address? This would let an invited person enter an address they do not own. Maxime's admin privileges will therefore require verification of his address, even if the other accounts are opened immediately.

## What will be built

1. **Invitation-only access**: secure token verification, editable pre-filled email, invitation consumed only once, later sign-in by magic link reserved for existing accounts.
2. **Three-step registration**: identity and cropped photo, activity and job tags, intentions and consent. All fields accept initial values for the future phase 4.
3. **Directory**: cards by sponsor tier, Speaker badge, search, filters in a bottom sheet, counter and detail pages. Connection disabled with "Coming soon".
4. **Attendee safety**: mutual blocking, reporting with a reason, suspended accounts excluded, statuses that users cannot edit.
5. **My profile**: view, edit, saved language, blocked people, sign-out and full deletion of the account and its photo.
6. **Public page `/donnees`**: the supplied French text kept as is, brackets included, plus an English translation.
7. **Speaker links**: link to the networking profile when a matching account exists and the viewer is signed in and allowed to see it.

## Technical details

- Requested tables with explicit grants and RLS, plus a protected roles table for admin authority. `profile_status.is_admin` will reflect this role without becoming an editable source of privileges.
- Server actions will be secured TanStack functions, rather than new Edge Functions, in line with the current app architecture.
- Invitations not directly accessible to clients, random tokens and atomic consumption. No sponsor or admin status will be derived from unverified identity data to grant privileges.
- Photos in a private bucket, with read access for signed-in accounts and write access limited to the owner's file.
- Speaker status computed from the official JSON; sponsor domain from the requested table. A JSON failure will not remove an existing status. `manual_override` protects forced values.
- FR/EN translations and stable values for closed lists; existing design kept.
- No persistent cache of private profiles or authentication responses in the service worker.

## Verification and delivery

- Tests on LinkedIn normalization, sponsor domains, directory order and field constraints.
- Verification with two accounts: cross reads, blocking in both directions, exclusion of suspended accounts and inability to edit statuses.
- Verification of the registration, editing, filter, blocking and deletion flows on phone and desktop.
- Test invitation for Maxime, with the `/join` link handed over at the end; no invitation sent by email.
- Final summary separating successful checks from unverified items, notably real receipt of magic links.

## Out of scope

Connection requests, messaging, Airscale, AI, invitation emails and session feedback. Closure and deletion dates appear on the data page, but no automation from a later phase is added here. No publication without an explicit request.
