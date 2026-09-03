# Correctif du parcours de commande KlabCenter

## Comportement corrigé

Une commande au statut **Validée** reste désormais modifiable tant qu’aucune quantité n’a été réceptionnée. Le bouton **« Modifier / ajouter »** est disponible dans l’historique. La commande peut donc être saisie progressivement : après validation d’un premier article, il est possible de rouvrir la même commande, d’ajouter le deuxième ou le troisième article, puis d’ajuster la quantité ou le prix d’un seul article. Les autres lignes déjà saisies sont rechargées et conservées, sans création d’une nouvelle commande ni effacement des données. Le formulaire conserve l’ajout de lignes avec **« + Ajouter un bien »**, et toutes les lignes sont affichées simultanément pendant la modification.

Lorsqu’une commande validée est modifiée, l’article ajouté ou modifié est intégré au total de la commande. La dépense liée au paiement est automatiquement synchronisée avec ce nouveau total afin d’éviter un écart entre la commande et la trésorerie. Une commande validée mais non réceptionnée reste donc ouverte pour les ajustements de quantité et de prix.

Les commandes **réceptionnées**, **partiellement réceptionnées** ou **annulées** restent protégées contre l’édition, car leur modification pourrait fausser le stock ou les opérations déjà enregistrées.

## Installation

Remplacer les fichiers correspondants sur l’hébergement GitHub Pages avec le contenu de cette archive, puis attendre le rafraîchissement du service worker. Le cache PWA a été incrémenté en version `klabcenter-v29-command-edit` afin de forcer le chargement du correctif.

## Vérifications réalisées

La syntaxe JavaScript du fichier HTML a été validée. Un test métier vérifie également l’édition d’une commande validée, l’ajout d’un second article, le recalcul du total, la synchronisation du paiement et le verrouillage après réception.
