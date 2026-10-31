# Phase 2 : accès, profils et annuaire

Lovable Cloud est activé. Le programme, les speakers, les sponsors et le plan restent publics et utilisables hors connexion.

## Deux confirmations avant l’authentification

- Confirmez-vous le stockage des données de profil décrites dans votre demande : identité, photo, activité, intentions et préférences ?
- Confirmez-vous la connexion immédiate à la fin de l’inscription, sans confirmation préalable de l’adresse e-mail modifiable ? Cela permettrait à une personne invitée de saisir une adresse qu’elle ne possède pas. Les privilèges administrateur de Maxime nécessiteront donc une vérification de son adresse, même si les autres comptes sont ouverts immédiatement.

## Ce qui sera construit

1. **Accès sur invitation** : vérification sécurisée du jeton, e-mail pré-rempli modifiable, invitation consommée une seule fois, connexion ultérieure par lien magique réservée aux comptes existants.
2. **Inscription en trois étapes** : identité et photo recadrée, activité et tags métier, intentions et consentement. Tous les champs acceptent des valeurs initiales pour la future phase 4.
3. **Annuaire** : cartes selon le palier sponsor, badge Speaker, recherche, filtres en feuille basse, compteur et fiches détaillées. Connexion désactivée avec « Bientôt disponible ».
4. **Sécurité des participant·es** : blocage réciproque, signalement avec motif, comptes suspendus exclus, statuts non modifiables par les utilisateur·ices.
5. **Mon profil** : consultation, modification, langue enregistrée, personnes bloquées, déconnexion et suppression complète du compte et de sa photo.
6. **Page publique `/donnees`** : texte français fourni conservé, crochets compris, et traduction anglaise.
7. **Liens speakers** : lien vers le profil networking lorsqu’un compte correspondant existe et que la personne qui consulte est connectée et autorisée à le voir.

## Détails techniques

- Tables demandées avec droits explicites et RLS, plus une table de rôles protégée pour l’autorité administrateur. `profile_status.is_admin` reflétera ce rôle sans devenir une source de privilèges modifiable.
- Les actions serveur seront des fonctions TanStack sécurisées, plutôt que de nouvelles Edge Functions, conformément à l’architecture actuelle de l’application.
- Invitations inaccessibles directement aux clients, jetons aléatoires et consommation atomique. Aucun statut sponsor ou administrateur ne sera dérivé de données d’identité non vérifiées pour accorder des privilèges.
- Photos dans un espace privé, avec lecture autorisée aux comptes connectés et écriture limitée au fichier du propriétaire.
- Statut Speaker calculé depuis le JSON officiel ; domaine sponsor depuis la table demandée. Un échec du JSON ne supprimera pas un statut existant. `manual_override` protège les valeurs forcées.
- Traductions FR/EN et valeurs stables pour les listes fermées ; design existant conservé.
- Aucun cache persistant des profils privés ni des réponses d’authentification dans le service worker.

## Vérification et livraison

- Tests sur normalisation LinkedIn, domaines sponsors, ordre de l’annuaire et contraintes des champs.
- Vérification avec deux comptes : lecture croisée, blocage dans les deux sens, exclusion des comptes suspendus et impossibilité de modifier les statuts.
- Vérification des parcours inscription, édition, filtres, blocage et suppression sur téléphone et ordinateur.
- Invitation de test pour Maxime, avec lien `/join` remis à la fin ; aucun envoi d’invitation par e-mail.
- Bilan final séparant les vérifications réussies des éléments non vérifiés, notamment la réception réelle des liens magiques.

## Hors périmètre

Demandes de connexion, messagerie, Airscale, IA, e-mails d’invitation et feedback de session. Les dates de fermeture et de suppression figurent sur la page de données, mais aucune automatisation de phase ultérieure n’est ajoutée ici. Aucune publication sans demande explicite.