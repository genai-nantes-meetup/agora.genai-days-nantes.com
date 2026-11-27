# Phase 3: connections, messaging and notifications

## Expected outcome
- Replace the provisional profile button with the states: request, sent, accept/decline, and send a message.
- Show received requests at the top of Messages, then conversations with photo, last message, time and unread count.
- Open a two-person conversation on acceptance; real-time exchanges, read receipts, Twilio session renewal and badges.
- Browser notifications and emails expected by the recipient, in French or English. No Airscale, AI, feedback or admin tooling.

## Rules kept
- One request per pair, with no message, no limit and no reminder. A decline stays "Request sent" for its author.
- Blocking hides profiles, cancels pending requests and closes the conversation. Local closure blocks access immediately; Twilio closure must be confirmed and retried on failure.
- One email per new request. For messages, a first reminder after five minutes without being read, at most one per conversation until the recipient reads again. The read horizon check happens at Twilio.
- From **November 24, 2026 at 00:00, Paris time**, no message write is allowed, including from an old Twilio token.

## Prerequisites to provide
**Twilio:** no credential is currently stored. The connector can handle REST calls, but does not necessarily replace the token signing keys or the webhook verification secret. Plan for `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_CONVERSATIONS_SERVICE_SID` and **`TWILIO_AUTH_TOKEN`** for Twilio signatures. These values are entered only in Project Settings → Secrets, never in the chat.

**Emails:** configure a sending domain that you own with the Lovable setup tool. Use native sending, with the displayed sender "GenAI Days". No email queue system and no generic sender exposed to the browser.

**Push:** create a Web Push compatible VAPID key pair and keep the private key as a secret. The public key is passed only for notification registration; no private key is exposed. Generation must follow a secure storage method compatible with the available tools, which currently generate only alphanumeric secrets, not VAPID pairs.

Requests, screens and tests that do not depend on these services will be built without waiting; real exchanges, push and emails will be flagged as unverified while their prerequisites are missing.

## Technical implementation
- Respect the TanStack Start architecture: authenticated server functions for internal actions; secured public routes for Twilio callbacks. No new Edge Functions.
- Add `connection_requests`, `conversations`, `message_events` and `push_subscriptions`, with GRANT and RLS limited to the people involved. SQL uniqueness on the unordered pair, atomic transitions, access denied to suspended or blocked accounts. Events and delivery states are written server-side only.
- Separate testable pure rules, Twilio access through fetch, and authenticated functions. Generate short ChatGrant tokens with a server-compatible library or Web Crypto, identity = user_id; load the `@twilio/conversations` SDK after hydration.
- Validate callbacks against the canonical public URL and the raw body. Use a pre-event callback in addition to the post-event one to forbid messages after closure or blocking: the interface alone is not enough with a Twilio SDK.
- Configure restrictive Twilio roles: the client can neither create a conversation nor add participants. Reserve creation atomically, fetch a conversation by its deterministic opaque name, and handle acceptance/blocking races. Database-side cleanup also covers direct blocks; sign-out, suspension and deletion stop the client and remove external access.
- Add a dedicated conversation route, shared unread management, the Badging API when it exists, and a notification worker separate from the current cache worker. Keep the cache exclusions for accounts and private responses.
- Request push permission once when Messages opens; offer enable/not now. On an iPhone where the app is not installed, show the installation requirement without requesting an impossible permission.
- Scaffold the two email templates after domain configuration. Each event sends a fixed template to its verified recipient, with an idempotency key derived from the event.
- Use the managed scheduled callback and its existing authentication for reminders. A check every minute means **1,440 runs per day**, with a delay of five to six minutes after receipt and a possible recurring cost even without activity. No scheduling secret written in SQL or code.
- Provide the Twilio callback URLs once the routes are created; they become active in production only after authorized publication.

## Verification
- Concrete tests: uniqueness per pair in both directions, silent decline, blocking, one reminder per conversation until read, exact closure boundary in Paris time.
- Verify RLS with two accounts: third party has no access, request, receipt, decline, acceptance, blocking.
- With Twilio configured: real exchange between two sessions, token renewal, unread counts and read state, server rejection after closure/blocking.
- Verify on desktop and mobile; check notifications on compatible devices and emails in the sending logs.
- Final summary separating verified from unverified, prerequisites still missing and Twilio URLs to configure.
