/* -------------------------------------------------------------------------- */
/*                                FONCTIONS                                   */
/* -------------------------------------------------------------------------- */

async function loadData(chemin) {
  const response = await fetch(chemin);
  return await response.json();
};

function getColor(thematique) {
  switch (thematique) {
    case "Deuxième vie des objets":
      return "#f7ab55";
    case "BTP Centre de réemploi de matériaux du BTP":
      return "#5396a4";
    case "BTP Construction et aménagement circulaire":
      return "#76499c";
    case "BTP Terres végétales recyclées":
      return "#83af78";
    case "Alimentation et biodéchets":
      return "#931f1d";
    default:
      return "#999999";
  }
};

function updateLayerOrder() {
  if (ecsPointLayer) ecsPointLayer.bringToFront();
};

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

function getPolygonStyle(feature) {
  return {
    fillPattern: getPattern(getColor(feature.properties.thematique)),
    fillOpacity: 0.2,
    color: "transparent",
    weight: 0
  };
}

function resetPolygon(layer) {
  if (layer && layer.defaultStyle) {
    layer.setStyle(layer.defaultStyle);
  }
};

function getPattern(color) {
  return new L.StripePattern({
    weight: 1,
    spaceWeight: 4,
    color: color,
    opacity: 1,
    angle: 45
  });
};


/* -------------------------------------------------------------------------- */
/*                                MAP                                         */
/* -------------------------------------------------------------------------- */

const map = L.map("idMAP", {
  zoomControl: false
}).setView([48.86110101269274, 2.3318481445312504], 11);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

L.control.scale({ position: "bottomright", imperial: false }).addTo(map);
L.control.zoom({ position: "topright" }).addTo(map);

const patternCache = {};

function getPattern(color) {
  if (patternCache[color]) return patternCache[color];

  const pattern = new L.StripePattern({
    weight: 2,
    spaceWeight: 4,
    color: color,
    opacity: 1,
    angle: 45
  });

  pattern.addTo(map);
  patternCache[color] = pattern;

  return pattern;
}

/* -------------------------------------------------------------------------- */
/*                              VARIABLES                                     */
/* -------------------------------------------------------------------------- */

let ecsPointLayer = null;

let selectedPointLayer = null;
let selectedPolygonLayer = null;

let polygonLayersByTheme = {};


/* -------------------------------------------------------------------------- */
/*                                LEGEND                                     */
/* -------------------------------------------------------------------------- */

const legend = L.control({ position: "bottomleft" });

legend.onAdd = function () {

  const div = L.DomUtil.create("div", "legend");

  div.innerHTML = `
    <div id="legend-content">

      <b class="legend-title">Thématiques</b>

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
  });

  closeBtn.addEventListener("click", () => {
    content.style.display = "none";
    openBtn.style.display = "block";
    closeBtn.style.display = "none";
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
  if (!checkbox || !ecsPointLayer) return;

  const theme = checkbox.dataset.theme;
  const isVisible = checkbox.checked;

  ecsPointLayer.eachLayer(layer => {

    const t = layer.feature.properties.thematique;

    if (t === theme) {
      if (isVisible) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    }
  });

  if (polygonLayersByTheme[theme]) {
    if (isVisible) {
      map.addLayer(polygonLayersByTheme[theme]);
    } else {
      map.removeLayer(polygonLayersByTheme[theme]);
    }
  }

  updateLayerOrder();
});


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
  const ecsEptPolygonLayer = new L.geoJSON(ecsEptPolygon, {

    style: function (feature) {
      return getPolygonStyle(feature, "ept");
    },

    onEachFeature: function (feature, layer) {

      const theme = feature.properties.thematique;
      layer.defaultStyle = getPolygonStyle(feature, "ept");

      layer.bindPopup(`
        <b>Nom:</b> ${feature.properties.nom_projet_carto || "Non renseigné"}<br>
        <b>EPT:</b> ${feature.properties.lib_ept || "Non renseigné"}<br>
        <b>Description:</b> ${feature.properties.description || "Non renseigné"}<br>
        <b>Année:</b> ${feature.properties.annee || "Non renseigné"}
      `);

      layer.on("click", function () {

        if (selectedPolygonLayer) {
          resetPolygon(selectedPolygonLayer);
        }

        layer.setStyle({
          weight: 2,
          color: "#ffee00",
          fillOpacity: 0.9
        });

        selectedPolygonLayer = layer;
        layer.openPopup();
      });

      layer.on("popupclose", function () {
        resetPolygon(layer);
        selectedPolygonLayer = null;
      });

      layer.on("mouseover", function () {
        if (layer !== selectedPolygonLayer) {
          layer.setStyle({ fillOpacity: 0.5 });
        }
      });

      layer.on("mouseout", function () {
        if (layer !== selectedPolygonLayer) {
          resetPolygon(layer);
        }
      });

      if (!polygonLayersByTheme[theme]) {
        polygonLayersByTheme[theme] = L.layerGroup();
      }

      polygonLayersByTheme[theme].addLayer(layer);
    }
  });


  /* ========================= ECS COMMUNES ========================= */
  const ecsCommunePolygonLayer = new L.geoJSON(ecsCommunePolygon, {

    style: function (feature) {
      return getPolygonStyle(feature, "commune");
    },

    onEachFeature: function (feature, layer) {

      const theme = feature.properties.thematique;
      layer.defaultStyle = getPolygonStyle(feature, "commune");

      layer.bindPopup(`
        <b>Nom:</b> ${feature.properties.nom_projet_carto || "Non renseigné"}<br>
        <b>Ville:</b> ${feature.properties.lib_com || "Non renseigné"}<br>
        <b>Description:</b> ${feature.properties.description || "Non renseigné"}<br>
        <b>Année:</b> ${feature.properties.annee || "Non renseigné"}<br>

      `);

      layer.on("click", function () {

        if (selectedPolygonLayer) {
          resetPolygon(selectedPolygonLayer);
        }

        layer.setStyle({
          weight: 2,
          color: "#ffee00",
          fillOpacity: 0.9
        });

        selectedPolygonLayer = layer;
        layer.openPopup();
      });

      layer.on("popupclose", function () {
        resetPolygon(layer);
        selectedPolygonLayer = null;
      });

      layer.on("mouseover", function () {
        if (layer !== selectedPolygonLayer) {
          layer.setStyle({ fillOpacity: 0.9 });
        }
      });

      layer.on("mouseout", function () {
        if (layer !== selectedPolygonLayer) {
          resetPolygon(layer);
        }
      });

      if (!polygonLayersByTheme[theme]) {
        polygonLayersByTheme[theme] = L.layerGroup();
      }

      polygonLayersByTheme[theme].addLayer(layer);
    }
  });

  const comPolygonLayer = new L.geoJSON(comPolygon, {
    style: {
      fillColor: "transparent",
      fillOpacity: 0,
      color: "#273f55",
      weight: 0.5
    }
  }).addTo(map);

  const eptPolygonLayer = new L.geoJSON(eptPolygon, {
    style: {
      fillColor: "transparent",
      fillOpacity: 0,
      color: "#273f55",
      weight: 1
    }
  }).addTo(map);

  const mgpPolygonLayer = new L.geoJSON(mgpPolygon, {
    style: {
      fillColor: "transparent",
      fillOpacity: 0,
      color: "#273f55",
      weight: 3
    }
  }).addTo(map);

  const mgpPolygonLayerbis = new L.geoJSON(mgpPolygon, {
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
/*                          POINTS ECS                                       */
/* -------------------------------------------------------------------------- */

loadData("data_init/data_suivi_ecs_adresse.geojson")
  .then(data => {

    ecsPointLayer = L.geoJSON(data, {

      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
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
          <b>Adresse:</b> ${feature.properties.adresse}
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