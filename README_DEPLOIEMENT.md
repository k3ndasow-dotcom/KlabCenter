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

## 8. Sauvegarde, archivage et mouvements de stock

L’onglet Paramètres permet maintenant de télécharger une sauvegarde JSON complète et de restaurer un fichier KlabCenter après confirmation. Les produits ne sont plus supprimés : ils sont archivés afin de préserver l’historique. Une vente ayant déjà reçu un règlement est protégée contre la modification. Les ventes de biens et les réceptions de commandes alimentent le journal `kc_mouvements_stock`.

Après cette mise à jour, republiez `firestore.rules` et assurez-vous que `kc_mouvements_stock` est autorisé pour les rôles concernés.

Une commande reste d’abord en brouillon. Le bouton « Valider & payer » crée une sortie dans la trésorerie sous forme de dépense liée à la commande. La réception augmente ensuite le stock. Le bouton « Annuler » conserve l’historique, neutralise la dépense si elle existe et retire du stock les quantités déjà réceptionnées. Les commandes annulées ne sont pas supprimées physiquement afin de préserver la traçabilité.

## 9. Limite de sécurité connue — suppression par un employé
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


## 10. Version finale 2026.08

La version finale affiche l’état de synchronisation dans l’en-tête. « En ligne · Synchronisé » signifie que la dernière écriture a été confirmée par Firebase. « Synchronisation… » indique qu’une écriture est en cours. « Échec de synchronisation » signifie que la donnée a pu rester localement sur l’appareil et qu’il faut reconnecter l’appareil avant de fermer la page.

Le propriétaire doit télécharger régulièrement une sauvegarde JSON depuis Paramètres et conserver plusieurs copies hors de l’appareil. Une restauration remplace les données du compte après confirmation ; elle doit donc être précédée d’une sauvegarde récente.

Les commandes validées créent une sortie de trésorerie liée à la commande. Les réceptions modifient le stock. Une annulation conserve la trace historique, inverse les quantités reçues et neutralise la dépense liée lorsqu’elle existe.

Pour publier une nouvelle version, remplacer `index.html`, `sw.js` et ce fichier dans GitHub Pages. Après publication, fermer puis rouvrir l’application installée et vérifier que le badge indique « En ligne · Synchronisé ».

**Règle d’exploitation :** ne jamais supprimer le projet Firebase, ne jamais recréer la base Firestore et ne jamais changer le `projectId` sans sauvegarde et validation préalable.


## 11. Règle des commandes multi-lignes

Un même bien ne peut apparaître qu’une seule fois dans une même commande fournisseur. Si le bien est déjà sélectionné sur une autre ligne, l’application refuse la sélection. Le contrôle est également répété au moment de l’enregistrement pour éviter les doublons issus d’une saisie manuelle ou d’une ancienne version. Le bien reste disponible dans une commande future.


## 12. Unités d’achat et conditionnements

Les biens peuvent désormais être achetés à l’unité, au paquet, au carton, à la boîte, au lot, au sac, au rouleau ou à la bouteille. Dans la fiche Produit, renseignez l’unité d’achat et le nombre d’unités de stock contenues dans un conditionnement.

Exemple : si un carton contient 12 cahiers, choisissez `Carton` et indiquez `12`. Une commande de 5 cartons sera affichée comme 5 cartons, tandis que la réception ajoutera 60 unités au stock. Les ventes restent exprimées en unités de stock afin d’éviter les incohérences.

Les anciennes fiches produits restent compatibles : lorsqu’aucun conditionnement n’est défini, KlabCenter utilise `Unité` avec un coefficient de 1. Les services ne possèdent aucun stock et ne sont pas concernés par les conditionnements.

Lors de l’annulation d’une commande, le coefficient mémorisé dans la ligne de commande est utilisé pour reprendre exactement les unités ajoutées au stock.


## 13. Unité de stock et conditionnement d’achat

La fiche Produit distingue maintenant deux notions : **l’unité de stock**, qui est l’unité réellement comptée dans le stock et les ventes, et le **conditionnement d’achat**, qui est l’unité utilisée pour commander auprès du fournisseur.

Exemple pour le papier : l’unité de stock est `Paquet`, le conditionnement d’achat est `Carton`, et le nombre d’unités de stock dans le conditionnement est `5`. Une commande de `2 Cartons` représente donc `10 Paquets` en stock. Les 500 feuilles d’une rame ne sont pas gérées si l’activité ne vend pas les feuilles séparément.

Exemple pour les cahiers : l’unité de stock est `Cahier`, le conditionnement d’achat est `Paquet`, et le nombre d’unités de stock dans le conditionnement est `12`. Une commande de `3 Paquets` représente donc `36 Cahiers` en stock.

Dans la commande, l’application affiche l’unité achetée, l’équivalence en unités de stock et le prix par unité achetée. Lors de la réception, la quantité saisie est exprimée dans le conditionnement d’achat ; le stock est augmenté automatiquement avec la formule suivante :

```text
unités ajoutées au stock = quantité reçue × unités de stock par conditionnement
```

Les lignes de commande mémorisent leur unité de stock et leur facteur de conversion. Cette mémorisation protège l’historique : une modification ultérieure de la fiche Produit ne change pas la conversion déjà utilisée par une commande existante. Les anciennes fiches sans unité de stock explicite restent compatibles et utilisent `Unité` par défaut.


## 14. Saisie rapide et guidée

Le formulaire Produit place automatiquement le curseur sur le type lors d’une nouvelle création. Après le choix de `Bien`, le curseur revient au nom, puis la touche `Entrée` fait progresser la saisie vers la catégorie, l’unité de stock, le conditionnement d’achat, le nombre d’unités, le seuil et les quantités initiales. À la fin, le formulaire est envoyé automatiquement.

Dans une commande, le curseur commence par le fournisseur. Après sa sélection, il passe au premier bien. Pour un bien déjà présent au catalogue, la séquence est : produit, quantité achetée, prix d’achat. Après la saisie du prix et la validation par `Entrée`, une nouvelle ligne est créée et le curseur passe directement au produit suivant. Pour un nouveau bien, la séquence est : nom, catégorie, unité de stock, conditionnement d’achat, nombre d’unités, quantité et prix.

Cette navigation fonctionne avec la touche `Entrée` sur ordinateur et avec la validation du clavier mobile. Les boutons classiques restent disponibles pour les utilisateurs qui préfèrent la souris ou le toucher. Les contrôles anti-doublon et les validations obligatoires restent actifs.


## 15. Assistant de saisie étape par étape

Les formulaires Produit et Commande fonctionnent maintenant comme des assistants. Dans Produits, une seule étape est visible à la fois : nature de l’article, nom, catégorie, prix, unité de stock, conditionnement d’achat, nombre d’unités, seuil et quantités initiales. Le choix de `Bien` ouvre automatiquement le parcours adapté ; les champs de service liés au stock ne sont pas proposés.

Dans Commandes, une seule ligne et une seule étape sont actives à la fois. Pour un bien existant, le parcours est `Produit → Quantité → Prix`. Pour un nouveau bien, le parcours est `Nom → Catégorie → Unité de stock → Conditionnement → Nombre d’unités → Quantité → Prix`. La validation du prix crée directement la ligne suivante et positionne le curseur sur son premier champ.

La touche `Entrée` avance dans le parcours. Dans une commande, `Ctrl + Entrée` sur ordinateur valide directement la commande complète ; sur Mac, utilisez `Cmd + Entrée`. Les boutons restent présents pour les utilisateurs qui préfèrent le clic ou le toucher. Le contrôle des doublons, les champs obligatoires et les conversions de stock restent actifs.


## 16. Navigation mobile avec Retour et Continuer

Les assistants Produit et Commande disposent maintenant de boutons visibles **← Retour** et **Continuer →**. Le bouton Retour revient à l’étape précédente sans effacer les valeurs déjà saisies. Le bouton Continuer valide l’étape active ; si un champ obligatoire est vide, le téléphone affiche la correction attendue au lieu de perdre la saisie.

À la dernière étape, le bouton Continuer est remplacé par la validation ou par l’ajout de la ligne suivante selon le parcours. Cette navigation ne dépend plus de la présence d’un clavier physique et convient à l’écran tactile du téléphone.


## 17. Interface simplifiée

La saisie Produit a été simplifiée : les informations principales sont désormais le nom, la nature, la catégorie, le prix et, pour un bien, l’unité suivie en stock, le mode d’achat et le nombre d’unités dans un achat. Le seuil d’alerte, le stock initial et les entrées manuelles sont regroupés dans **Options avancées du stock** et peuvent rester inchangés pour une première saisie.

La saisie Commande affiche le fournisseur et une ligne simple avec le bien, la quantité et le prix. Les informations de conditionnement d’un nouveau bien sont regroupées dans une zone facultative. Les observations sont également facultatives. La logique de conversion, les contrôles anti-doublon, les réceptions et les mouvements de stock restent inchangés en arrière-plan.

Pour le papier, l’utilisation courante se résume à : créer le produit `Papier rame A4`, choisir `Paquet` comme unité suivie en stock, choisir `Carton` dans `Achat en`, saisir `5` dans `Unités dans 1 achat`, puis enregistrer. Dans une commande, choisir le fournisseur, choisir le papier, saisir la quantité de cartons et le prix d’un carton.


## 18. Saisie pédagogique pour un assistant

L’interface explique désormais chaque notion directement avant ou sous le champ concerné. **Unité suivie en stock** signifie ce qui est compté et vendu. Pour le papier, il faut choisir `Paquet`, et non `Feuille`, si l’activité ne vend pas les feuilles séparément. **Le fournisseur vous vend en** désigne le conditionnement réellement commandé, par exemple `Carton`. **Unités dans 1 achat** indique combien d’unités de stock contient ce conditionnement : un carton de cinq paquets correspond à `5`.

Le résumé affiché sous les champs reformule automatiquement la règle. Par exemple : `Vous stockez des Paquets. 1 Carton acheté = 5 Paquets en stock.` Le prix de vente est expliqué comme le prix auquel l’entreprise vend une unité de stock ; il ne faut pas y saisir le prix du fournisseur.

Dans une commande, le prix est intitulé **Prix d’achat pour 1 Carton** ou **Prix d’achat pour 1 Paquet**, selon le conditionnement enregistré. L’application précise qu’il faut saisir le prix d’un conditionnement acheté, et non le total général. Après la saisie de la quantité, un aperçu indique le résultat attendu : `Vous commandez 2 Cartons. Après réception : 10 Paquets en stock.`

La liste des biens affiche également la conversion avant la sélection, par exemple : `Papier rame A4 · 1 Carton = 5 Paquets`. Ces explications sont destinées à permettre à un assistant de travailler sans connaître les termes techniques de l’application.


## 19. Démarrage avec les données réelles

Le propriétaire peut maintenant ouvrir **Paramètres → Démarrer avec les données réelles**. L’application demande d’abord de télécharger une sauvegarde JSON, puis demande une seconde confirmation avant d’effacer les données opérationnelles actuelles : clients, produits, services, ventes, dépenses, factures, fournisseurs, commandes, mouvements de stock et solde de trésorerie initial.

Les paramètres de l’entreprise, les formules de calcul, la structure Firebase, les comptes employés et les règles de sécurité ne sont pas supprimés. Cette opération doit être utilisée uniquement lorsque toutes les données présentes sont des essais. La sauvegarde téléchargée permet de revenir en arrière avec **Restaurer une sauvegarde**.

Les catégories sont maintenant séparées. Les biens proposent notamment `Papeterie`, `Librairie`, `Fournitures bureau`, `Fournitures scolaires`, `Électroniques` et `Consommables imprimantes`. Les services proposent notamment `Documents & CV`, `Photographie`, `Maintenance`, `Formation`, `Installation`, `Assistance informatique` et `Impression`. Ainsi, `Maintenance` n’est plus proposée lors de la création d’un bien et un service ne demande jamais de stock.


## 20. Produits vendus à l’unité et achetés par paquet

Pour un article comme `Enveloppes A4`, choisissez `Enveloppe` comme **unité suivie en stock** et `Paquet` comme **unité d’achat**. Le prix de vente est le prix d’une enveloppe ; le prix d’achat dans une commande est le prix d’un paquet. Si le nombre d’enveloppes dans le paquet est inconnu, laissez le contenu vide : l’article peut tout de même être enregistré et commandé.

À la réception, KlabCenter demande d’abord le nombre de paquets réellement reçus, puis, si nécessaire, le nombre d’enveloppes contenues dans un paquet après comptage réel. Exemple : 4 paquets à 30 000 GNF, avec 100 enveloppes par paquet, ajoutent 400 enveloppes au stock et enregistrent 120 000 GNF de dépense. Le contenu `100` est alors mémorisé dans la fiche Enveloppes A4 et sera réutilisé automatiquement dans les prochaines commandes et réceptions.

Le stock déjà enregistré avant la découverte du contenu n’est pas converti silencieusement. Toute conversion d’un ancien stock doit faire l’objet d’un ajustement explicite afin de préserver l’historique.


## 21. Logo sur commandes et factures

Le fichier `logo-klabcenter.png` doit rester dans le même dossier que `index.html`. Il est utilisé dans l’en-tête des bons de commande, dans l’aperçu des factures imprimées et dans les factures PDF téléchargées. Les coordonnées enregistrées dans Paramètres apparaissent à côté du logo.

Lors d’une publication GitHub Pages, téléversez donc également `logo-klabcenter.png`. Le service worker le met en cache pour permettre l’affichage du logo même après l’installation de la PWA.


## 22. Correction de validation des commandes multi-articles

Après l’ajout automatique d’une ligne suivante, la ligne vide de préparation ne doit pas empêcher l’enregistrement des lignes déjà complétées. La validation métier ignore désormais cette ligne vide et vérifie uniquement les articles réellement sélectionnés. Une commande contenant plusieurs biens peut donc être enregistrée après la saisie du dernier prix, sans devoir remplir ou supprimer une ligne supplémentaire.


## 23. Signature des documents

Les factures et les bons de commande affichent en bas à droite :

> Signé : Le PDG
> Mamadou Kenda SOW

Cette signature apparaît dans l’aperçu, l’impression directe et le PDF téléchargé.
