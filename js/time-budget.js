"use strict";

// Temps disponible : soit une durée (heures + minutes), soit une heure de fin.

function timeMode() {
  return dom.form.elements.timeMode.value; // "duration" | "endTime"
}

/** Prochaine occurrence de l'heure de fin : si elle est déjà passée aujourd'hui, c'est demain. */
function endTimeTarget(now = new Date()) {
  const [hours, minutes] = (dom.endTime.value || "23:00").split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}

function availableSeconds(now = new Date()) {
  if (timeMode() === "endTime") return (endTimeTarget(now) - now) / 1000;
  return Math.max(0, readNumber(dom.hours)) * 3600 + Math.max(0, readNumber(dom.minutes)) * 60;
}

function refreshEndTimeHint() {
  if (timeMode() !== "endTime") return;
  const now = new Date();
  const target = endTimeTarget(now);
  const isMidnight = target.getHours() === 0 && target.getMinutes() === 0;
  const isTomorrow = target.getDate() !== now.getDate() && !isMidnight;
  const suffix = isMidnight ? " avant la fin de la journée" : isTomorrow ? " (demain)" : "";
  dom.endTimeHint.textContent = `Il te reste ${formatDuration((target - now) / 1000)}${suffix}.`;
}

function showTimeMode() {
  dom.durationBox.hidden = timeMode() !== "duration";
  dom.endTimeBox.hidden = timeMode() !== "endTime";
  refreshEndTimeHint();
}

function setTimeMode(mode) {
  dom.form.querySelector(`input[name="timeMode"][value="${mode}"]`).checked = true;
  showTimeMode();
}

function initTimeBudget() {
  for (const radio of dom.form.elements.timeMode) {
    radio.addEventListener("change", () => { showTimeMode(); onFormChange(); });
  }
  dom.endTime.addEventListener("input", refreshEndTimeHint);

  dom.timeShortcuts.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if ("untilMidnight" in button.dataset) {
      // Fin de la journée en cours : heure de fin à minuit.
      dom.endTime.value = "00:00";
      setTimeMode("endTime");
    } else {
      const totalMinutes = Number(button.dataset.minutes);
      dom.hours.value = Math.floor(totalMinutes / 60);
      dom.minutes.value = totalMinutes % 60;
    }
    onFormChange();
  });

  // En mode heure de fin, le temps restant baisse : on rafraîchit l'indication et le résultat.
  setInterval(() => {
    refreshEndTimeHint();
    if (state.hasCalculated && timeMode() === "endTime") calculate();
  }, END_TIME_REFRESH_MS);
}
