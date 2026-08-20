# 🗒️ Notes de développement – Carte SIG

# Les évolutions à apporter 

## Le style de la carte

Une carte contient comme éléments obligatoires:
- un titre
- une légende
- une échelle
- les sources et la réalisation

Deux possibilités :
- une carte simple avec les éléments "volants" autour de la carte (comme actuellement)
- une carte plus structurée avec un panneau latéral qui pourrait regrouper tous les éléments necessaires 
 ( voir la https://github.com/anct-carto/superposeur-anct?tab=License-1-ov-file)

## Possibilité de rechercher et filtrer les données 

### Recherches

- Faire une recherche et un zoom sur un territoire : EPT, communes
- Faire une recheche par nom de projet et zoomer dessus

--> dans la fonctionnalité "recherche" il n'y aurait pas de filtrage, toutes les données resertaient affichées mais un zoomsera fait sur la recherche


### Filtres 

- filtrer les thématiques (déjà possible dans la légende)
- filtrer par type de données : Trophées, Vélo, construction? 
- filtrer par années
- filtrer par territoire

--> la fonctionnalité "filtrage" ne représenterait que la donnée filtrée et supprimerait les autres données non concernées par le filtre

## Les informations tabulaires

--> Comment représenter les informations de chaque projet du tableau de données?


--> Choisir les colonnées pertinentes
--> ajouter colonne description_carto
--> type d'aide à ajouter

### Popup (fenêtre)

- Au clic sur un projet, les informations peuvent se retrouver dans une popup (actuellement le cas)

### Panneau latéral

- Au clic sur un projet, les informations peuvent se retrouver dans un panneau latéral --> ce qui prend la forme d'une fiche projet

### Export PDF

Possibilité d'en faire un export de meilleure qualité qu'une capture d'écran


### A FAIRE


-->  [X] Ajouter retour à zoom initial


--> [X] Verifier ligne 43 viry chatillon --> effectivement la ligne avait disparu car territoire_concerne != de la commune

--> [X] ajouter barre de recherche pour filtrer par territoire

--> [X] adapter la charte en se basant sur la charte Trophées 

--> [X] Ajouter les données des Trophées par thématiques + légende du Trophée

--> [X] Mettre à jour les données suivi ECS

--> [] Filtrer les variables des données ECS ; retirer les montants?

--> [X] Ajouter des variables dans les étiquettes (type de financement)

--> [] Mettre à jour le README

--> [] Publier la carte au grand public


### Modif du coté de l'équipe ECS

--> [] Compléter la case "description" du tableau de données (surtout pour les Trophées)

--> [] j'ai simplement ajouté au dessus des données de suivi les données des Trophées, en esperant que s'il y a des points doublons, qu'ils aient la meme adresses

--> [] Harmoniser les noms des thématiques et ce qui pose problème c'est surtout "BTP Construction et aménagement circulaire" qui s'appelle aussi "Bâtiment et aménagement" que l'on nomme dans le légende "Construction circulaire"

--> [] Pour les données Throphées il n'y a pas d'étiquettes pour préciser le type d'aide donc pas harmonisé avec les autres popup, pas grave?





















