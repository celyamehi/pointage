# 🔄 Nouvelle Logique de Pointage - 4 pointages par jour

## 📋 Résumé de la nouvelle logique

### Ancienne logique (2 pointages/jour)
- 1 pointage le matin
- 1 pointage l'après-midi

### Nouvelle logique (4 pointages/jour)
- **Matin (8h-12h30)** : 2 pointages
  - 1er pointage = Heure d'arrivée matin
  - 2ème pointage = Heure de sortie matin (pause déjeuner)
- **Après-midi (13h-18h)** : 2 pointages
  - 3ème pointage = Heure d'arrivée après-midi (retour de pause)
  - 4ème pointage = Heure de sortie après-midi (fin de journée)

---

## ✅ Modifications déjà effectuées

### 1. Backend - Modèles
- ✅ `backend/app/pointage/models.py` : Modèle `PointageJour` mis à jour avec 4 champs
  - `matin_arrivee`
  - `matin_sortie`
  - `apres_midi_arrivee`
  - `apres_midi_sortie`

### 2. Backend - Logique de pointage
- ✅ `backend/app/pointage/utils.py` : 
  - Fonction `create_pointage()` modifiée pour gérer arrivée/sortie
  - Vérification : maximum 2 pointages par session
  - Détection automatique du type (arrivée ou sortie)
  - Logs détaillés

### 3. Backend - Formatage des données
- ✅ `backend/app/pointage/utils.py` :
  - Fonction `format_pointages_by_date()` mise à jour
  - Retourne 4 champs au lieu de 2

### 4. Frontend - Affichage
- ✅ `frontend/src/pages/agent/MesPointages.jsx` :
  - Tableau mis à jour avec 4 colonnes
  - En-têtes : Matin (Arrivée/Sortie) + Après-midi (Arrivée/Sortie)
  - Affichage avec ✓ vert pour arrivée, ✓ bleu pour sortie

### 5. Fuseau horaire
- ✅ GMT+1 configuré partout

---

## ⚠️ IMPORTANT : Migration de la base de données requise

### Étape 1 : Exécuter le script SQL dans Supabase

1. Connectez-vous à https://supabase.com
2. Allez dans votre projet
3. Cliquez sur "SQL Editor"
4. Exécutez le script : `backend/migration_add_type_pointage.sql`

Ce script va :
- Ajouter la colonne `type_pointage` à la table `pointages`
- Mettre à jour les pointages existants (par défaut = 'arrivee')
- Créer un index pour les performances

### Étape 2 : Redémarrer le backend

```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```

---

## 🧪 Scénarios de test

### Test 1 : Journée complète
1. **09h00** → Scan QR → ✅ Pointage matin arrivée
2. **12h00** → Scan QR → ✅ Pointage matin sortie
3. **13h30** → Scan QR → ✅ Pointage après-midi arrivée
4. **17h30** → Scan QR → ✅ Pointage après-midi sortie
5. **18h00** → Scan QR → ❌ Erreur : limite atteinte

### Test 2 : Tentative de 3ème pointage matin
1. **09h00** → Scan QR → ✅ Pointage matin arrivée
2. **12h00** → Scan QR → ✅ Pointage matin sortie
3. **12h15** → Scan QR → ❌ Erreur : "Vous avez déjà effectué vos 2 pointages pour la session du matin"

---

## 📊 Affichage dans le tableau

### Exemple de tableau
| Date       | Matin (8h-12h30) |        | Après-midi (13h-18h) |        |
|------------|------------------|--------|----------------------|--------|
|            | Arrivée          | Sortie | Arrivée              | Sortie |
| 06/10/2025 | ✓ 08:30          | ✓ 12:15| ✓ 13:45              | ✓ 17:30|
| 05/10/2025 | ✓ 08:45          | ✓ 12:00| ✓ 13:30              | -      |

---

## 🔧 Fichiers modifiés

1. `backend/app/pointage/models.py` - Modèles
2. `backend/app/pointage/utils.py` - Logique de pointage
3. `backend/migration_add_type_pointage.sql` - Migration SQL
4. `frontend/src/pages/agent/MesPointages.jsx` - Affichage agent
5. `backend/app/admin/utils.py` - Fuseau horaire GMT+1

---

## 📝 Prochaines étapes

1. ✅ Exécuter la migration SQL dans Supabase
2. ✅ Redémarrer le backend
3. ✅ Tester les 4 pointages
4. ⏳ Mettre à jour la page admin/Pointages.jsx (si nécessaire)
5. ⏳ Mettre à jour l'export Excel (si nécessaire)

---

## 💡 Notes importantes

- Les pointages existants seront marqués comme "arrivee" par défaut
- Le système détecte automatiquement si c'est une arrivée ou une sortie
- Les logs montrent clairement le type de pointage
- L'admin est exclu des statistiques
