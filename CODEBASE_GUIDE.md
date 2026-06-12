# Guide d'Architecture - Clone TikTok (StreamSky)

Ce guide répertorie tous les fichiers importants du projet et explique leur rôle afin de vous aider à comprendre facilement le fonctionnement général de l'application.

---

## 🗺️ Architecture Globale des Fichiers

Voici l'arborescence des fichiers clés que nous avons créés ou modifiés :

```
StreamSky/
├── App.tsx                     # Point d'entrée de l'application (charge l'AuthProvider)
├── CODEBASE_GUIDE.md           # Ce guide d'explications
├── android/
│   └── app/build.gradle        # Configuration des polices pour react-native-vector-icons
└── src/
    ├── AppNavigator.tsx        # Gestion de la navigation principale et modales
    ├── context/
    │   └── AuthContext.tsx     # Gestion de l'authentification (Google et Invité)
    ├── services/
    │   └── CloudinaryService.ts # Service d'optimisation et liste de vidéos Cloudinary
    ├── theme/
    │   ├── colors.ts           # Palette de couleurs stylisée (violet foncé, cyan, magenta)
    │   └── typography.ts       # Styles typographiques de l'application
    └── screens/
        ├── LandingScreen.tsx   # Écran d'accueil et d'authentification (Onboarding)
        ├── HomeScreen.tsx      # Flux vidéo TikTok (défilement vertical infini, likes, commentaires)
        ├── FriendsScreen.tsx   # Écran "Ami(e)s" avec stories et publications
        ├── ProfileScreen.tsx   # Profil utilisateur dynamique (0 abonnés si Google, etc.)
        └── CameraScreen.tsx    # Écran d'enregistrement avec la caméra du téléphone
```

---

## 📄 Explications Détaillées des Fichiers Importants

### 1. [App.tsx](file:///home/jorel/Bureau/StreamSky/App.tsx)
- **Rôle** : Enveloppe toute l'application dans le composant `AuthProvider` et charge la barre d'état système (`StatusBar`), puis affiche le navigateur racine (`AppNavigator`).

### 2. [src/context/AuthContext.tsx](file:///home/jorel/Bureau/StreamSky/src/context/AuthContext.tsx)
- **Rôle** : Fournit le contexte d'authentification global de l'application et gère les états partagés.
- **Fonctionnalités** :
  - Connexion en tant qu'**Invité** (attribue des données fictives avec le libellé "Invité").
  - Connexion avec **Google réelle** via `@react-native-google-signin/google-signin` (avec un repli simulé premium automatique si les configurations Firebase/Google Play Services manquent pour éviter tout crash).
  - Déconnexion complète.
  - **Favoris et J'aime globaux** : Maintient les tableaux d'identifiants `bookmarkedIds` et `likedIds` avec des fonctions de basculement (`toggleBookmark`, `toggleLike`) partagés entre le flux vidéo et le profil utilisateur.
  - **Personnalisation** : Fonction `updateProfile()` permettant de mettre à jour le nom, la bio et l'avatar de l'utilisateur.

### 3. [src/services/CloudinaryService.ts](file:///home/jorel/Bureau/StreamSky/src/services/CloudinaryService.ts)
- **Rôle** : Gère les adresses des vidéos et applique les optimisations automatiques de Cloudinary.
- **Fonctionnalités** :
  - Gère les URLs vidéos et images sur votre espace Cloudinary `dwfvxelne`.
  - Intègre en première position la vidéo de présentation HLS `.m3u8` (`introduction_gewbzq`) avec son image de couverture JPG associée comme miniature (`1360490_gdwql0`).

### 4. [src/AppNavigator.tsx](file:///home/jorel/Bureau/StreamSky/src/AppNavigator.tsx)
- **Rôle** : Cerveau de la navigation.
- **Fonctionnalités** :
  - Affiche l'écran `LandingScreen` ou les onglets selon l'état d'authentification de l'utilisateur.
  - Ouvre l'appareil photo `CameraScreen` en modal plein écran lorsque l'état global `isCameraOpen` est activé (soit via le bouton `+` du bas, soit via l'icône caméra en haut à gauche de l'Accueil).

### 5. [src/screens/LandingScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/LandingScreen.tsx)
- **Rôle** : Premier écran de bienvenue (dégradé violet, logo animé).
- **Boutons** : "Continuer avec Google" et "Continuer en tant qu'invité".

### 6. [src/screens/HomeScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/HomeScreen.tsx)
- **Rôle** : Fil d'actualité vidéo vertical infini (style TikTok).
- **Fonctionnalités** :
  - Lecture automatique de la vidéo active avec gestion d'erreurs sécurisée (`onError`) contre les plantages réseaux.
  - Double-clic ou bouton Cœur pour Liker (synchronisé avec l'état global).
  - Bouton Favoris/Marque-page pour sauvegarder la vidéo.
  - Commentaires interactifs et bouton Partager natif.

### 7. [src/screens/FriendsScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/FriendsScreen.tsx)
- **Rôle** : Onglet "Ami(e)s" avec stories horizontales et publications d'amis équipées d'un lecteur vidéo robuste.

### 8. [src/screens/ProfileScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/ProfileScreen.tsx)
- **Rôle** : Profil de l'utilisateur connecté.
- **Fonctionnalités** :
  - **Personnalisation** : Bouton "Modifier le profil" ouvrant un modal pour modifier le nom, la biographie, et choisir un avatar premium.
  - **Onglets interactifs** :
    - *Publications* : Grille des vidéos du feed.
    - *Favoris* : Grille filtrée affichant uniquement les vidéos enregistrées par l'utilisateur.
    - *J'aime* : Grille filtrée affichant uniquement les vidéos aimées.
    - *Privé* : Section d'explications verrouillée.

### 9. [src/screens/CameraScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/CameraScreen.tsx)
- **Rôle** : Gère l'accès sécurisé à l'appareil photo du téléphone pour l'enregistrement.

---

## 🛠️ Instructions d'Exécution

Pour démarrer et compiler l'application :

1. Dans un premier terminal, lancez le serveur Metro :
   ```bash
   npx react-native start --reset-cache
   ```
2. Dans un second terminal, compilez et lancez sur votre périphérique ou émulateur :
   ```bash
   npx react-native run-android
   ```

## 🛠️ Configuration des Icônes dans Gradle
Pour que les icônes vectorielles s'affichent correctement sur votre téléphone sans afficher de carrés vides ou d'émojis, nous avons déclaré les polices nécessaires dans [android/app/build.gradle](file:///home/jorel/Bureau/StreamSky/android/app/build.gradle) :
```gradle
project.ext.vectoricons = [
    iconFontNames: [ 'MaterialIcons.ttf', 'FontAwesome.ttf', 'Ionicons.ttf', 'FontAwesome5_Solid.ttf', 'FontAwesome5_Regular.ttf', 'FontAwesome5_Brands.ttf' ]
]
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

