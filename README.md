# WakFarm - Calculateur de Rentabilité Wakfu

Application desktop **et web** pour calculer la rentabilité des donjons Wakfu avec partage des prix en temps réel.

## 🌐 Accès

- **Desktop** : Télécharger la dernière version dans [Releases](../../releases)
- **Web** : [https://volminoduro.github.io/wakfarm/](https://volminoduro.github.io/wakfarm/)

## 🎯 Fonctionnalités

- **Calcul de rentabilité** par donjon/instance, métier de récolte
- **Deux types de prix**:
  - 💾 Prix personnels (localStorage, local uniquement)
  - ☁️ Prix collectifs (Firestore, temps réel, communauté)
- **3 serveurs Wakfu** (Pandora, Rubilax, Ogrest)

## Captures d'écran

### Calcul de rentabilité par run
![Rentabilité par run](doc/screenshots/rentaRun.png)

### Rentabilité horaire
![Rentabilité horaire](doc/screenshots/rentaHoraire.png)

### Récapitulatif rentabilité horaire
![Récapitulatif horaire](doc/screenshots/rentaHoraireRecap.png)

### Rentabilité métier d'artisanat
![Rentabilité métier craft](doc/screenshots/jobCraft.png)

### Rentabilité métier de récolte
![Rentabilité métier harvest](doc/screenshots/jobHarvest.png)

### Prix personnels
![Prix personnels](doc/screenshots/pricePersonnels.png)

### Prix collectifs
![Prix collectifs](doc/screenshots/priceCollectif.png)

## 📦 Stack Technique

- **Frontend**: Vue 3 + Vite
- **Desktop**: Tauri (Windows)
- **Web**: GitHub Pages (déploiement statique)
- **Données locales**: localStorage (config, prix perso)
- **Données cloud**: Firebase Firestore (prix collectifs)
- L'essentiel du code a été produit à l'aide de Copilot.

## 📄 Licence

Licence MIT. Voir le fichier LICENSE.

## 📞 Support

Contact Discord dans l'application.

## ⚠️ Copyright

Les images et certaines donnees de ce depot proviennent du repository wakassets et sont **copyright © Ankama**.

## 🙏 Remerciement

**MethodWakfu** et **Waklab** pour le mapping des instances.
L'équipe **Wakfu** d'avoir donné les fichiers .json pour certaines données.
Les personnes qui ont pu me donner d'autres .json qui ont été utiles.
La communauté du jeu, tout ceci n'est possible que grâce à un travail collectif.
