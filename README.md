# WakFarm - Calculateur de Rentabilité Wakfu

Application desktop multi-plateforme pour calculer la rentabilité des donjons Wakfu avec partage des prix en temps réel.

## 🎯 Fonctionnalités

- **Calcul de rentabilité** par donjon/instance
- **Deux types de prix**:
  - 💾 Prix personnels (localStorage, local uniquement)
  - ☁️ Prix collectifs (Firestore, temps réel, communauté)
- **6 serveurs Wakfu** (Pandora, Rubilax, Ogrest + Neo-variants)
- **Interface moderne** (Vue 3 + Vite)
- **Desktop app** (Tauri - Windows/macOS/Linux)
- **DevTools intégrés** (F12 dans l'app)

## 🚀 Démarrage

```bash
# Installation
npm install

# Dev (http://localhost:8081)
npm run dev

# Build production
npm run build

# Desktop (Tauri)
npm run tauri dev
npm run tauri build
```

## 📦 Stack Technique

- **Frontend**: Vue 3 + Vite + TypeScript
- **Desktop**: Tauri
- **Données locales**: localStorage (config, prix perso)
- **Données cloud**: Firebase Firestore (prix collectifs)
- **Auth**: Firebase Anonymous Auth (automatique)
- **i18n**: vue-i18n (français/anglais)

## 🏗️ Architecture

### Stores (Pinia)

| Store | Stockage | Données |
|-------|----------|---------|
| `useAppStore` | localStorage | Config utilisateur (serveur, stasis, etc.) |
| `usePersonalPricesStore` | localStorage | Prix saisis manuellement |
| `useCollectivePricesStore` | Firebase Firestore | Prix communauté (temps réel) |
| `useJsonStore` | RAM | Items, instances, loot tables |
| `useConfigRunStore` | localStorage | Config runs de rentabilité |

### Collections Firestore

```
wakfarm-p2p (projet)
├── allowlist/
│   └── {uid} (auto-créé à 1ère connexion)
├── blacklist_read/ & blacklist_write/ (admin)
├── collective_prices_pandora/
├── collective_prices_rubilax/
├── collective_prices_ogrest/
├── collective_prices_neo-{*}/
├── price_history_pandora/
├── price_history_rubilax/
└── ... (historique par serveur)
```

## ⚙️ Configuration

### Firebase Rules

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Projet: `wakfarm-p2p` → Firestore → Rules
3. Appliquez vos regles dans la console

### Variables d'environnement

Modifiez `src/stores/useCollectivePricesStore.js` si vous changez de projet Firebase:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
}
```

## 🔐 Sécurité

- **Auth**: Firebase Anonymous (pas de mot de passe, auto)
- **Access Control**: Allowlist/blacklist par UID
- **Traçabilité**: Chaque prix enregistre `authorID`
- **DevTools**: Activé en dev/build (voir tauri.conf.json)

## 🐛 Troubleshooting

**Erreur Firebase "permission denied"**
→ Vérifiez les règles Firestore appliquées

**Prices ne se charge pas**
→ Vérifiez les collections Firestore existent
→ Vérifiez la console (F12 → Console)

**Changement de serveur ne fonctionne pas**
→ Refresher la page
→ Vérifier que le serveur est valide

## 📋 Checklist de déploiement

- [ ] Firebase Rules appliquées
- [ ] App démarre sans erreur
- [ ] Prices collectifs chargent
- [ ] Changement de serveur fonctionne
- [ ] localStorage persiste (refresh)
- [ ] DevTools accessible (F12)

## 📄 Licence

Projet privé.

## 👨‍💻 Développement

### Structure du projet

```
src/
├── components/     # Composants Vue
├── stores/         # Pinia stores
├── views/          # Pages principales
├── composables/    # Logique réutilisable
├── constants/      # Constantes (serveurs, etc.)
├── utils/          # Fonctions utilitaires
├── assets/         # Images, CSS
└── App.vue         # Composant root
```

### Tests

```bash
npm run test          # Vitest
npm run typecheck     # TypeScript
```

### Build

```bash
npm run build         # Vite build (dist/)
npm run preview       # Prévisualiser le build
npm run tauri build   # Tauri .exe/.dmg/.AppImage
```

## 🔄 Mise à jour des dépendances

```bash
npm update
npm audit fix
```

## 📞 Support

Contact Discord dans l'application.
