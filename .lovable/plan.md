# Rename to "GenAI Days Agora" (short name "Agora")

## Key finding
The interface no longer shows "Hey" anywhere. The name users see today is **"GenAI Days Nantes"** (or "GenAI Days"). Every "hey" left in the code is a domain, a storage key or a code comment. So the rename mostly replaces "GenAI Days Nantes" / "app GenAI Days" with the new name. Mentions of the **event** stay as they are ("GenAI Days 2026", "Bienvenue aux GenAI Days").

Wording rule: **app** = "GenAI Days Agora" / "Agora"; **event** = "GenAI Days" (with the year where it matters legally).

## 1. Strings to change

**App name in manifest and head**
- `public/manifest.webmanifest`: `name` "Programme et meetings - GenAI Days Nantes" → "GenAI Days Agora"; `short_name` "GenAI Days" → "Agora"; `description` → "L'app compagnon des GenAI Days." (removes 2026/Nantes). `id`, `start_url`, `scope`, icons and colours stay the same.
- `src/routes/__root.tsx`: default title → "GenAI Days Agora"; description without the date; `apple-mobile-web-app-title` "GenAI Days" → "Agora".

**Page titles and og:title (suffix " · GenAI Days Nantes" → " · GenAI Days Agora")**
`index.tsx` (title and og:title "Programme et meetings - GenAI Days Nantes" → "GenAI Days Agora · Programme et meetings"), `sessions.$id`, `speakers.index`, `speakers.$id`, `sponsors.index`, `sponsors.$id`, `plan`, `login`, `auth`, `join`, `donnees`, `_authenticated/profil`, `_authenticated/networking.index` (and its description "bientôt disponible dans…", which also contains an em dash, to be removed), `_authenticated/networking.$id`, `_authenticated/messages`, `_authenticated/messages.$id`. Titles stay in `head()` because they are rendered on the server before the visitor's language is known. They use the same neutral bilingual suffix as today.

**Locales (`fr.json` / `en.json`)**
- `appName`: "GenAI Days Nantes" → "GenAI Days Agora".
- New key `appShortName`: "Agora" (same in both languages).
- `install.body`: "Ajoutez GenAI Days Agora à votre écran d'accueil." / "Add GenAI Days Agora to your home screen."
- `/donnees` (`legal.*`): add the app name where it describes the app: "l'application GenAI Days Agora, éditée par NaoMakers pour GenAI Days 2026". Processor text stays the same.
- New keys for the header lockup (`header.agora` and an accessible label "GenAI Days Agora").

**Emails**
- `src/lib/email-templates/send-email.ts` and `src/routes/lovable/email/auth/webhook.ts` (+ `preview.ts`): `SITE_NAME` "GenAI Days Nantes" → "GenAI Days Agora". This changes the **sender display name**. The address `noreply@hey.genai-days-nantes.com` stays the same.
- `layout.tsx` footer "GenAI Days Nantes 2026 · NaoMakers" → "GenAI Days Agora · NaoMakers".
- "app GenAI Days" → "GenAI Days Agora" in `invitation.tsx` (subject and title), `connection-request.tsx`, `unread-digest.tsx` (subjects), `signup.tsx`, `invite.tsx` and `magic-link.tsx` (FR and EN).

**Push notifications**
- `src/lib/notifications.server.ts`: push title "GenAI Days" → "Agora" (short, fits on the lock screen; the body still shows the sender's name only).

**Header**
- `AppShell` header: wordmark + "Agora" (see section 2). Taken from the locale key.

## 2. Header lockup: two options

```text
Option A: stacked tag                 Option B: inline, separator
 GENAI DAYS                            GENAI DAYS | Agora
 Agora                                  (wordmark)   (orange, italic)
 (orange #fe4d1b, small, bold
  italic EB Garamond, aligned left)
```
- **A, stacked**: "Agora" sits under the wordmark, in EB Garamond 800 italic, in orange `#fe4d1b`, at about 55% of the wordmark's height. It echoes the official "NANTES 2026" sub-line, takes almost no width, and works best on mobile. Recommended.
- **B, inline**: a thin blue `#3d43ce` vertical rule, then "Agora" in EB Garamond 600 italic, in orange, on the same baseline. It reads more like a product name, but takes about 70px of width on narrow phones.

Both options come with the accessible label "GenAI Days Agora" and meet colour contrast rules (orange on cream at title size; the existing navy dark variant reuses orange).

## 3. Deliberately left unchanged (and why)
- `hey.genai-days-nantes.com` in `emails.ts`, the templates' default URLs, `event.ts` (calendar UID), the email `SENDER_DOMAIN`/`FROM_DOMAIN`/`ROOT_DOMAIN` and `notification-click.test.ts`. These are the domain, which must stay the same.
- Storage keys `hey-genai:likes`, `hey-genai:lang`, `hey-genai:data:*`, `hey-genai:ios-hint-seen`, `hey-genai:android-hint-seen`. Renaming them would wipe likes, language, offline data and hint state.
- `event.ts` `PRODID:-//GenAI Days//Hey GenAI Days//FR`. This is an internal calendar identifier that is not shown in calendar apps. Optional cosmetic change; left alone to keep it stable.
- `preview.ts` `SAMPLE_PROJECT_URL` (`hey-genai-days-companion.lovable.app`). Used only in the dev preview.
- `styles.css` comment and the `package.json` name: internal only.
- `footer.eventSite` "GenAI Days Nantes": this is the link to the **event** website, not the app.
- Event mentions: `auth.title`, `form.consent` ("GenAI Days 2026"), `legal.0.body`. These refer to the 2026 edition; the consent text must keep naming it.
- PostHog/GA setup, service worker, push worker, routes, table names: no change.

## 4. Icons
`icon-192/512`, `maskable-512`, `apple-touch-icon` and `favicon` show "GENAI DAYS" on blue, with **no "Hey"** in them. **No regeneration needed.** The label under the icon comes from `short_name` / `apple-mobile-web-app-title`, which become "Agora". Optional, not planned: add "Agora" to the icon later.

## 5. Risks for already-installed apps
- **Android (Chrome, WebAPK)**: Chrome checks the manifest when the app is opened, at most about once a day. If `name`/`short_name` changed, it regenerates the WebAPK in the background. Since Chrome 111+ a name change may show a confirmation to the user. Expect it to spread within 1 to 3 days of normal use. Because `id`/`start_url` stay the same, it is the same app: sessions, push and data are kept.
- **iOS (Safari, home-screen web app)**: the name is fixed **when the app is installed** and never updates. Existing installs keep the label "GenAI Days" until the person reinstalls. Inside the app, page titles and the header update right away. Push keeps working, since nothing tied to the subscription changes.
- **Desktop Chrome/Edge**: they update on the next launch after the check (same rules as Android; a confirmation may appear).
- **Email**: inbox filters keyed on the sender name "GenAI Days Nantes" would stop matching. The address is the same, so delivery reputation is unaffected.
- Shared links already posted keep their old preview until crawlers fetch the page again.

## 6. Verification checklist
- Search the code for "GenAI Days Nantes": the only matches left are `footer.eventSite`.
- Search for "hey": only domains, storage keys, PRODID and comments are left.
- `/manifest.webmanifest` shows the new name and short_name, with `id`/`start_url`/`scope` the same.
- Every route: title and og:title end in "GenAI Days Agora". View the page source of `/`, `/sessions/:id` and `/donnees`.
- Header shows the lockup in FR and EN at 360px and 1280px, in light and dark variants (screenshots).
- Install prompt text in FR and EN.
- `/donnees` names "GenAI Days Agora" in FR and EN, with inclusive writing and no em dash.
- Email previews (invitation, connection request, digest, magic link) show the new name in the subject, body and footer. One real send shows the sender as "GenAI Days Agora".
- Push test: the title shows "Agora".
- After a reload, likes, language and session are still there (storage keys unchanged).
- The existing test suite stays green, plus a small test that the manifest `name`/`short_name` match and `id`/`start_url` stay "/".
- After publishing: on an installed Android device, open the app and check the label update within about 24 hours.

## Memory and docs
Save the naming rule (app = "GenAI Days Agora"/"Agora", no year or city, event stays "GenAI Days") to project memory, and update the header wordmark memory with the chosen lockup.
