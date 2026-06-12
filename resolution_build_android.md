# Résolution du problème de Build Android (Gradle Cache)

Lors des précédentes tentatives de lancement de l'application via `npx react-native run-android`, une erreur `java.nio.file.NoSuchFileException` est apparue concernant le fichier `settings-plugin.jar` dans le dossier `~/.gradle/caches`.

## 🔍 Explication du problème

Cette erreur survient lorsque le cache de **Gradle** (l'outil de compilation d'Android) est corrompu ou partiellement supprimé pendant qu'un processus en arrière-plan (le Gradle Daemon) tente d'y accéder. Comme nous avions supprimé le dossier de cache manuellement pour libérer de l'espace disque, le Daemon toujours actif s'est retrouvé "perdu", cherchant des fichiers qui n'existaient plus, provoquant l'échec de la compilation.

## 🛠 Méthode de résolution utilisée

Pour corriger ce problème définitivement, il fallait "repartir de zéro" proprement avec Gradle. J'ai utilisé la méthode suivante :

1. **Arrêt du processus en arrière-plan (Daemon)** : Nous devons stopper tous les processus Gradle qui pourraient bloquer la suppression des fichiers.
2. **Suppression complète et propre des caches** : Une fois le processus arrêté, on peut supprimer en toute sécurité le dossier global `~/.gradle/caches` et le dossier local `android/.gradle`.
3. **Nettoyage du build (Clean)** : Demander à Gradle de nettoyer le répertoire de compilation local pour éviter tout conflit avec d'anciens fichiers.
4. **Relance de l'application** : En relançant la commande standard, Gradle télécharge à nouveau tout ce dont il a besoin proprement.

## 💻 Les commandes exécutées

Voici la ligne de commande exacte que j'ai exécutée à la racine de votre projet pour appliquer cette méthode :

```bash
cd android && ./gradlew --stop && rm -rf ~/.gradle/caches && rm -rf .gradle && ./gradlew clean
```

### Détail des actions :
- `cd android` : On se place dans le dossier contenant le code source Android.
- `./gradlew --stop` : **Arrête** tous les processus Gradle en cours d'exécution.
- `rm -rf ~/.gradle/caches` : **Supprime** le cache global de Gradle sur votre ordinateur (ce qui a aussi libéré beaucoup d'espace !).
- `rm -rf .gradle` : **Supprime** le cache local spécifique à ce projet.
- `./gradlew clean` : **Nettoie** les fichiers de build (comme le dossier `app/build`).

Une fois cette commande terminée avec succès, la commande classique `npx react-native run-android` fonctionne à nouveau normalement, forçant le téléchargement d'un cache tout neuf et sain !
