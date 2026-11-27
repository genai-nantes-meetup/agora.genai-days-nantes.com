# Agora

Agora is the companion web app for the GenAI Days event (Tuesday, November 17, 2026, 8:30 am to 10 pm, Hôtel de Région Pays de la Loire, Nantes). It will be served at hey.genai-days-nantes.com. 150 to 200 attendees will use it, mostly on mobile, on the day of the event. Top priority: stability.

The project is built in several phases. THIS PHASE 1 covers only the foundation, the program, the speakers and the floor plan. No backend and no authentication for now: networking, messaging and the profile will come in later phases.

## 1. Foundation

- Mobile-first, installable PWA: manifest, icons, service worker (vite-plugin-pwa or equivalent). On Android, offer native installation through the beforeinstallprompt event. On iPhone, show a one-time help banner: "Share, then Add to Home Screen".
- Offline: the program, the speakers and the floor plan must remain readable without a network (stale-while-revalidate strategy for the JSON files and images).
- Bilingual French and English. All interface labels go through translation files (fr, en). The initial language is inferred from the browser, a FR/EN switch sits in the header, and the choice is remembered in localStorage.
- Bottom navigation with 5 tabs: Networking, Messages, Program, Floor plan, Profile. For now, Networking, Messages and Profile show a "Coming soon" screen. The app opens on Program.

## 2. Visual identity (taken from the genai-days-nantes.com site)

Colors: orange #fe4d1b (accent), midnight blue #09122e (text and dark backgrounds), cream #f9f4ec (main background), dark cream #f2eadf (surfaces), blue #3d43ce (secondary), white #ffffff.
Fonts: EB Garamond for titles, Special Elite for small labels (times, rooms, tags), a readable sans-serif for body text.
Editorial, sober and warm tone. Accessible contrast (WCAG AA).

## 3. Program

Source, read at runtime according to the active language (open CORS):
- https://genai-days-nantes.com/api/fr/sessions.json
- https://genai-days-nantes.com/api/en/sessions.json

Each session has: id, title, subtitle, description, format (talk, keynote, table-ronde, concours, podcast), track (decideurs, tech, commun), startTime (HH:MM), durationMinutes, room, themes[], speakers[{id, name, pageUrl}], image, pageUrl. The date and time zone are in event.date and event.timezone.

Rules:
- The room field is null except for the keynote. Apply this mapping when room is null: track tech = "Salle Loire" (ground floor), track decideurs = "Hémicycle" (1st floor). If room is set, its value wins.
- Chronological flow of clickable cards, with the two tracks side by side or clearly distinguished by time slot.
- On November 17, 2026 (Paris time), the screen scrolls automatically to the current or next session, with a "Now" marker. On other days, it opens at the top.
- Session page: title, subtitle, description, format, track, time, duration, room and floor, themes, image, speakers clickable to their page. Some sessions do not have a speaker yet: handle an empty list cleanly.
- Like: a heart on each card and page, stored in localStorage for this phase, never shown publicly. A "My sessions" filter. If the user likes a session that overlaps a session already liked, show a warning toast without blocking.
- Filter by track.
- Add to calendar, two buttons: "Add to my calendar", which generates an .ics file (Paris time, location Hôtel de Région Pays de la Loire, 1 rue de la Loire, 44200 Nantes, room in the description), and "Google Calendar", which opens the pre-filled Google event creation link.

## 4. Speakers

Source: https://genai-days-nantes.com/api/fr/speakers.json and /api/en/speakers.json.
Fields: id, name, role, company, eventRole (Jury, Round-table moderator, Startup Contest finalist, etc., sometimes null), bio, profile[], genaiLegitimacy, careerHighlights[], companies[], photo, links {linkedin, website, x}, sessions[], pageUrl.
List page (reachable from Program, through an internal tab or a link at the top) with photo, name, job title, company, event role. Detail page with bio, career, links and the sessions they host (cross-referenced with sessions.json by speaker id).

## 5. Floor plan

Two tabs: "Ground floor" and "1st floor". Static zoomable images (pinch on mobile). The real plans arrive later: put in two neutral placeholder images clearly marked "Plan coming soon", easy to replace.

## Out of scope for this phase

Backend, accounts, onboarding, directory, connection requests, messaging, session feedback, emails, AI. Do not create a database now.

Before coding, briefly confirm your understanding of phase 1, then build it.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://genai-days-companion.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d21fc369-e8c4-4574-abf3-c0538da7a072).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
