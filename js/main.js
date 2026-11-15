"use strict";

// Point d'entrée : branche les événements de chaque partie, puis restaure la dernière visite.

/** À appeler après tout changement du formulaire. */
function onFormChange() {
  updateAnimeInfo();
  refreshDetails();
  if (state.hasCalculated) calculate();
  else saveForm();
}

function syncCreditFields() {
  dom.openingsKept.disabled = !dom.skipOpenings.checked;
  dom.endingsKept.disabled = !dom.skipEndings.checked;
}

function initForm() {
  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!calculate()) return;
    state.hasCalculated = true;
    selectTab(dom.tabCalculation);
    // En mobile, le résultat est sous le formulaire : on le fait apparaître.
    if (window.matchMedia("(max-width: 899px)").matches) {
      dom.panelCalculation.closest(".side").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  dom.skipOpenings.addEventListener("change", syncCreditFields);
  dom.skipEndings.addEventListener("change", syncCreditFields);

  const watchedFields = [
    dom.startEpisode, dom.skipFillers, dom.stayInSeason, dom.episodeDuration, dom.episodeCount,
    dom.hours, dom.minutes, dom.endTime, dom.skipOpenings, dom.skipEndings, dom.openingsKept,
    dom.endingsKept, dom.openingDuration, dom.endingDuration, dom.playbackSpeed, dom.pauseMinutes
  ];
  for (const field of watchedFields) {
    const eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, onFormChange);
  }
}

initSettings();
initSearch();
initSelection();
initTimeBudget();
initTabs();
initCoverModal();
initForm();
restoreForm();
syncCreditFields();
