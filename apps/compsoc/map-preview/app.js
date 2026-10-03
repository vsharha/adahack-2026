/* global L */
"use strict";

const $ = (id) => document.getElementById(id);
const colors = { baseline: "#087f9d", peatpulse: "#7154a3" };
const map = L.map("map", { preferCanvas: true, zoomControl: true });
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
for (const [pane, zIndex] of [
  ["baselineHeat", 420],
  ["peatpulseHeat", 410],
])
  map.createPane(pane).style.zIndex = zIndex;

function makeHeatLayer(points, color, pane, sharedMaxWeight) {
  return L.Layer.extend({
    onAdd(targetMap) {
      this._map = targetMap;
      this._canvas = L.DomUtil.create("canvas", "heat-layer");
      this._canvas.style.pointerEvents = "none";
      targetMap.getPanes()[pane].appendChild(this._canvas);
      targetMap.on("moveend zoomend resize", this._draw, this);
      this._draw();
    },
    onRemove(targetMap) {
      targetMap.off("moveend zoomend resize", this._draw, this);
      L.DomUtil.remove(this._canvas);
    },
    _draw() {
      const size = this._map.getSize();
      const ratio = window.devicePixelRatio || 1;
      const canvas = this._canvas;
      canvas.width = size.x * ratio;
      canvas.height = size.y * ratio;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      L.DomUtil.setPosition(
        canvas,
        this._map.containerPointToLayerPoint([0, 0]),
      );
      const context = canvas.getContext("2d");
      context.scale(ratio, ratio);
      const origin = this._map.containerPointToLayerPoint([0, 0]);
      const maxWeight =
        sharedMaxWeight ?? Math.max(1, ...points.map((p) => p.weight));
      for (const point of points) {
        const pixel = this._map.latLngToLayerPoint([
          point.latitude,
          point.longitude,
        ]);
        const x = pixel.x - origin.x;
        const y = pixel.y - origin.y;
        const intensity = 0.12 + 0.72 * Math.sqrt(point.weight / maxWeight);
        const radius = 13 + 9 * Math.sqrt(point.weight / maxWeight);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(
          0,
          `${color}${Math.round(intensity * 255)
            .toString(16)
            .padStart(2, "0")}`,
        );
        gradient.addColorStop(0.3, `${color}38`);
        gradient.addColorStop(1, `${color}00`);
        context.fillStyle = gradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    },
  });
}

let data;
const layers = {};

function renderPredictionHeat() {
  const differences = data.evaluation.differences;
  const maxWeight = differences.largest_cell_difference;
  for (const [key, points, pane] of [
    ["baseline", differences.fwi_more, "baselineHeat"],
    ["peatpulse", differences.our_model_more, "peatpulseHeat"],
  ]) {
    layers[key] = new (makeHeatLayer(points, colors[key], pane, maxWeight))();
  }
}

function updateLayerVisibility() {
  for (const [key, id] of [
    ["baseline", "show-baseline"],
    ["peatpulse", "show-peatpulse"],
  ]) {
    if ($(id).checked) layers[key].addTo(map);
    else layers[key].removeFrom(map);
  }
}

async function loadData() {
  const response = await fetch("/api/data");
  if (!response.ok)
    throw new Error(`Data request failed (${response.status}).`);
  data = await response.json();
  $("fwi-label").textContent = "FWI picked more";
  $("model-label").textContent = "Model picked more";
  $("fwi-count").textContent =
    `Caught ${data.evaluation.fwi.caught_groups}/${data.evaluation.burn_groups}`;
  $("model-count").textContent =
    `Caught ${data.evaluation.our_model.caught_groups}/${data.evaluation.burn_groups}`;
  L.geoJSON(data.boundary, {
    interactive: false,
    style: { color: "#537575", weight: 2, fillOpacity: 0.015 },
  }).addTo(map);
  renderPredictionHeat();
  updateLayerVisibility();
  const points = [
    ...data.evaluation.differences.fwi_more,
    ...data.evaluation.differences.our_model_more,
  ];
  const bounds = L.latLngBounds(
    points.map((point) => [point.latitude, point.longitude]),
  );
  map.fitBounds(bounds, { padding: [30, 30] });
  $("loading").hidden = true;
}

for (const id of ["show-baseline", "show-peatpulse"])
  $(id).addEventListener("change", updateLayerVisibility);

loadData().catch((error) => {
  $("loading").textContent = `Map data could not load: ${error.message}`;
});
