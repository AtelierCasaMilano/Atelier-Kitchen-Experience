"use strict";

const BOOKING_URL = "https://atelier-prenotazioni-telefoniche.vercel.app";
const LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbw-qR_Gxu0ep4SKYcmO2ZlM8ZjNS1-Orzex9XnrLVN7tC2x3RgRsxMGwOS2zjxfqUBp3g/exec";

const screenOrder = ["intro", "layout", "look", "top", "project", "contact"];
const progressByScreen = { intro: 0, layout: 10, look: 30, top: 50, project: 70, contact: 88, result: 100 };
const statusByScreen = {
  intro: "Inizia il tuo progetto",
  layout: "Scegli la composizione",
  look: "La tua cucina sta prendendo forma",
  top: "Definiamo gli ultimi dettagli",
  project: "Raccontaci il tuo progetto",
  contact: "Quasi finito",
  result: "Progetto completato ✓"
};

const labels = {
  layout: { lineare: "Lineare", angolare: "Angolare", penisola: "Penisola", isola: "Isola" },
  look: { chiaro: "Luminosa", naturale: "Calda e naturale", scuro: "Elegante e decisa" },
  top: { chiaro: "Pietra chiara", scuro: "Pietra antracite" }
};

const state = {
  layout: "",
  look: "",
  top: "",
  budget: "",
  timing: "",
  projectType: ""
};

let currentScreen = "intro";
let screenTimer;
let renderRequest = 0;

const progressFill = document.getElementById("progress-fill");
const progressPercent = document.getElementById("progress-percent");
const progressStatus = document.getElementById("progress-status");
const renderImage = document.getElementById("kitchen-render");
const renderPlaceholder = document.getElementById("render-placeholder");
const renderLoader = document.getElementById("render-loader");
const renderMessage = document.getElementById("render-message");
const projectNote = document.getElementById("project-note");
const backButtons = [...document.querySelectorAll("[data-back-button]")];

function setProgress(screen) {
  const value = progressByScreen[screen] ?? 0;
  progressFill.style.width = `${value}%`;
  progressPercent.textContent = `${value}%`;
  progressStatus.textContent = statusByScreen[screen] ?? "";
}

function showScreen(name) {
  if (name === currentScreen) return;
  const current = document.querySelector(`[data-screen="${currentScreen}"]`);
  const next = document.querySelector(`[data-screen="${name}"]`);
  if (!next) return;

  window.clearTimeout(screenTimer);
  current?.classList.add("screen-leaving");

  screenTimer = window.setTimeout(() => {
    document.querySelectorAll("[data-screen]").forEach((screen) => {
      screen.classList.remove("active-screen", "screen-leaving");
    });
    next.classList.add("active-screen");
    currentScreen = name;
    setProgress(name);
    backButtons.forEach((button) => { button.hidden = name === "intro"; });
  }, 210);
}

function imagePathForCurrentState() {
  if (!state.layout) return "";

  // Primo passaggio: mostriamo il modello neutro della composizione scelta.
  if (!state.look) return `images/${state.layout}_base.webp`;

  // Secondo passaggio: applichiamo l'atmosfera con un top chiaro provvisorio.
  const top = state.top || "chiaro";
  return `images/${state.layout}_${state.look}_${top}.webp`;
}

function updateSummary(changedGroup = "") {
  ["layout", "look", "top"].forEach((group) => {
    const value = state[group];
    const output = document.getElementById(`summary-${group}`);
    const card = document.querySelector(`[data-summary="${group}"]`);
    output.textContent = value ? labels[group][value] : "Da scegliere";
    card.classList.toggle("completed", Boolean(value));
    if (group === changedGroup) {
      card.classList.remove("pulse");
      void card.offsetWidth;
      card.classList.add("pulse");
    }
  });

  const completed = [state.layout, state.look, state.top].filter(Boolean).length;
  const notes = [
    "Scegli una composizione per iniziare a dare forma al progetto.",
    "Hai scelto la forma della tua cucina. Ora definiamone lo stile.",
    "Perfetto. Adesso scegli il piano di lavoro che preferisci.",
    "La configurazione visiva è completa."
  ];
  projectNote.textContent = notes[completed];
}

function updateRender(changedGroup = "") {
  updateSummary(changedGroup);
  const imagePath = imagePathForCurrentState();
  if (!imagePath) return;

  const visualTitle = document.getElementById("visual-title");
  if (!state.look) {
    visualTitle.textContent = "La forma della tua cucina.";
  } else if (!state.top) {
    visualTitle.textContent = "La tua cucina prende vita.";
  } else {
    visualTitle.textContent = "La tua cucina prende forma.";
  }

  const requestId = ++renderRequest;
  renderLoader.hidden = false;
  renderMessage.hidden = true;
  renderImage.classList.add("fading");

  const preload = new Image();
  preload.onload = () => {
    if (requestId !== renderRequest) return;
    renderImage.src = imagePath;
    renderImage.hidden = false;
    renderPlaceholder.hidden = true;
    requestAnimationFrame(() => renderImage.classList.remove("fading"));
    renderLoader.hidden = true;
  };
  preload.onerror = () => {
    if (requestId !== renderRequest) return;
    renderLoader.hidden = true;
    renderImage.classList.remove("fading");
    renderMessage.textContent = `Immagine non trovata: ${imagePath}`;
    renderMessage.hidden = false;
  };
  preload.src = imagePath;
}

function selectOption(button) {
  const { group, value } = button.dataset;
  state[group] = value;

  document.querySelectorAll(`[data-group="${group}"]`).forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
  updateRender(group);

  const nextByGroup = { layout: "look", look: "top", top: "project" };
  window.setTimeout(() => showScreen(nextByGroup[group]), 360);
}

function validateProject() {
  const requiredFields = ["budget", "timing", "projectType"];
  const valid = requiredFields.every((field) => Boolean(state[field]));

  requiredFields.forEach((field) => {
    const group = document.querySelector(`[data-project-group="${field}"]`);
    group?.classList.toggle("has-error", !state[field]);
  });

  document.getElementById("project-error").hidden = valid;
  return valid;
}

function validateContact() {
  const fieldIds = ["first-name", "last-name", "email", "phone", "city"];
  let valid = true;

  fieldIds.forEach((id) => {
    const field = document.getElementById(id);
    field.style.borderColor = "";
    if (!field.value.trim()) {
      field.style.borderColor = "#a44343";
      valid = false;
    }
  });

  const email = document.getElementById("email");
  if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    email.style.borderColor = "#a44343";
    valid = false;
  }

  if (!document.getElementById("privacy").checked) valid = false;
  document.getElementById("contact-error").hidden = valid;
  return valid;
}

function collectLeadData() {
  return {
    layout: labels.layout[state.layout] || state.layout,
    atmosfera: labels.look[state.look] || state.look,
    top: labels.top[state.top] || state.top,
    budget: state.budget,
    tempistiche: state.timing,
    tipoProgetto: state.projectType,
    nome: document.getElementById("first-name").value.trim(),
    cognome: document.getElementById("last-name").value.trim(),
    telefono: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    comune: document.getElementById("city").value.trim(),
    planimetria: planInput.files?.[0]?.name || "",
    consulenzaPrenotata: "No",
    note: ""
  };
}

async function saveLead() {
  const response = await fetch(LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(collectLeadData()),
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Invio non riuscito (${response.status}).`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Il progetto non è stato salvato.");
  }
  return result;
}

function showResult(projectId = "") {
  setProgress("result");
  document.getElementById("result-layout").textContent = labels.layout[state.layout];
  document.getElementById("result-look").textContent = labels.look[state.look];
  document.getElementById("result-top").textContent = labels.top[state.top];
  document.getElementById("booking-link").href = BOOKING_URL;
  const projectIdElement = document.getElementById("result-project-id");
  if (projectIdElement) {
    projectIdElement.textContent = projectId;
    projectIdElement.closest("div").hidden = !projectId;
  }
  document.getElementById("result-card").hidden = false;
  backButtons.forEach((button) => { button.hidden = true; });
}

document.getElementById("start-button").addEventListener("click", () => showScreen("layout"));

document.querySelectorAll("[data-group][data-value]").forEach((button) => {
  button.addEventListener("click", () => selectOption(button));
});



document.querySelectorAll("[data-project-field]").forEach((button) => {
  button.addEventListener("click", () => {
    const field = button.dataset.projectField;
    state[field] = button.dataset.value;
    document.querySelectorAll(`[data-project-field="${field}"]`).forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    document.querySelector(`[data-project-group="${field}"]`)?.classList.remove("has-error");
    document.getElementById("project-error").hidden = true;
  });
});

const planInput = document.getElementById("planimetry");
const planUpload = document.getElementById("plan-upload");
const planFileName = document.getElementById("plan-file-name");

function updatePlanFileName() {
  const file = planInput.files?.[0];
  planFileName.textContent = file ? file.name : "Clicca oppure trascina qui il file";
}

planInput.addEventListener("change", updatePlanFileName);
["dragenter", "dragover"].forEach((eventName) => {
  planUpload.addEventListener(eventName, (event) => {
    event.preventDefault();
    planUpload.classList.add("dragging");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  planUpload.addEventListener(eventName, (event) => {
    event.preventDefault();
    planUpload.classList.remove("dragging");
  });
});
planUpload.addEventListener("drop", (event) => {
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  const transfer = new DataTransfer();
  transfer.items.add(files[0]);
  planInput.files = transfer.files;
  updatePlanFileName();
});

document.getElementById("project-next").addEventListener("click", () => {
  if (validateProject()) showScreen("contact");
});

document.getElementById("contact-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateContact()) return;

  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  const originalContent = submitButton.innerHTML;
  const errorMessage = document.getElementById("contact-error");

  submitButton.disabled = true;
  submitButton.classList.add("is-loading");
  submitButton.textContent = "Salvataggio in corso…";
  errorMessage.hidden = true;

  try {
    const result = await saveLead();
    showResult(result.id || "");
  } catch (error) {
    console.error(error);
    errorMessage.textContent = "Non siamo riusciti a salvare il progetto. Riprova tra qualche secondo.";
    errorMessage.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("is-loading");
    submitButton.innerHTML = originalContent;
  }
});

backButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = screenOrder.indexOf(currentScreen);
    if (index > 0) showScreen(screenOrder[index - 1]);
  });
});

document.getElementById("restart-button").addEventListener("click", () => window.location.reload());

setProgress("intro");
updateSummary();
