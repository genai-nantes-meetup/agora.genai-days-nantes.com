# Phase 3 : connexions, messagerie et notifications

## Résultat attendu
- Remplacer le bouton provisoire des profils par les états demander, envoyée, accepter/refuser et envoyer un message.
- Afficher les demandes reçues en tête de Messages, puis les conversations avec photo, dernier message, heure et non-lus.
- Ouvrir une conversation à deux lors de l’acceptation ; échanges en temps réel, lecture, renouvellement de session Twilio et badges.
- Notifications navigateur et e-mails attendus par le destinataire, en français ou anglais. Aucun Airscale, IA, feedback ou outil d’administration.

## Règles conservées
- Une seule demande par paire, sans message, limite ni relance. Un refus reste « Demande envoyée » pour son auteur·ice.
- Bloquer masque les profils, annule les demandes en attente et ferme la conversation. La fermeture locale empêche immédiatement l’accès ; la fermeture Twilio doit être confirmée et réessayée en cas d’échec.
- Un e-mail par nouvelle demande. Pour les messages, premier rappel après cinq minutes sans lecture, au plus un par conversation jusqu’à une nouvelle lecture du destinataire. Le contrôle du read horizon se fait chez Twilio.
- À partir du **24 novembre 2026 à 00:00, heure de Paris**, aucune écriture de message n’est autorisée, y compris depuis un ancien jeton Twilio.

## Prérequis à fournir
**Twilio :** aucun identifiant n’est actuellement enregistré. Le connecteur peut gérer les appels REST, mais ne remplace pas nécessairement les clés de signature des jetons ni le secret de vérification du webhook. Prévoir `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_CONVERSATIONS_SERVICE_SID` et **`TWILIO_AUTH_TOKEN`** pour les signatures Twilio. Ces valeurs se saisissent uniquement dans Project Settings → Secrets, jamais dans le chat.

**E-mails :** configurer un domaine d’envoi que vous possédez avec l’outil de configuration Lovable. Utiliser l’envoi natif, expéditeur affiché « GenAI Days ». Aucun système de file d’attente d’e-mails ni expéditeur générique ouvert au navigateur.

**Push :** créer une paire de clés VAPID compatible Web Push et conserver la clé privée comme secret. La clé publique est transmise uniquement pour l’inscription aux notifications ; aucune clé privée n’est exposée. La génération doit suivre une méthode de stockage sécurisée compatible avec les outils disponibles, qui ne génèrent actuellement que des secrets alphanumériques, pas des paires VAPID.

Les demandes, les écrans et les tests indépendants de ces services seront réalisés sans attendre ; les échanges réels, les push et les e-mails seront signalés comme non vérifiés tant que leurs prérequis manquent.

## Mise en œuvre technique
- Respecter l’architecture TanStack Start : fonctions serveur authentifiées pour les actions internes ; routes publiques sécurisées pour les callbacks Twilio. Pas de nouvelles Edge Functions.
- Ajouter `connection_requests`, `conversations`, `message_events` et `push_subscriptions`, avec GRANT et RLS limités aux personnes concernées. Unicité SQL sur la paire non ordonnée, transitions atomiques, accès refusé aux comptes suspendus ou bloqués. Les événements et états de livraison sont écrits côté serveur uniquement.
- Séparer les règles pures testables, l’accès Twilio via fetch et les fonctions authentifiées. Générer les jetons ChatGrant courts avec une bibliothèque compatible serveur ou Web Crypto, identity = user_id ; charger le SDK `@twilio/conversations` après hydratation.
- Valider les callbacks sur l’URL publique canonique et le corps brut. Utiliser un callback pré-event en plus du post-event pour interdire les messages après fermeture ou blocage : l’interface seule ne suffit pas avec un SDK Twilio.
- Ajouter une route de conversation dédiée, une gestion partagée des non-lus, la Badging API lorsqu’elle existe, et un worker de notification séparé du worker de cache actuel. Conserver les exclusions de cache des comptes et réponses privées.
- Demander l’autorisation push une fois à l’ouverture de Messages ; proposer activer/pas maintenant. Sur iPhone non installé, afficher la condition d’installation sans demander une autorisation impossible.
- Scaffolder les deux gabarits d’e-mails après configuration du domaine. Chaque événement envoie un gabarit fixe à son destinataire vérifié, avec une clé d’idempotence issue de l’événement.
- Utiliser le callback planifié géré et son authentification existante pour les rappels. Un contrôle chaque minute représente **1 440 passages par jour**, avec un délai de cinq à six minutes après réception et un coût récurrent possible même sans activité. Aucun secret de planification écrit dans SQL ou le code.
- Fournir les URLs des callbacks Twilio une fois les routes créées ; elles ne deviennent actives en production qu’après publication autorisée.

## Vérification
- Tests concrets : unicité par paire dans les deux sens, refus silencieux, blocage, un rappel par conversation jusqu’à lecture, frontière exacte de fermeture en heure de Paris.
- Vérifier RLS avec deux comptes : tiers inaccessible, demande, réception, refus, acceptation, blocage.
- Avec Twilio configuré : échange réel entre deux sessions, renouvellement de jeton, non-lus et lecture, rejet serveur après fermeture/blocage.
- Vérifier desktop et mobile ; contrôler notifications sur appareils compatibles et e-mails dans les journaux d’envoi.
- Résumé final séparant vérifié/non vérifié, prérequis encore absents et URLs Twilio à configurer.