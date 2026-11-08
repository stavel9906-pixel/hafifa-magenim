import type { LinearRing, Polygon } from './types/polygon.js';

const OUTER: LinearRing = [
  // Mediterranean coast, north to south
  [35.115, 33.09], // Rosh HaNikra
  [35.1, 33.005], // Nahariya
  [35.08, 32.925], // Akko
  [35.085, 32.875],
  [35.05, 32.822], // Haifa Bay
  [34.985, 32.818], // Haifa / Carmel cape
  [34.95, 32.69], // Atlit
  [34.93, 32.61], // Dor
  [34.9, 32.5], // Caesarea
  [34.882, 32.45], // Hadera
  [34.862, 32.33], // Netanya
  [34.808, 32.165], // Herzliya
  [34.778, 32.08], // Tel Aviv
  [34.762, 32.05], // Jaffa
  [34.752, 32.015], // Bat Yam
  [34.703, 31.93], // Palmachim
  [34.648, 31.81], // Ashdod
  [34.558, 31.67], // Ashkelon
  [34.505, 31.598], // Zikim (Gaza border at the coast)
  // Gaza coast (Gaza itself is removed by the GAZA hole below)
  [34.38, 31.47],
  [34.217, 31.322], // Rafah
  // Egypt border, north to south
  [34.267, 31.217], // Kerem Shalom
  [34.39, 30.97],
  [34.43, 30.88], // Nitzana
  [34.55, 30.4],
  [34.7, 30.05],
  [34.8, 29.8],
  [34.875, 29.55],
  [34.903, 29.492], // Taba
  // Gulf of Eilat
  [34.96, 29.545], // Eilat north beach
  [34.975, 29.548],
  // Jordan border along the Arava, south to north
  [35.02, 29.7],
  [35.08, 29.95],
  [35.16, 30.25],
  [35.2, 30.5],
  [35.32, 30.8],
  [35.4, 31.0],
  // Western shore of the Dead Sea, south to north
  [35.37, 31.1],
  [35.375, 31.2], // Ein Bokek
  [35.395, 31.31], // Masada
  [35.39, 31.46], // Ein Gedi
  [35.41, 31.57],
  [35.47, 31.75], // Kalia
  [35.55, 31.77], // Northern tip of the Dead Sea
  // Jordan River, south to north
  [35.55, 31.85],
  [35.53, 32.1],
  [35.56, 32.35],
  [35.57, 32.55],
  [35.57, 32.7], // Degania (south of the Sea of Galilee)
  [35.65, 32.7],
  [35.66, 32.82], // Eastern shore of the Sea of Galilee
  [35.63, 32.9],
  [35.62, 33.05],
  [35.63, 33.2], // Hula Valley
  [35.578, 33.277], // Metula
  // Lebanon border, east to west
  [35.52, 33.12],
  [35.4, 33.07],
  [35.2, 33.08],
  [35.115, 33.09], // back to Rosh HaNikra
];

const GAZA: LinearRing = [
  [34.505, 31.598],
  [34.567, 31.558], // Erez
  [34.54, 31.47],
  [34.47, 31.38],
  [34.39, 31.3],
  [34.267, 31.217], // Kerem Shalom
  [34.217, 31.322],
  [34.38, 31.47],
  [34.505, 31.598],
];

const WEST_BANK: LinearRing = [
  [35.55, 32.4], // Jordan River
  [35.4, 32.5], // Gilboa
  [35.3, 32.55], // Jenin
  [35.17, 32.53],
  [35.07, 32.43],
  [35.03, 32.32], // Tulkarm
  [34.97, 32.2], // Qalqilya
  [34.98, 32.08],
  [34.97, 31.95],
  [34.97, 31.86], // Latrun
  [35.08, 31.85],
  [35.17, 31.82],
  [35.22, 31.8], // Jerusalem (Green Line)
  [35.24, 31.76],
  [35.2, 31.73],
  [35.1, 31.72],
  [35.03, 31.68],
  [34.95, 31.55],
  [34.88, 31.42],
  [34.95, 31.35],
  [35.1, 31.36],
  [35.25, 31.38],
  [35.39, 31.49], // Dead Sea, north of Ein Gedi
  [35.47, 31.75],
  [35.55, 31.85],
  [35.55, 32.4],
];

const SEA_OF_GALILEE: LinearRing = [
  [35.57, 32.7],
  [35.53, 32.72],
  [35.54, 32.79], // Tiberias
  [35.5, 32.84], // Migdal
  [35.55, 32.88], // Capernaum
  [35.62, 32.89], // Jordan River inlet
  [35.65, 32.82],
  [35.64, 32.75], // Ein Gev
  [35.6, 32.7],
  [35.57, 32.7],
];

export const ISRAEL_LAND_AREA: Polygon = {
  outer: OUTER,
  holes: [GAZA, WEST_BANK, SEA_OF_GALILEE],
};
