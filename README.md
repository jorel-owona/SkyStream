# StreamSky 🚀

Bienvenue sur le dépôt de **StreamSky**, une application sociale React Native Premium (v0.85) conçue pour offrir une expérience fluide, immersive et ultra-responsive inspirée de TikTok.

---

## 📱 Fonctionnalités Principales

- **Design Premium UI/UX** : Thème sombre sophistiqué, gradients HSL vibrants (cyan `#00F2FE` et magenta `#D12EAA`), animations soignées, et typographies premium.
- **Double Authentification** :
  - **Firebase Authentication** : Utilisé comme maître absolu de l'authentification (Google Sign-In réel et mode invité dynamique).
  - **Supabase Database** : Stockage PostgreSQL pour l'application. Les données utilisateur sont associées au projet en utilisant le `uid` Firebase unique comme clé d'identification (`user_id`).
- **Caméra Native Réelle & Galerie** : Enregistrement vidéo en direct (audio + vidéo) via `react-native-vision-camera`, et sélection de médias depuis la galerie du téléphone via `react-native-image-picker`.
- **Hébergement des Médias (Cloudinary)** : Les vidéos et images capturées sont stockées et optimisées dynamiquement via Cloudinary.
- **Feed Social Interactif** : Lecture continue, double-clic pour liker, favoris, commentaires, et partage.
- **Raccourcis de Publication rapides (TikTok style)** :
  - **Profil** : Raccourcis directs "Publier" et "Story" sous les statistiques utilisateur.
  - **Messages** : Ligne horizontale d'amis connectés précédée de l'icône **"Votre Story"** (avec badge `+`) pour publier en 1 clic.
  - **Ami(e)s** : Raccourci de création de Story ("Créer") en tête du carrousel de Stories.

---

## 🛠 Structure du Projet

Voici l'organisation de l'application dans `/src` :

```
StreamSky/
 ├── supabase_schema.sql      # Script de création des tables PostgreSQL Supabase
 └── src/
      ├── AppNavigator.tsx    # Routage principal (BottomTabNavigator) & Modales
      ├── /context
      │    └── AuthContext.tsx # Gestion globale d'authentification (Firebase + Invité) et états partagés
      ├── /libs
      │    └── supabase.ts    # Initialisation et configuration du client Supabase
      ├── /services
      │    ├── CloudinaryService.ts # Service d'optimisation multimédia
      │    └── SupabaseService.ts   # Service CRUD Supabase (Vidéos, Stories éphémères)
      ├── /theme
      │    ├── colors.ts      # Définition des tokens de couleur de la charte graphique
      │    └── typography.ts  # Définition typographique Premium
      └── /screens
           ├── LandingScreen.tsx  # Écran de connexion (Google / Invité)
           ├── HomeScreen.tsx     # Flux TikTok (défilement vertical infini)
           ├── FriendsScreen.tsx  # Flux d'amis avec stories horizontales interactives
           ├── MessagesScreen.tsx # Boîte de messagerie et raccourcis de publication rapide
           ├── ProfileScreen.tsx  # Profil utilisateur avec onglet Publications/Favoris/J'aime
           └── CameraScreen.tsx   # Enregistrement vidéo natif, filtres et téléversement
```

---

## ⚡ Initialisation de la Base de Données (Supabase)

Pour configurer votre base de données PostgreSQL sur Supabase :
1. Rendez-vous sur votre tableau de bord [Supabase](https://supabase.com).
2. Ouvrez l'**SQL Editor** de votre projet.
3. Copiez le contenu du fichier [supabase_schema.sql](file:///home/jorel/Bureau/StreamSky/supabase_schema.sql) situé à la racine du projet et exécutez-le.
4. (Optionnel) Ajustez vos politiques de sécurité (RLS) dans le tableau de bord Supabase si nécessaire. Par défaut, RLS est désactivé sur ces tables pour faciliter les tests.

---

## 🚀 Installation & Lancement

1. Clonez ce dépôt.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur Metro de développement :
   ```bash
   npx react-native start --reset-cache
   ```
4. Lancez l'application sur Android :
   ```bash
   npx react-native run-android
   ```
5. Lancez l'application sur iOS (Mac requis) :
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```
