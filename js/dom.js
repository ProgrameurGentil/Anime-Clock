"use strict";

// Références vers les éléments de index.html, récupérées une seule fois.

const byId = (id) => document.getElementById(id);

const dom = {
  // Formulaire : anime
  form: byId("plannerForm"),
  search: byId("animeSearch"),
  suggestions: byId("suggestions"),
  animeInfo: byId("animeInfo"),
  season: byId("season"),
  startEpisode: byId("startEpisode"),
  animeAdvanced: byId("animeAdvanced"),
  versionField: byId("versionField"),
  version: byId("version"),
  fillerField: byId("fillerField"),
  skipFillers: byId("skipFillers"),
  stayInSeason: byId("stayInSeason"),
  episodeDuration: byId("episodeDuration"),
  episodeCountField: byId("episodeCountField"),
  episodeCountLabel: byId("episodeCountLabel"),
  episodeCount: byId("episodeCount"),

  // Formulaire : temps
  durationBox: byId("durationBox"),
  hours: byId("hours"),
  minutes: byId("minutes"),
  timeShortcuts: byId("timeShortcuts"),
  endTimeBox: byId("endTimeBox"),
  endTime: byId("endTime"),
  endTimeHint: byId("endTimeHint"),

  // Formulaire : génériques, vitesse, pauses
  skipOpenings: byId("skipOpenings"),
  skipEndings: byId("skipEndings"),
  openingsKept: byId("openingsKept"),
  endingsKept: byId("endingsKept"),
  openingDuration: byId("openingDuration"),
  endingDuration: byId("endingDuration"),
  playbackSpeed: byId("playbackSpeed"),
  pauseMinutes: byId("pauseMinutes"),
  formError: byId("formError"),

  // Colonne de droite
  tabCalculation: byId("tabCalculation"),
  tabDetails: byId("tabDetails"),
  panelCalculation: byId("panelCalculation"),
  panelDetails: byId("panelDetails"),
  result: byId("result"),
  details: byId("details"),

  // Affiche en grand
  coverModal: byId("coverModal"),
  coverImage: byId("coverImage"),

  // Paramètres
  settingsButton: byId("settingsButton"),
  settingsMenu: byId("settingsMenu")
};

// Champs dont la valeur saisie à la main remplace celle du catalogue (marqués « touched »).
const TIMING_OVERRIDE_FIELDS = [dom.episodeDuration, dom.openingDuration, dom.endingDuration];
