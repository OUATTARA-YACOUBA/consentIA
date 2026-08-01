# ConsentIA — Le bouclier numérique du citoyen

ConsentIA est une application mobile qui analyse les contrats et conditions d'utilisation, et alerte le citoyen sur les clauses qui menacent ses droits — **avant** qu'il ne signe. L'analyse s'appuie sur le droit applicable en Côte d'Ivoire.

## Fonctionnalités

- **Scan de documents** — photographiez un contrat papier, l'IA l'analyse en quelques secondes
- **Import de PDF** — analysez un document depuis vos fichiers
- **Analyse juridique** — détection des clauses à risque sur 5 domaines du droit ivoirien
- **Score de protection** — une note claire de 0 à 100 et un verdict
- **Conseils actionnables** — pour chaque risque, une action concrète à mener
- **Alerte immédiate** — signal visuel et sonore en cas de clause dangereuse
- **Écoute vocale** — le rapport lu à voix haute, pour l'accessibilité
- **Export PDF** — générez un rapport à conserver ou à partager
- **Historique sécurisé** — retrouvez vos analyses passées
- **Zéro conservation** — vos documents ne sont jamais stockés

## Domaines juridiques couverts

| Domaine | Référence |
|---|---|
| Données personnelles | Loi n°2013-450 (ARTCI) |
| Bail & habitation | Code de la Construction 2019-576 |
| Travail & emploi | Code du travail 2015-532 |
| Crédit & sûretés | Acte uniforme OHADA |
| Assurance | Code CIMA |

## Sécurité et confidentialité

- **Zéro conservation** : les documents sont analysés en mémoire puis effacés immédiatement
- **Chiffrement** des échanges (HTTPS/TLS) et des données stockées
- **Row Level Security** : chaque utilisateur n'accède qu'à ses propres données
- **Conforme à la loi n°2013-450** relative à la protection des données personnelles

## Stack technique

- **Application** : React Native, Expo (SDK 57), TypeScript, Expo Router
- **Backend** : Supabase (PostgreSQL, Auth, Edge Functions)
- **IA** : analyse via Edge Function sécurisée (clé API jamais exposée côté client)

## Installation

### Prérequis
- Node.js 18 ou supérieur
- Un compte Supabase
- L'application Expo Go ou un development build

### Étapes

1. Cloner le dépôt
```bash
   git clone https://github.com/VOTRE-COMPTE/consentia.git
   cd consentia
```

2. Installer les dépendances
```bash
   npm install
```

3. Configurer les variables d'environnement

   Créez un fichier `.env` à la racine :
EXPO_PUBLIC_SUPABASE_URL=votre_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique_supabase

4. Lancer l'application
```bash
   npx expo start
```

## Structure du projet
consentia/
├── app/ Écrans (Expo Router)
│ ├── (auth)/ Connexion et inscription
│ ├── (tabs)/ Accueil, Scanner, Historique, Profil
│ ├── analyse.tsx Écran d'analyse en cours
│ └── resultat.tsx Résultat de l'analyse
├── components/ Composants réutilisables
├── constants/ Système de design (couleurs, typographie)
├── lib/ Supabase, authentification, validation
└── assets/ Icônes et ressources

## Statut

Version 1.0 — application fonctionnelle et déployable.

## Équipe

Projet développé dans le cadre de la protection numérique du citoyen ivoirien.

---

*ConsentIA — Comprendre avant de signer.*