# KlabCenter PRO — déploiement

## 1. Firebase Authentication
Dans Firebase Console → Authentication → Sign-in method :
- activer **Email/Password**.

## 2. Firestore — règles ET index (important)
Publier `firestore.rules` **et** `firestore.indexes.json` (le journal d'activité a besoin de l'index) :

```bash
firebase login
firebase use klab-center
firebase deploy --only firestore:rules,firestore:indexes
```

Si vous préférez la console web : Firestore → Règles → coller le contenu de `firestore.rules` → Publier.
Pour l'index, Firestore → Index → Créer un index composite sur la collection `journal_employes`
(`ownerUid` Croissant + `horodatage` Décroissant) — ou laissez faire : la 1ʳᵉ fois que l'app appelle
cette requête sans index, la console Firebase affiche une erreur avec un lien pré-rempli pour le créer.

## 3. Hébergement — Netlify (recommandé pour ce livrable)
Le dossier `klab/` est un site statique autonome (`index.html`, `manifest.json`, `sw.js`, icônes, `netlify.toml`).

- **Glisser-déposer** : sur app.netlify.com → « Add new site » → « Deploy manually » → déposez le dossier `klab`.
- **Ou en CLI** :
```bash
npm install -g netlify-cli
cd klab
netlify deploy --prod
```
Netlify sert directement `index.html` ; `netlify.toml` désactive la mise en cache agressive de `sw.js` et `manifest.json` pour que les mises à jour arrivent bien chez les utilisateurs.

## 4. Hébergement — Firebase Hosting (alternative)
```bash
firebase init hosting
firebase deploy --only hosting
```
Choisir le dossier `klab` comme dossier public.

## 5. Important — clé apiKey
La clé `apiKey` Firebase présente dans `index.html` est une clé d'identification publique d'application web. La protection des données repose sur Authentication + les règles Firestore. Ne jamais placer de clé privée/service account dans la PWA.

## 6. Employés — accès par rôle, suspension, journal d'activité
Depuis l'onglet **Employés** (visible seulement par le compte propriétaire) :
- **Trésorier** : accès uniquement à l'onglet Trésorerie.
- **Secrétariat** : accès à toutes les saisies — Clients, Produits, Ventes, Dépenses, Factures.
- **Suspendre / Réactiver** : coupe ou restaure temporairement l'accès d'un employé sans supprimer son compte. Un employé suspendu qui tente de se connecter est immédiatement déconnecté avec un message explicite.
- **Retirer l'accès (✕)** : coupure définitive (le compte email/mot de passe subsiste, mais devient un espace vide).
- **Journal d'activité** : les 50 dernières actions (ajout/modification) de vos employés apparaissent en bas de l'onglet Employés, avec nom, rôle, type de donnée et horodatage.

Ceci repose sur deux nouvelles collections Firestore `liens_employes` (champ `suspendu`) et `journal_employes` —
**pensez à redéployer `firestore.rules` et `firestore.indexes.json`** après cette mise à jour (voir §2).

## 7. Module Commandes d’approvisionnement

Le module Commandes utilise deux nouveaux documents de données : `kc_fournisseurs` et `kc_commandes`. Les commandes restent en brouillon jusqu’à leur réception. L’impression ne modifie pas le stock. Le bouton « Réceptionner » demande les quantités réellement reçues, accepte les réceptions partielles et ajoute uniquement ces quantités au champ `entrees` du produit. Après ajout de ce module, republiez impérativement `firestore.rules` depuis Firebase Console ou avec `firebase deploy --only firestore:rules` afin d’autoriser ces deux documents.

## 8. Limite de sécurité connue — suppression par un employé
Les employés n'ont **jamais** de bouton « Supprimer » dans l'interface, et les règles Firestore leur refusent
l'opération `delete`. **Cependant**, chaque type de donnée (clients, produits, ventes…) est stocké comme un
document Firestore unique contenant tout le catalogue en JSON. Techniquement, retirer une ligne de ce JSON
passe par une opération `update` du document (pas un `delete`), que les règles ne peuvent pas inspecter à
l'intérieur d'une chaîne JSON. L'interface empêche donc cela dans l'usage normal de l'application, mais un
employé techniquement averti pourrait théoriquement contourner l'interface (ex. console développeur) pour
modifier le JSON directement. Si vous avez besoin d'une garantie absolue au niveau des règles de sécurité
(et pas seulement de l'interface), il faudrait restructurer le stockage en un document Firestore par élément
(un document par client, par produit, etc.) plutôt qu'un document unique par type — un changement plus
important, à faire savoir si vous le souhaitez.
