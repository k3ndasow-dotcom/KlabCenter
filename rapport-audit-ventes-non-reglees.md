# Audit KlabCenter — ventes non réglées

**Objet.** Vérification de la gestion des ventes non réglées et mise en cohérence avec un suivi comptable des créances clients. **Projet audité :** `KlabCenter-PWA-PRO-controle-employes.zip`.

> Je suis une IA et non un professionnel comptable agréé. Cette analyse constitue une revue technique et comptable de l’application ; le paramétrage fiscal définitif, notamment la TVA et les comptes détaillés, doit être validé par votre comptable en fonction du régime applicable à l’entreprise.

## Conclusion exécutive

Le constat initial est confirmé : la logique d’origine ne gérait pas correctement les ventes non réglées. Une vente à crédit était enregistrée avec un champ binaire `paye`, mais aucun règlement distinct n’était créé. Le fait de passer ce champ à « Oui » pouvait augmenter artificiellement la trésorerie sans date, montant, mode d’encaissement ni preuve de règlement.

La correction introduite modélise désormais les règlements comme des événements séparés rattachés à chaque vente. Une vente comptant génère un règlement automatique à sa date. Une vente à crédit génère une créance et ne modifie pas la trésorerie tant qu’un règlement n’est pas saisi. Les règlements partiels ou complets sont enregistrés depuis l’onglet **Trésorerie**, avec la date, le montant et le mode d’encaissement.

## Anomalies constatées dans la version d’origine

| Zone | Comportement d’origine | Risque comptable |
|---|---|---|
| Vente à crédit | Stockage d’un simple booléen fonctionnel `paye` | Impossible de distinguer facture, encaissement, règlement partiel et solde restant |
| Trésorerie | `creditsRegles()` ajoutait le total de la vente lorsque `paye === 'Oui'` | Trésorerie potentiellement fictive, sans mouvement de caisse ou de banque |
| Créances | Calcul basé sur `modePaiement === 'Crédit'` et `paye !== 'Oui'` | Pas de lettrage ni de suivi par règlement |
| Paiements partiels | Non prévus | Une créance ne pouvait pas être soldée progressivement |
| Export Excel | Colonnes « Mode de paiement » et « Payé » seulement | Export insuffisant pour un rapprochement comptable |
| Factures | Émission indépendante des ventes, sans lien automatique de règlement | Risque de doublon ou de suivi incomplet entre facture, vente et paiement |

## Traitement comptable cible

Dans le référentiel SYSCOHADA révisé, le compte client retrace les créances issues des ventes et est crédité lors des règlements reçus ; le compte de produits est crédité lors de la vente.[1] Le principe à reproduire dans l’application est donc le suivant :

| Événement | Débit | Crédit | Effet dans KlabCenter |
|---|---|---|---|
| Vente à crédit | Client — compte 411, pour le montant dû | Compte de vente de classe 7, et TVA collectée si applicable | CA enregistré, créance créée, trésorerie inchangée |
| Encaissement partiel | Caisse ou compte financier correspondant | Client — compte 411 | Trésorerie augmentée du seul montant encaissé, créance diminuée du même montant |
| Encaissement total | Caisse ou compte financier correspondant | Client — compte 411 | Solde client ramené à zéro |
| Vente comptant | Caisse / banque / monnaie électronique | Compte de vente de classe 7, et TVA si applicable | CA et trésorerie augmentent simultanément |

Le plan de comptes précis doit être adapté à la nature de l’opération et au régime fiscal. Pour une activité mixte de biens et services, la ventilation des produits de classe 7 doit notamment distinguer les catégories pertinentes ; la référence consultée rappelle l’usage de comptes de ventes distincts pour marchandises et prestations.[2]

## Corrections appliquées dans le projet

Le fichier applicatif principal `index.html` a été corrigé. Chaque vente peut maintenant contenir un tableau `reglements` avec les champs `id`, `date`, `montant` et `modePaiement`. Les fonctions de calcul utilisent désormais `montantRegle(v)` et `resteVente(v)` plutôt que le seul champ historique `paye`.

La trésorerie agrège exclusivement les règlements effectivement tracés par mode d’encaissement. Le bloc « Créances clients » calcule le total des restes dus, y compris les règlements partiels. Un formulaire de saisie a été ajouté dans **Trésorerie** ; il interdit un montant supérieur au solde de la vente et met à jour automatiquement le statut de règlement.

Les ventes comptant historiques sans tableau `reglements` restent compatibles : elles sont considérées encaissées à leur date et selon leur mode existant. En revanche, les anciennes ventes à crédit marquées « Oui » ne sont pas automatiquement transformées en encaissement, car la date, le montant et le mode de règlement ne peuvent pas être déduits de manière fiable. Elles apparaîtront comme créances à rapprocher et devront être régularisées manuellement depuis **Trésorerie**.

L’export Excel a été enrichi avec les colonnes **Chiffre d’affaires**, **Réglé**, **Reste dû**, **Mode initial**, **Statut** et le détail des règlements. Le contrôle syntaxique JavaScript a été exécuté avec succès après modification.

## Procédure de régularisation des historiques

Pour chaque ancienne vente à crédit déjà payée, il faut retrouver la preuve disponible — reçu, relevé Orange Money, relevé MTN Mobile Money, relevé bancaire ou cahier de caisse — puis saisir un règlement avec sa date réelle, son montant réel et son mode réel. Pour une vente seulement partiellement payée, saisir uniquement le montant effectivement reçu ; le solde restera en créance.

Pour les créances anciennes dont le recouvrement est incertain, il ne faut pas les marquer artificiellement comme réglées. Elles doivent rester identifiées, faire l’objet d’une relance ou d’une analyse de recouvrabilité et, si nécessaire, être traitées comptablement selon l’avis du professionnel chargé des comptes. Le SYSCOHADA distingue notamment les créances litigieuses ou douteuses dans la classe des clients et comptes rattachés.[1]

## Livrables et sauvegarde

Le projet corrigé est fourni dans l’archive jointe. Une copie de sauvegarde de la version originale a été conservée sous `index.html.audit-backup` dans le dossier de travail, afin de permettre un retour arrière avant déploiement.

## Références

[1]: https://plan-comptable-ohada.com/ancienne-norme-2001/compte/41.html "Plan comptable OHADA — Compte 41 Clients et comptes rattachés"

[2]: https://www.compta-online.com/la-comptabilisation-des-ventes-ao2647 "Compta Online — Comment comptabiliser les ventes de l’entreprise"

[3]: https://plan-comptable-ohada.com/nouvelle-norme-2016/plan-comptable-syscohada.html "Plan comptable OHADA — SYSCOHADA révisé"
