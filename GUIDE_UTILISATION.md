# Guide d'utilisation - Système de Pointage Collable

Ce guide explique comment utiliser le système de pointage Collable pour les administrateurs et les agents.

## Table des matières

1. [Connexion au système](#connexion-au-système)
2. [Interface administrateur](#interface-administrateur)
   - [Tableau de bord](#tableau-de-bord-administrateur)
   - [Gestion des agents](#gestion-des-agents)
   - [QR Code de pointage](#qr-code-de-pointage)
   - [Gestion des pointages](#gestion-des-pointages)
3. [Interface agent](#interface-agent)
   - [Tableau de bord](#tableau-de-bord-agent)
   - [Scanner un QR Code](#scanner-un-qr-code)
   - [Consulter ses pointages](#consulter-ses-pointages)
   - [Gérer son profil](#gérer-son-profil)
4. [Résolution des problèmes courants](#résolution-des-problèmes-courants)

## Connexion au système

1. Ouvrez votre navigateur et accédez à l'URL du système (par défaut : http://localhost:5173)
2. Sur la page de connexion, saisissez vos identifiants :
   - Email : votre adresse email
   - Mot de passe : votre mot de passe
3. Cliquez sur "Se connecter"

**Note :** Pour la première connexion, utilisez les identifiants administrateur par défaut :
- Email : admin@collable.fr
- Mot de passe : admin123 (à changer immédiatement pour des raisons de sécurité)

## Interface administrateur

### Tableau de bord administrateur

Le tableau de bord administrateur affiche un aperçu global du système :

- Nombre total d'agents
- Nombre d'agents présents aujourd'hui
- Nombre d'agents absents aujourd'hui
- Nombre total de pointages aujourd'hui

Des boutons d'accès rapide permettent de naviguer vers les différentes fonctionnalités.

### Gestion des agents

Cette page permet de gérer les utilisateurs du système :

#### Ajouter un agent

1. Cliquez sur le bouton "Ajouter un agent"
2. Remplissez le formulaire avec les informations de l'agent :
   - Nom : nom complet de l'agent
   - Email : adresse email de l'agent (servira d'identifiant)
   - Mot de passe : mot de passe initial
   - Rôle : "Agent" ou "Administrateur"
3. Cliquez sur "Ajouter"

#### Modifier un agent

1. Cliquez sur "Modifier" à côté de l'agent concerné
2. Modifiez les informations souhaitées
3. Laissez le champ mot de passe vide si vous ne souhaitez pas le modifier
4. Cliquez sur "Enregistrer"

#### Supprimer un agent

1. Cliquez sur "Supprimer" à côté de l'agent concerné
2. Confirmez la suppression dans la boîte de dialogue

### QR Code de pointage

Cette page permet de gérer le QR Code utilisé pour les pointages :

#### Générer un nouveau QR Code

1. Cliquez sur "Mettre à jour le QR code"
2. Le nouveau QR Code s'affiche et l'ancien est automatiquement désactivé

#### Imprimer le QR Code

1. Cliquez sur "Imprimer le QR code"
2. Une nouvelle fenêtre s'ouvre avec le QR Code formaté pour l'impression
3. Utilisez la fonction d'impression de votre navigateur ou cliquez sur le bouton "Imprimer"

**Important :** Affichez le QR Code imprimé dans un endroit accessible à tous les agents pour qu'ils puissent pointer.

### Gestion des pointages

Cette page permet de consulter et d'exporter les pointages des agents :

#### Filtrer les pointages

1. Sélectionnez une période (date de début et date de fin)
2. Saisissez éventuellement un terme de recherche pour filtrer par nom ou email d'agent
3. Cliquez sur "Filtrer"

#### Exporter les pointages

1. Sélectionnez le format d'export souhaité (CSV ou Excel)
2. Cliquez sur "Exporter"
3. Le fichier sera téléchargé automatiquement

## Interface agent

### Tableau de bord agent

Le tableau de bord agent affiche :

- Les pointages du jour (matin et après-midi)
- Un bouton pour accéder rapidement au scan du QR Code
- Des liens vers les autres fonctionnalités

### Scanner un QR Code

Cette page permet à l'agent de pointer sa présence :

1. Accordez l'autorisation d'accès à la caméra si demandé
2. Placez le QR Code devant la caméra
3. Le système détecte automatiquement le QR Code et enregistre le pointage
4. Un message de confirmation s'affiche

**Note :** Vous devez scanner le QR Code une fois le matin et une fois l'après-midi.

### Consulter ses pointages

Cette page permet à l'agent de consulter l'historique de ses pointages :

1. Sélectionnez la période souhaitée (date de début et date de fin)
2. Cliquez sur "Filtrer"
3. Le tableau affiche les pointages pour chaque jour de la période sélectionnée

### Gérer son profil

Cette page permet à l'agent de consulter ses informations et de modifier son mot de passe :

#### Modifier son mot de passe

1. Saisissez votre mot de passe actuel
2. Saisissez votre nouveau mot de passe
3. Confirmez votre nouveau mot de passe
4. Cliquez sur "Changer le mot de passe"

## Résolution des problèmes courants

### Problème de connexion

- Vérifiez que vous utilisez la bonne adresse email et le bon mot de passe
- Si vous avez oublié votre mot de passe, contactez un administrateur

### Problème de scan du QR Code

- Assurez-vous que la caméra est autorisée dans les paramètres de votre navigateur
- Vérifiez que le QR Code est bien éclairé et non endommagé
- Si le problème persiste, contactez un administrateur

### Message "Vous avez déjà pointé pour cette session"

- Vous ne pouvez pointer qu'une seule fois par session (matin ou après-midi)
- Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur

### Problème d'affichage

- Essayez de rafraîchir la page
- Videz le cache de votre navigateur
- Essayez avec un autre navigateur (Chrome, Firefox, Edge)
