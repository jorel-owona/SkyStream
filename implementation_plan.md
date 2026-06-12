# Plan d'implémentation - StreamSky (Authentification, Vidéos Cloudinary, Favoris et Correction de bugs)

Ce plan décrit les modifications techniques pour résoudre les crashs de l'application, intégrer vos liens Cloudinary, ajouter l'authentification Google réelle avec Firebase, rendre la personnalisation du profil fonctionnelle et ajouter la gestion complète des favoris (bookmarks/likes).

---

## User Review Required

> [!IMPORTANT]
> **1. Configuration de l'authentification Google (Firebase)**
> - Pour que l'authentification Google réelle fonctionne sur Android, nous devons installer le paquet `@react-native-google-signin/google-signin`.
> - **Web Client ID** : Firebase requiert un ID client Web (Web Client ID) pour lier le jeton Google ID à Firebase Auth. Comme votre fichier [google-services.json](file:///home/jorel/Bureau/StreamSky/android/app/google-services.json) n'a pas encore de clé `oauth_client` configurée, nous allons déclarer une variable modifiable dans [AuthContext.tsx](file:///home/jorel/Bureau/StreamSky/src/context/AuthContext.tsx).
> - Si les services Google Play ne sont pas configurés ou s'il y a une erreur d'ID client, l'application affichera un message explicatif clair et passera en mode simulation (avec le compte de test `@jorel_owona`) pour que vous puissiez tester le reste de l'application sans aucun blocage ou crash.
>
> **2. Vidéos HLS de Cloudinary (.m3u8)**
> - Le lien vidéo que vous avez fourni (`https://res.cloudinary.com/dwfvxelne/video/upload/f_auto,q_auto/v1781006675/introduction_gewbzq.m3u8`) est un flux HLS. Nous allons configurer le lecteur `react-native-video` pour qu'il le charge correctement et éviter les crashs sur Android.
> - Nous utiliserons l'image fournie (`https://res.cloudinary.com/dwfvxe1ne/image/upload/q_auto/f_auto/v1781000638/1360490_gdwql0.jpg`) comme image de couverture (thumbnail) pour cette vidéo dans le feed et la grille du profil.

---

## Open Questions

> [!NOTE]
> Nous avons détecté que les crashs ("ça sort directement") sur la page d'accueil (HomeScreen) peuvent être causés par deux facteurs :
> 1. Un crash natif du lecteur de vidéo `react-native-video` lorsqu'il rencontre un problème de chargement sans gestionnaire d'erreur `onError`.
> 2. Une redirection intempestive d'authentification si le statut de l'utilisateur change trop vite ou s'il y a un composant non géré.
>
> Nous allons ajouter des gestionnaires `onError` robustes sur les composants `<Video>` pour capter ces erreurs et empêcher la fermeture forcée de l'application.

---

## Proposed Changes

### [Dependencies & Configuration]

#### [MODIFY] [package.json](file:///home/jorel/Bureau/StreamSky/package.json)
- Ajouter la dépendance : `"@react-native-google-signin/google-signin": "^13.1.0"` (ou version compatible avec RN 0.85).

---

### [Authentication & State Management]

#### [MODIFY] [AuthContext.tsx](file:///home/jorel/Bureau/StreamSky/src/context/AuthContext.tsx)
- Importer `GoogleSignin` de `@react-native-google-signin/google-signin`.
- Initialiser `GoogleSignin.configure({ webClientId: 'VOTRE_WEB_CLIENT_ID' })`.
- Mettre en place la méthode `loginWithGoogle` réelle :
  1. Appeler `GoogleSignin.hasPlayServices()`.
  2. Récupérer le jeton avec `GoogleSignin.signIn()`.
  3. Créer les identifiants Firebase avec `auth.GoogleAuthProvider.credential(idToken)`.
  4. Se connecter à Firebase avec `auth().signInWithCredential(...)`.
- Ajouter un état global partagé pour les favoris et likes :
  - `bookmarkedIds`: tableau d'identifiants de vidéos mis en favoris.
  - `likedIds`: tableau d'identifiants de vidéos aimés.
  - Fonctions `toggleBookmark(videoId)` et `toggleLike(videoId)`.
- Ajouter la fonction `updateProfile(displayName, bio, photoURL)` pour mettre à jour les infos du profil en mémoire (et dans Firebase si connecté).

---

### [Vidéos & Services]

#### [MODIFY] [CloudinaryService.ts](file:///home/jorel/Bureau/StreamSky/src/services/CloudinaryService.ts)
- Ajouter votre vidéo HLS et son image de couverture (thumbnail) en tête de liste des vidéos (`sampleVideos`) :
  - URL Vidéo : `https://res.cloudinary.com/dwfvxelne/video/upload/f_auto,q_auto/v1781006675/introduction_gewbzq.m3u8`
  - URL Image : `https://res.cloudinary.com/dwfvxe1ne/image/upload/q_auto/f_auto/v1781000638/1360490_gdwql0.jpg`
- Ajouter les champs optionnels `thumbnailUrl` dans l'interface `VideoItem`.

---

### [Screens & User Interface]

#### [MODIFY] [HomeScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/HomeScreen.tsx)
- Connecter le bouton Bookmark et Like aux fonctions partagées `toggleBookmark` et `toggleLike` d' `AuthContext`.
- Ajouter la propriété `onError` au composant `<Video>` pour éviter tout crash si un flux réseau échoue :
  `onError={(error) => console.log("Video error:", error)}`
- Rendre fonctionnel l'icône de caméra en haut à gauche (`videocam-outline`) en lui associant l'ouverture de la caméra.

#### [MODIFY] [FriendsScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/FriendsScreen.tsx)
- Ajouter la propriété `onError` sur `<Video>` pour la sécurité contre les plantages natifs.
- Connecter les interactions de Like/Bookmark au state global.

#### [MODIFY] [ProfileScreen.tsx](file:///home/jorel/Bureau/StreamSky/src/screens/ProfileScreen.tsx)
- **Personnalisation du Profil (Modifier le profil)** :
  - Créer un modal dynamique en plein écran "Modifier le profil" qui s'ouvre au clic sur "Modifier le profil" ou sur le bouton "+" de l'avatar.
  - Ajouter des champs texte pour le nom (`displayName`) et la bio (`bio`), ainsi qu'une sélection d'avatars prédéfinis premium.
  - Enregistrer les modifications via `updateProfile(...)`.
- **Système d'onglets Favoris/Likes interactifs** :
  - Gérer l'état de l'onglet actif (`activeTab`: 'posts' | 'private' | 'bookmarks' | 'likes').
  - **Onglet Vidéos en Favoris** (icône marque-page) : Filtrer et afficher uniquement les vidéos dont l'ID est dans `bookmarkedIds`.
  - **Onglet J'aime** (icône cœur) : Filtrer et afficher uniquement les vidéos aimées (`likedIds`).
  - Gérer le clic sur les vignettes de la grille pour lire la vidéo ou afficher un aperçu.
- **Audit des boutons restants** :
  - Icône d'ajout d'ami (`person-add-outline`) -> affiche un message "Inviter des amis".
  - Icône Instagram -> affiche une alerte.

---

## Verification Plan

### Automated Tests
Nous allons compiler et installer l'application sur le périphérique :
- `npm install` pour installer `@react-native-google-signin/google-signin`.
- `npx react-native run-android` pour recompiler l'application native Android avec le SDK de connexion Google.

### Manual Verification
1. **Validation du non-crash sur la page d'accueil** :
   - Démarrer l'application, aller sur la page d'accueil. Cliquer sur l'icône d'accueil dans la barre du bas et valider que l'application ne s'arrête plus.
   - Vérifier que la vidéo Cloudinary HLS (`introduction_gewbzq.m3u8`) se charge et joue en boucle avec son thumbnail.
2. **Favoris & Likes** :
   - Liker et enregistrer une vidéo sur la page d'accueil (icônes cœur et marque-page).
   - Aller sur le Profil, cliquer sur l'onglet favoris (marque-page) et l'onglet J'aime (cœur), et vérifier que les vidéos s'affichent correctement dans la grille.
3. **Personnalisation du profil** :
   - Cliquer sur "Modifier le profil". Entrer un nouveau nom, une nouvelle bio, valider et vérifier que le profil se met à jour instantanément.
4. **Authentification Google** :
   - Tester le clic sur "Continuer avec Google" sur l'écran d'accueil.
