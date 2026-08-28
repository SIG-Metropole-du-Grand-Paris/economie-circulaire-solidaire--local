/* -------------------------------------------------------------------------- */
/*                                FONCTIONS                                   */
/* -------------------------------------------------------------------------- */
const BEIGE = "#d7c2a3";


async function loadData(chemin) {
  const response = await fetch(chemin);
  return await response.json();
};

// Fonction de réinitialisation
function resetMap() {
    map.setView(initCenter, initZoom);
}

function getColor(thematique) {
  switch (thematique) {
    case "Deuxième vie des objets":
      return "#f7ab55";
    case "BTP Centre de réemploi de matériaux du BTP":
      return "#a567dc";
    case "BTP Construction et aménagement circulaire":
      return "#3ea2d6";
    case "BTP Terres végétales recyclées":
      return "#363ea5";
    case "Alimentation et biodéchets":
      return "#63b36c";
    case "Achats publics":
      return "#b74e93";
    default:
      return "#999999";
  }
};

function normalizeThematique(thematique) {

  switch (thematique) {

    case "Deuxième vie":
      return "Deuxième vie des objets";

    case "Bâtiment et aménagement":
    case "BTP Construction et aménagement circulaire":
    case "Construction circulaire":
      return "Construction circulaire";

    case "Alimentation et biodéchets":
      return "Alimentation et biodéchets";

    case "Achats publics":
      return "Achats publics";

    default:
      return thematique;
  }

}


// Récupérer les bonnes images pour les Trophées
function getTropheeIcon(thematique, taille = 24) {

  let fichier;

  switch (thematique) {

    case "Deuxième vie":
      fichier = "PictogrammeTrophee_1.svg";
      break;

    case "Achats publics":
      fichier = "PictogrammeTrophee_2.svg";
      break;

    case "Bâtiment et aménagement":
      fichier = "PictogrammeTrophee_3.svg";
      break;

    case "Alimentation et biodéchets":
      fichier = "PictogrammeTrophee_4.svg";
      break;

    default:
      fichier = "PictogrammeTrophee_1.svg";
  }

  return L.icon({
    iconUrl: "image/" + fichier,
    iconSize: [taille, taille],
    iconAnchor: [taille / 2, taille / 2],
    popupAnchor: [0, -taille / 2]
  });
}



function updateLayerOrder() {

  if (ecsPointLayer) {
    ecsPointLayer.bringToFront();
  }

  if (tropheePointLayer) {
    tropheePointLayer.bringToFront();
  }

}

function resetSelection() {
  if (selectedPointLayer) {
    selectedPointLayer.setStyle({
      radius: 5,
      color: "#ffffff",
      weight: 1,
      fillOpacity: 1
    });
    selectedPointLayer = null;
  }
};


function configurePolygon(feature, layer, type) {

  const theme = feature.properties.thematique;

  layer.defaultStyle = getPolygonStyle();

  // ---------- Popup ----------
  const territoire = type === "ept"
    ? `<b>EPT :</b> ${feature.properties.lib_ept || "Non renseigné"}`
    : `<b>Ville :</b> ${feature.properties.lib_com || "Non renseigné"}`;

  layer.bindPopup(`
    <b>Nom :</b> ${feature.properties.nom_projet_carto || "Non renseigné"}<br>
    ${territoire}<br>
    <b>Description :</b> ${feature.properties.description || "Non renseigné"}<br>
    <b>Année :</b> ${feature.properties.annee || "Non renseigné"} <br>
    <b>Type d'aide:</b> ${feature.properties.type_aide || "Non renseigné"}
  `);

  // ---------- Sélection ----------
  layer.on("click", () => {

    if (selectedPolygonLayer) {
      resetPolygon(selectedPolygonLayer);
    }

    layer.setStyle({
      weight: 2,
      color: "#ffee00",
      fillOpacity: 1
    });


    selectedPolygonLayer = layer;
    layer.openPopup();
  });

  layer.on("popupclose", () => {
    resetPolygon(layer);
    selectedPolygonLayer = null;
  });

  // ---------- Survol ----------
  layer.on("mouseover", () => {
    if (layer !== selectedPolygonLayer) {
      layer.setStyle({
        fillOpacity: 1
      });
    }
  });

  layer.on("mouseout", () => {
    if (layer !== selectedPolygonLayer) {
      resetPolygon(layer);
    }
  });

  // ---------- Classement par thème ----------
  if (!polygonLayersByTheme[theme]) {
    polygonLayersByTheme[theme] = L.layerGroup();
  }

  polygonLayersByTheme[theme].addLayer(layer);

  const center = layer.getBounds().getCenter();

  const marker = L.circleMarker(center, {
    pane: "ecsPointPane",
    radius:3.5,
    fillColor: "#ffffff",
    color: getColor(theme),
    weight: 3,
    fillOpacity: 1
  });

  marker.bindPopup(layer.getPopup());

  marker.on("click", () => layer.fire("click"));

  polygonLayersByTheme[theme].addLayer(marker);
};


function getPolygonStyle() {
  return {
    fillPattern: getPattern(),
    fillOpacity: 0.4,
    color: "transparent",
    weight: 0
  };
};

function resetPolygon(layer) {
  if (!layer) return;

  layer.setStyle({
    fillOpacity: 0.4,
    color: "transparent",
    weight: 0,
    fillPattern: getPattern()
  });
}



/* -------------------------------------------------------------------------- */
/*                                MAP                                         */
/* -------------------------------------------------------------------------- */

const initCenter = [48.86110101269274, 2.3318481445312504];
const initZoom = 11;

const map = L.map("idMAP", {
  zoomControl: false
}).setView(initCenter, initZoom);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>  Données : Métropole du Grand Paris'
}).addTo(map);

L.control.scale({ position: "bottomright", imperial: false }).addTo(map);
L.control.zoom({ position: "topright" }).addTo(map);

// BOUTON HOME

const HomeControl = L.Control.extend({
  options: {
    position: "topright"
  },

  onAdd: function () {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");

    const button = L.DomUtil.create("a", "", container);
    button.href = "#";
    button.title = "Vue initiale";
    button.innerHTML = '<img src="image/recenter.svg" alt="Réinitialiser le zoom">';

    L.DomEvent.disableClickPropagation(container);

    L.DomEvent.on(button, "click", function (e) {
      L.DomEvent.preventDefault(e);
      map.flyTo(initCenter, initZoom, {
        duration: 1
      });
    });

    return container;
  }
});

map.addControl(new HomeControl());




const patternCache = {};

function getPattern() {
  if (patternCache["beige"]) return patternCache["beige"];

  const pattern = new L.StripePattern({
    weight: 1,
    spaceWeight: 4,
    color: BEIGE,
    opacity: 1,
    angle: 45
  });

  pattern.addTo(map);
  patternCache["beige"] = pattern;

  return pattern;
};

/* -------------------------------------------------------------------------- */
/*                                PANES                                       */
/* -------------------------------------------------------------------------- */

map.createPane("ecsFillPane");
map.getPane("ecsFillPane").style.zIndex = 350;

map.createPane("adminPane");
map.getPane("adminPane").style.zIndex = 450;

map.createPane("searchPane");
map.getPane("searchPane").style.zIndex = 500;

map.createPane("ecsPointPane");
map.getPane("ecsPointPane").style.zIndex = 650;

map.createPane("tropheePane");
map.getPane("tropheePane").style.zIndex = 650;



/* -------------------------------------------------------------------------- */
/*                              VARIABLES                                     */
/* -------------------------------------------------------------------------- */

let ecsPointLayer = null;

let tropheePointLayer = null;

let selectedPointLayer = null;

let selectedTropheeLayer = null;

let selectedPolygonLayer = null;

let polygonLayersByTheme = {};

let comPolygonLayer = null;

let eptPolygonLayer = null;

/* -------------------------------------------------------------------------- */
/*                                POLYGONES                                  */
/* -------------------------------------------------------------------------- */

const ecsCommuneInit = loadData("data_init/data_suivi_ecs_com.geojson");
const ecsEptInit = loadData("data_init/data_suivi_ecs_ept.geojson");
const communeInit = loadData("data_init/geom_com26.geojson");
const eptInit = loadData("data_init/geom_ept26.geojson");
const mgpInit = loadData("data_init/geom_mgp26.geojson");

Promise.all([
  ecsEptInit,
  ecsCommuneInit,
  communeInit,
  eptInit,
  mgpInit
]).then(([ecsEptPolygon, ecsCommunePolygon, comPolygon, eptPolygon, mgpPolygon]) => {


  /* ========================= ECS EPT ========================= */
  const ecsEptPolygonLayer = L.geoJSON(ecsEptPolygon, {
    pane: "ecsFillPane",
    style: getPolygonStyle,
    onEachFeature: (feature, layer) => {
      configurePolygon(feature, layer, "ept");
    }

  });


  /* ========================= ECS COMMUNES ========================= */
  const ecsCommunePolygonLayer = L.geoJSON(ecsCommunePolygon, {
    pane: "ecsFillPane",
    style: getPolygonStyle,
    onEachFeature: (feature, layer) => {
      configurePolygon(feature, layer, "commune");
    }

  });

/* ========================= LIMITES ADMINISTRATIVES ========================= */
  comPolygonLayer = new L.geoJSON(comPolygon, {
    pane: "adminPane",
    interactive: false,
    style: {
      fillColor: "transparent",
      fillOpacity: 0,
      color: "#273f55",
      weight: 0.5
    }
  }).addTo(map);

  eptPolygonLayer = new L.geoJSON(eptPolygon, {
    pane: "adminPane",
    interactive: false,
    style: {
      fillColor: "transparent",
      fillOpacity: 0,
      color: "#273f55",
      weight: 1
    }
  }).addTo(map);

  const mgpPolygonLayer = new L.geoJSON(mgpPolygon, {
    pane: "adminPane",
    interactive: false,
    style: {
      fillColor: "transparent",
      fillOpacity: 0,
      color: "#273f55",
      weight: 3
    }
  }).addTo(map);

  const mgpPolygonLayerbis = new L.geoJSON(mgpPolygon, {
    pane: "adminPane",
    interactive: false,
    style: {
      fillColor: "transparent",
      fillOpacity: 0,
      color: "#ffffff",
      weight: 1.2
    }
  }).addTo(map);

  // On ajoute les couches de polygones une fois qu'elles sont complètement construites
  Object.values(polygonLayersByTheme).forEach(group => {
    group.addTo(map);
  });

  updateLayerOrder();
});

/* -------------------------------------------------------------------------- */
/*                                  POINT                                     */
/* -------------------------------------------------------------------------- */

loadData("data_init/data_suivi_ecs_adresse.geojson")
  .then(data => {

    ecsPointLayer = L.geoJSON(data, {

      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          pane: "ecsPointPane",
          radius: 5,
          color: "#ffffff",
          weight: 1,
          fillColor: getColor(feature.properties.thematique),
          fillOpacity: 1
        });
      },

      onEachFeature: function (feature, layer) {

        layer.bindPopup(`
          <b>Nom:</b> ${feature.properties.nom_projet_carto}<br>
          <b>Ville:</b> ${feature.properties.lib_com}<br>
          <b>Description:</b> ${feature.properties.description}<br>
          <b>Année:</b> ${feature.properties.annee}<br>
          <b>Adresse:</b> ${feature.properties.adresse}<br>
          <b>Type d'aide:</b> ${feature.properties.type_aide}
        `);

        layer.on("mouseover", function () {

          if (layer !== selectedPointLayer) {
            layer.setStyle({
              radius: 7
            });
          }
        });

        layer.on("mouseout", function () {

          if (layer !== selectedPointLayer) {
            layer.setStyle({
              radius: 5
            });
          }

        });

        layer.on("click", function () {

          if (selectedPointLayer) {
            selectedPointLayer.setStyle({
              radius: 5,
              color: "#ffffff",
              weight: 1,
              fillOpacity: 1
            });
          }

          layer.setStyle({
            radius: 7,
            weight: 3,
            color: "#ffee00",
            fillOpacity: 1
          });

          selectedPointLayer = layer;
          layer.openPopup();
        });

        layer.on("popupclose", resetSelection);
      }

    }).addTo(map);

    updateLayerOrder();
});


// DONNEES DES TROPHEES
loadData("data_init/trophees_ecs_adresse.geojson")
.then(data => {

  tropheePointLayer = L.geoJSON(data, {

    pointToLayer: function (feature, latlng) {

      return L.marker(latlng, {

        pane: "tropheePane",

        icon: getTropheeIcon(
          feature.properties.thematique,
          24
        )

      });

    },

    onEachFeature: function (feature, layer) {

      layer.bindPopup(`
        <b>Nom:</b> ${feature.properties.nom_projet_carto}<br>
        <b>Ville:</b> ${feature.properties.lib_com}<br>
        <b>Description:</b> ${feature.properties.description}<br>
        <b>Année:</b> ${feature.properties.annee}<br>
        <b>Adresse:</b> ${feature.properties.adresse}
      `);


      // --------------------------------
      // MOUSEOVER
      // --------------------------------

      layer.on("mouseover", function () {

        if (layer !== selectedTropheeLayer) {

          layer.setIcon(
            getTropheeIcon(
              feature.properties.thematique,
              32
            )
          );

        }

      });


      // --------------------------------
      // MOUSEOUT
      // --------------------------------

      layer.on("mouseout", function () {

        if (layer !== selectedTropheeLayer) {

          layer.setIcon(
            getTropheeIcon(
              feature.properties.thematique,
              24
            )
          );

        }

      });


      // --------------------------------
      // CLICK
      // --------------------------------

      layer.on("click", function () {

        // Désélectionner l'ancien trophée
        if (
          selectedTropheeLayer &&
          selectedTropheeLayer !== layer
        ) {

          const ancienneThematique =
            selectedTropheeLayer.feature.properties.thematique;

          selectedTropheeLayer.setIcon(
            getTropheeIcon(
              ancienneThematique,
              24
            )
          );

        }

        // Agrandir le trophée cliqué
        layer.setIcon(
          getTropheeIcon(
            feature.properties.thematique,
            32
          )
        );

        // Enregistrer le trophée sélectionné
        selectedTropheeLayer = layer;

        // Ouvrir le popup
        layer.openPopup();

      });


      // --------------------------------
      // FERMETURE DU POPUP
      // --------------------------------

      layer.on("popupclose", function () {

        // Si ce trophée est bien celui qui était sélectionné
        if (selectedTropheeLayer === layer) {

          layer.setIcon(
            getTropheeIcon(
              feature.properties.thematique,
              24
            )
          );

          selectedTropheeLayer = null;

        }

      });

    }

  }).addTo(map);

  updateLayerOrder();

});




/* -------------------------------------------------------------------------- */
/*                         BARRE DE RECHERCHE DE TERRITOIRE                   */
/* -------------------------------------------------------------------------- */


const territorySearch = L.control({
    position: "topleft"
});

let selectedTerritoryLayer = null;



/*--------------------------------- STYLE SELECTION--------------------------------- */

function resetTerritorySelection() {

    if (!selectedTerritoryLayer) return;

    const layer = selectedTerritoryLayer;

    if (layer._territoryType === "commune") {

        layer.setStyle({
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#273f55",
            weight: 0.5
        });

    } else if (layer._territoryType === "ept") {

        layer.setStyle({
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#273f55",
            weight: 1
        });
    }

    selectedTerritoryLayer = null;
}


function selectTerritory(layer, type) {

    // Réinitialiser l'ancienne sélection
    resetTerritorySelection();

    selectedTerritoryLayer = layer;
    layer._territoryType = type;

    // Style de sélection
    layer.setStyle({
        fillColor: "#ffee00",
        fillOpacity: 0.25,
        color: "#ffee00",
        weight: 3
    });

    // Zoom
    map.flyToBounds(layer.getBounds(), {
        padding: [40, 40],
        maxZoom: type === "commune" ? 14 : 12,
        duration: 1
    });
}



/*----------------------------- CONTROLE DE RECHERCHE -----------------------------*/

territorySearch.onAdd = function () {

    const div = L.DomUtil.create(
        "div",
        "territory-search"
    );

    div.innerHTML = `

        <div class="territory-search-input-wrapper">

            <span class="search-icon">⌕</span>

            <input
                type="text"
                id="territory-search-input"
                placeholder="Rechercher une commune ou un EPT..."
                autocomplete="off"
            >

            <button
                id="territory-search-clear"
                type="button"
                title="Effacer"
            >
                ×
            </button>

        </div>

        <div id="territory-search-results"></div>
    `;

    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return div;
};


territorySearch.addTo(map);



/*------------------------------- ELEMENTS DOM --------------------------------*/

const searchInput = document.getElementById(
    "territory-search-input"
);

const searchResults = document.getElementById(
    "territory-search-results"
);

const searchClear = document.getElementById(
    "territory-search-clear"
);



/*------------------------------- NORMALISATION --------------------------------*/

function normalizeSearch(value) {

    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}



/*--------------------------- RECHERCHE DES COMMUNES ---------------------------*/

function searchCommunes(recherche) {

    const resultats = [];

    comPolygonLayer.eachLayer(function (layer) {

        const nom = layer.feature?.properties?.lib_com;

        if (!nom) return;

        const nomNormalise = normalizeSearch(nom);

        if (nomNormalise.includes(recherche)) {

            resultats.push({
                nom: nom,
                type: "commune",
                layer: layer
            });
        }
    });

    return resultats;
}



/*------------------------------ RECHERCHE DES EPT ------------------------------*/

function searchEPT(recherche) {

    const resultats = [];

    eptPolygonLayer.eachLayer(function (layer) {

        const nom = layer.feature?.properties?.lib_ept;

        if (!nom) return;

        const nomNormalise = normalizeSearch(nom);

        if (nomNormalise.includes(recherche)) {

            resultats.push({
                nom: nom,
                type: "ept",
                layer: layer
            });
        }
    });

    return resultats;
}



/*----------------------------- AFFICHAGE DES RESULTATS -----------------------------*/

function displaySearchResults(resultats) {

    searchResults.innerHTML = "";

    resultats
        .sort(function (a, b) {

            return a.nom.localeCompare(
                b.nom,
                "fr",
                {
                    sensitivity: "base"
                }
            );
        })
        .slice(0, 10)
        .forEach(function (resultat) {

            const item = document.createElement("div");

            item.className = "territory-search-result";

            item.innerHTML = `
                <span class="result-name">
                    ${resultat.nom}
                </span>

                <span class="result-type">
                    ${resultat.type === "commune"
                        ? "Commune"
                        : "EPT"}
                </span>
            `;


            item.addEventListener("click", function () {

                selectTerritory(
                    resultat.layer,
                    resultat.type
                );

                searchInput.value = resultat.nom;

                searchResults.innerHTML = "";

                searchResults.style.display = "none";
            });


            searchResults.appendChild(item);
        });


    /* Aucun résultat */

    if (resultats.length === 0) {

        searchResults.innerHTML = `
            <div class="territory-search-no-result">
                Aucun résultat
            </div>
        `;
    }


    searchResults.style.display = "block";
}



/*------------------------------- RECHERCHE --------------------------------*/

searchInput.addEventListener("input", function () {

    const recherche = normalizeSearch(this.value);

    searchResults.innerHTML = "";

    // Pas de recherche avec moins de 2 caractères
    if (recherche.length < 2) {

        searchResults.style.display = "none";

        return;
    }


    // Recherche simultanée commune + EPT
    const resultatsCommunes = searchCommunes(recherche);

    const resultatsEPT = searchEPT(recherche);

    const resultats = [
        ...resultatsCommunes,
        ...resultatsEPT
    ];


    displaySearchResults(resultats);
});



/*------------------------------- BOUTON EFFACER -------------------------------*/

searchClear.addEventListener("click", function () {

    searchInput.value = "";

    searchResults.innerHTML = "";

    searchResults.style.display = "none";

    resetTerritorySelection();

    map.flyTo(initCenter, initZoom, {
        duration: 1
    });

    searchInput.focus();
});





/* -------------------------------------------------------------------------- */
/*                                LEGEND                                     */
/* -------------------------------------------------------------------------- */

const legend = L.control({ position: "bottomleft" });

legend.onAdd = function () {

  const div = L.DomUtil.create("div", "legend");

  div.innerHTML = `
    <div id="legend-content">

      <!-- PROJET LAURÉAT -->
      <div class="legend-laureat">
        <img src="image/PictogrammeTrophee_9.svg" alt="Projet lauréat">
        <span>Projet lauréat</span>
      </div>

      <b class="legend-title">Les projets par thématiques</b>

      <!-- PROJET thématique -->
      <label class="legend-item">
        <input type="checkbox" checked data-theme="Deuxième vie des objets">
        <span class="box" style="background:${getColor("Deuxième vie des objets")}"></span>
        Deuxième vie des objets
      </label>

      <label class="legend-item">
        <input type="checkbox" checked data-theme="BTP Centre de réemploi de matériaux du BTP">
        <span class="box" style="background:${getColor("BTP Centre de réemploi de matériaux du BTP")}"></span>
        Réemploi BTP
      </label>

      <label class="legend-item">
        <input type="checkbox" checked data-theme="BTP Construction et aménagement circulaire">
        <span class="box" style="background:${getColor("BTP Construction et aménagement circulaire")}"></span>
        Construction circulaire
      </label>

      <label class="legend-item">
        <input type="checkbox" checked data-theme="BTP Terres végétales recyclées">
        <span class="box" style="background:${getColor("BTP Terres végétales recyclées")}"></span>
        Terres végétales
      </label>

      <label class="legend-item">
        <input type="checkbox" checked data-theme="Alimentation et biodéchets">
        <span class="box" style="background:${getColor("Alimentation et biodéchets")}"></span>
        Alimentation / biodéchets
      </label>

      <label class="legend-item">
        <input type="checkbox" checked data-theme="Achats publics">
        <span class="box" style="background:${getColor("Achats publics")}"></span>
        Achats publics
      </label>

      <div class="legend-item legend-territoire">
        <span class="hachure">
          <span class="hachure-point"></span>
        </span>
        <span>Certain projets ne sont pas localisables précisement car concernent un territoire dans son ensemble. Ces projets sont représentés par un point au centre de la commune ou de l'EPT.</span>
      </div>


    </div>

    <button class="legend-btn open-btn">
      <img src="image/legend.svg" />
    </button>

    <button class="legend-btn close-btn" style="display:none;">
      Fermer
    </button>
  `;

  const content = div.querySelector("#legend-content");
  const openBtn = div.querySelector(".open-btn");
  const closeBtn = div.querySelector(".close-btn");

  content.style.display = "none";
  div.classList.add("collapsed");

  openBtn.addEventListener("click", () => {
      content.style.display = "block";
      openBtn.style.display = "none";
      closeBtn.style.display = "block";

      div.classList.remove("collapsed");
  });

  closeBtn.addEventListener("click", () => {
      content.style.display = "none";
      openBtn.style.display = "block";
      closeBtn.style.display = "none";

      div.classList.add("collapsed");
  });

  L.DomEvent.disableClickPropagation(div);

  return div;
};

legend.addTo(map);



/* -------------------------------------------------------------------------- */
/*                     FILTRE LÉGENDE                                         */
/* -------------------------------------------------------------------------- */
document.addEventListener("change", function (e) {

  const checkbox = e.target.closest("input[type=checkbox]");
  if (!checkbox) return;

  const theme = checkbox.dataset.theme;
  const isVisible = checkbox.checked;


  // Filtre des points ECS classiques
  if (ecsPointLayer) {

    ecsPointLayer.eachLayer(layer => {

      const t = normalizeThematique(
        layer.feature.properties.thematique
      );

      if (t === normalizeThematique(theme)) {

        if (isVisible) {
          if (!map.hasLayer(layer)) map.addLayer(layer);
        } else {
          if (map.hasLayer(layer)) map.removeLayer(layer);
        }

      }

    });

  }


  // Filtre des trophées ECS
  if (tropheePointLayer) {

    tropheePointLayer.eachLayer(layer => {

      const t = normalizeThematique(
        layer.feature.properties.thematique
      );

      if (t === normalizeThematique(theme)) {

        if (isVisible) {
          if (!map.hasLayer(layer)) map.addLayer(layer);
        } else {
          if (map.hasLayer(layer)) map.removeLayer(layer);
        }

      }

    });

  }


  // Filtre des polygones
  if (polygonLayersByTheme[theme]) {

    if (isVisible) {
      map.addLayer(polygonLayersByTheme[theme]);
    } else {
      map.removeLayer(polygonLayersByTheme[theme]);
    }

  }


  updateLayerOrder();

});