# StreamSky 🚀

Bienvenue sur le dépôt de **StreamSky**, une application sociale React Native Premium conçue pour offrir une expérience fluide et immersive semblable à TikTok.

## 📱 Fonctionnalités Actuelles

- **Design Premium UI/UX** : Intégration d'un thème sombre professionnel inspiré des "skills" de design avancés (Glassmorphism, typographies Pro Max, couleurs vibrantes basées sur le logo).
- **Navigation Fluide** : Un menu inférieur avec `react-navigation` incluant des icônes vectorielles (`FontAwesome5`).
- **Caméra Intégrée** : Une fonctionnalité de capture utilisant `react-native-vision-camera` (boostée par nitro-modules), avec gestion des permissions sur Android.
- **Profil Utilisateur** : Une page de profil complète incluant les statistiques de l'utilisateur, la biographie et une structure en grille pour les vidéos.

## 🛠 Structure du Projet

Voici l'organisation principale du code source (`/src`) :

```
/src
 ├── /screens
 │    ├── HomeScreen.tsx    # Fil d'actualité (Pour Vous), gestion des actions (Likes, Commentaires, Partages)
 │    ├── ProfileScreen.tsx # Page de profil utilisateur avec ses statistiques et ses vidéos
 │    └── CameraScreen.tsx  # Interface d'enregistrement vidéo avec react-native-vision-camera
 ├── /theme
 │    ├── colors.ts         # Tokens de couleurs globaux (Fond sombre, accents Cyan et Rose)
 │    └── typography.ts     # Configuration typographique Premium (Tailles, Graisses)
 └── AppNavigator.tsx       # Configuration du BottomTabNavigator (Routage principal)
```

## ⏳ Ce qu'il reste à faire (Roadmap)

Le projet est configuré avec Firebase (`@react-native-firebase/app`, `auth`, `storage`), mais l'implémentation logique de la base de données n'est pas encore terminée.

**À implémenter :**
1. **Firebase Authentication** : Permettre aux utilisateurs de créer un compte et de se connecter.
2. **Firebase Firestore / Storage** :
   - Sauvegarder les vidéos enregistrées par la caméra vers Firebase Storage.
   - Créer une base de données Firestore pour lier les URLs des vidéos aux profils des utilisateurs.
   - Remplacer le "Lecteur Vidéo StreamSky" (placeholder dans `HomeScreen`) par un véritable composant de lecture (`react-native-video`) qui lit les flux depuis Firebase.
3. **Système de commentaires et de likes** en temps réel connecté à Firestore.

## 🚀 Installation & Lancement

1. Clonez ce dépôt.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancer l'application sous Android :
   ```bash
   npx react-native run-android
   ```
   *(Assurez-vous d'avoir un téléphone branché en ADB ou un émulateur ouvert)*
