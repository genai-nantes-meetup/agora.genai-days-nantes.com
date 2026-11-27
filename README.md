# Genai Days Agora

Nous construisons « Hey GenAI Days », la web app compagnon de l'événement GenAI Days (mardi 17 novembre 2026, 8h30 à 22h, Hôtel de Région Pays de la Loire, Nantes). Elle sera servie sur hey.genai-days-nantes.com. 150 à 200 participant·es l'utiliseront, surtout sur mobile, le jour J. Priorité absolue : la stabilité.

Le projet se construit en plusieurs phases. CETTE PHASE 1 couvre uniquement le socle, le programme, les speakers et le plan. Aucun backend, aucune authentification pour l'instant : le networking, la messagerie et le profil arriveront dans les phases suivantes.

## 1. Socle

- PWA mobile-first, installable : manifeste, icônes, service worker (vite-plugin-pwa ou équivalent). Sur Android, proposer l'installation native via l'événement beforeinstallprompt. Sur iPhone, afficher une seule fois un bandeau d'aide « Partager, puis Sur l'écran d'accueil ».
- Hors connexion : le programme, les speakers et le plan doivent rester consultables sans réseau (stratégie stale-while-revalidate sur les JSON et les images).
- Bilingue français et anglais. Tous les libellés d'interface passent par des fichiers de traduction (fr, en). Langue initiale déduite du navigateur, bascule FR/EN dans l'en-tête, choix mémorisé en localStorage.
- Navigation basse à 5 onglets : Networking, Messages, Programme, Plan, Profil. Networking, Messages et Profil affichent pour l'instant un écran « Bientôt disponible / Coming soon ». L'app s'ouvre sur Programme.

## 2. Identité visuelle (reprise du site genai-days-nantes.com)

Couleurs : orange #fe4d1b (accent), bleu nuit #09122e (texte et fonds sombres), crème #f9f4ec (fond principal), crème foncé #f2eadf (surfaces), bleu #3d43ce (secondaire), blanc #ffffff.
Polices : EB Garamond pour les titres, Special Elite pour les petits labels (horaires, salles, tags), une sans-serif lisible pour le corps de texte.
Ton éditorial, sobre et chaleureux. Contrastes accessibles (WCAG AA).

## 3. Programme

Source, lue à l'exécution selon la langue active (CORS ouvert) :
- https://genai-days-nantes.com/api/fr/sessions.json
- https://genai-days-nantes.com/api/en/sessions.json

Chaque session a : id, title, subtitle, description, format (talk, keynote, table-ronde, concours, podcast), track (decideurs, tech, commun), startTime (HH:MM), durationMinutes, room, themes[], speakers[{id, name, pageUrl}], image, pageUrl. La date et le fuseau sont dans event.date et event.timezone.

Règles :
- Le champ room vaut null sauf pour la keynote. Appliquer cette correspondance quand room est null : track tech = « Salle Loire » (rez-de-chaussée), track decideurs = « Hémicycle » (1er étage). Si room est renseigné, sa valeur prime.
- Déroulé chronologique de cartes cliquables, les deux tracks côte à côte ou clairement distinguées par créneau.
- Le 17 novembre 2026 (heure de Paris), l'écran défile automatiquement vers la session en cours ou la suivante, avec un repère « En ce moment / Now ». Les autres jours, il s'ouvre en haut.
- Fiche session : titre, sous-titre, description, format, track, horaire, durée, salle et étage, thèmes, image, speakers cliquables vers leur fiche. Certaines sessions n'ont pas encore de speaker : gérer une liste vide proprement.
- Like : cœur sur chaque carte et fiche, stocké en localStorage pour cette phase, jamais affiché publiquement. Filtre « Mes sessions ». Si on like une session qui chevauche une session déjà likée, afficher un toast d'avertissement sans bloquer.
- Filtre par track.
- Ajout à l'agenda, deux boutons : « Ajouter à mon agenda » qui génère un fichier .ics (heure de Paris, lieu Hôtel de Région Pays de la Loire, 1 rue de la Loire, 44200 Nantes, salle dans la description), et « Google Agenda » qui ouvre le lien de création d'événement Google pré-rempli.

## 4. Speakers

Source : https://genai-days-nantes.com/api/fr/speakers.json et /api/en/speakers.json.
Champs : id, name, role, company, eventRole (Jury, Modératrice de table ronde, Finaliste Startup Contest, etc., parfois null), bio, profile[], genaiLegitimacy, careerHighlights[], companies[], photo, links {linkedin, website, x}, sessions[], pageUrl.
Page liste (accessible depuis Programme, par un onglet interne ou un lien en tête) avec photo, nom, poste, entreprise, rôle événement. Fiche détaillée avec bio, parcours, liens et sessions animées (croisement avec sessions.json par id de speaker).

## 5. Plan

Deux onglets : « Rez-de-chaussée » et « 1er étage ». Images statiques zoomables (pincement sur mobile). Les vrais plans arrivent plus tard : mets deux images de remplacement neutres clairement marquées « Plan à venir », faciles à remplacer.

## Hors périmètre de cette phase

Backend, comptes, onboarding, annuaire, demandes de connexion, messagerie, feedback de session, e-mails, IA. Ne crée pas de base de données maintenant.

Avant de coder, confirme brièvement ta compréhension de la phase 1, puis construis-la.

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
