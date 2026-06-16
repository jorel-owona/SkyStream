# Guide d'Architecture - Clone TikTok (StreamSky)

Ce guide répertorie tous les fichiers importants du projet et explique leur rôle afin de vous aider à comprendre facilement le fonctionnement général de l'application.

---

## 🗺️ Architecture Globale des Fichiers

Voici l'arborescence des fichiers clés que nous avons créés ou modifiés :

```
StreamSky/
├── App.tsx                     # Point d'entrée de l'application (charge l'AuthProvider)
├── CODEBASE_GUIDE.md           # Ce guide d'explications
├── supabase_schema.sql         # Script SQL de création de tables et politiques Supabase
├── android/
│   └── app/build.gradle        # Configuration des polices pour react-native-vector-icons
└── src/
    ├── AppNavigator.tsx        # Gestion de la navigation principale, onglets et modales globales
    ├── context/
    │   └── AuthContext.tsx     # Gestion de l'authentification (Google et Invité) et états d'appareil photo
    ├── libs/
    │   └── supabase.ts         # Initialisation du client Supabase avec polyfills d'URL pour React Native
    ├── services/
    │   ├── CloudinaryService.ts # Service d'optimisation et liste de vidéos Cloudinary
    │   └── SupabaseService.ts   # Gestion de la liaison Firebase Auth/Supabase (insertions/lectures)
    ├── theme/
    │   ├── colors.ts           # Palette de couleurs stylisée (violet foncé, cyan, magenta)
    │   └── typography.ts       # Styles typographiques de l'application
    └── screens/
        ├── LandingScreen.tsx   # Écran d'accueil et d'authentification (Onboarding)
        ├── HomeScreen.tsx      # Flux vidéo TikTok (défilement vertical infini, likes, commentaires)
        ├── FriendsScreen.tsx   # Écran "Ami(e)s" avec stories et publications et raccourci "Créer"
        ├── MessagesScreen.tsx  # Boîte de réception de chat avec raccourcis de publication rapide
        ├── ProfileScreen.tsx   # Profil dynamique avec onglets de grille et raccourcis de caméra
        └── CameraScreen.tsx    # Interface d'appareil photo native (vision-camera), galerie et publication
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
  - **Contrôle global de caméra** : Fournit les états `isCameraOpen` et `cameraMode` ('video' | 'story') accessibles depuis n'importe quel écran pour lancer le modal d'appareil photo.

### 3. [src/libs/supabase.ts](file:///home/jorel/Bureau/StreamSky/src/libs/supabase.ts)
- **Rôle** : Initialise le client Supabase avec l'adresse du projet et la clé anonyme fournies.
- **Détails** : Configure `react-native-url-polyfill/auto` pour pallier l'absence de certains constructeurs d'URL natifs dans le moteur JavaScript de React Native. Désactive l'authentification Supabase interne puisque Firebase Authentication reste le maître de la session.

### 4. [src/services/SupabaseService.ts](file:///home/jorel/Bureau/StreamSky/src/services/SupabaseService.ts)
- **Rôle** : Gère toutes les insertions et lectures dans la base de données PostgreSQL de Supabase.
- **Détails** :
  - `getFirebaseUid()` : Récupère l'UID unique de l'utilisateur connecté via Firebase.
  - `publishVideo()` : Enregistre les métadonnées de la vidéo (titre, URL Cloudinary, UID de l'utilisateur) dans la table `videos`.
  - `publishStory()` : Enregistre les métadonnées de la story dans la table `stories`.
  - `fetchVideos()` / `fetchActiveStories()` : Récupère les données à afficher de manière performante.

### 5. [src/services/CloudinaryService.ts](file:///home/jorel/Bureau/StreamSky/src/services/CloudinaryService.ts)
- **Rôle** : Gère les adresses des vidéos et applique les optimisations automatiques de Cloudinary.
- **Fonctionnalités** :
  - Gère les URLs vidéos et images sur votre espace Cloudinary `dwfvxelne`.
  - Intègre en première position la vidéo de présentation HLS `.m3u8` (`introduction_gewbzq`) avec son image de couverture JPG associée comme miniature (`1360490_gdwql0`).

### 6. [src/AppNavigator.tsx](file:///home/jorel/Bureau/StreamSky/src/AppNavigator.tsx)
- **Rôle** : Cerveau de la navigation.
- **Fonctionnalités** :
  - Affiche l'écran `LandingScreen` ou les onglets selon l'état d'authentification de l'utilisateur.
  - Ouvre l'appareil photo `CameraScreen` en modal plein écran lorsque l'état global `isCameraOpen` est activé (soit via le bouton `+` du bas, soit via les différents raccourcis).

### 7. [src/screens/HomeScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/HomeScreen.tsx)
- **Rôle** : Fil d'actualité vidéo vertical infini (style TikTok).
- **Fonctionnalités** :
  - Lecture automatique de la vidéo active avec gestion d'erreurs sécurisée (`onError`) contre les plantages réseaux.
  - Double-clic ou bouton Cœur pour Liker (synchronisé avec l'état global).
  - Bouton Favoris/Marque-page pour sauvegarder la vidéo.
  - Commentaires interactifs et bouton Partager natif.

### 8. [src/screens/FriendsScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/FriendsScreen.tsx)
- **Rôle** : Onglet "Ami(e)s" avec stories horizontales et publications d'amis équipées d'un lecteur vidéo robuste.
- **Raccourci** : Cliquer sur l'item "Créer" de la liste des stories horizontale ouvre instantanément la caméra en mode Story.

### 9. [src/screens/MessagesScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/MessagesScreen.tsx)
- **Rôle** : Boîte de messagerie et de discussion.
- **Raccourcis** :
  - Affiche l'avatar de l'utilisateur connecté ("Votre Story" avec un badge `+`) en tête de la ligne des amis actifs. Cliquer dessus lance la création de Story.
  - Cliquer sur l'icône Caméra ou Galerie dans le champ de saisie d'un chat lance l'appareil photo nativement.

### 10. [src/screens/ProfileScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/ProfileScreen.tsx)
- **Rôle** : Profil de l'utilisateur connecté.
- **Raccourcis** : Les boutons "Publier" (mode vidéo) et "Story" (mode story) sont placés juste sous les boutons d'édition pour une réactivité optimale de type TikTok.

### 11. [src/screens/CameraScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/CameraScreen.tsx)
- **Rôle** : Gère l'accès sécurisé à l'appareil photo et au microphone du téléphone pour l'enregistrement.
- **Fonctionnalités** :
  - Capture vidéo/audio native avec `react-native-vision-camera`.
  - Bouton Galerie pour sélectionner un média existant avec `react-native-image-picker`.
  - Boutons de filtre, de flash et de retournement de caméra.
  - Modal de saisie pour ajouter une légende et téléverser sur Cloudinary puis insérer l'entrée dans Supabase.
