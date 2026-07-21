"use strict";

/* =========================================================
   KITCHEN EXPERIENCE
   Navigazione, selezioni, immagini e riepilogo
========================================================= */


/* =========================================================
   CONFIGURAZIONE IMMAGINI

   Se i file sono JPG, cambia "png" in "jpg".
   Se sono WEBP, cambia "png" in "webp".
========================================================= */

const IMAGE_EXTENSION = "webp";
const IMAGE_FOLDER = "images";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwW7nVov5MgaVSSPeIEVo3ccASdTVXAG8hu3EsiwleUFIHFfNw5xJfR4oaS0uo67CbCBg/exec";

/* =========================================================
   STATO DEL CONFIGURATORE
========================================================= */

const state = {
  screen: "intro",
  layout: null,
  front: null,
  top: null
};


/* =========================================================
   ETICHETTE VISIBILI
========================================================= */

const labels = {
  layout: {
    lineare: "Lineare",
    angolare: "Angolare",
    penisola: "Penisola",
    isola: "Isola"
  },

  front: {
    bianco: "Laccato bianco opaco",
    rovere: "Rovere naturale",
    antracite: "Laccato antracite opaco"
  },

  top: {
    chiaro: "Quarzo effetto pietra chiara",
    antracite: "Quarzo antracite"
  }
};


/* =========================================================
   CORRISPONDENZA TRA SCELTE E NOMI DEI FILE
========================================================= */

const imageValues = {
  front: {
    bianco: "chiaro",
    rovere: "naturale",
    antracite: "scuro"
  },

  top: {
    chiaro: "chiaro",
    antracite: "scuro"
  }
};


/* =========================================================
   ORDINE DELLE SCHERMATE
========================================================= */

const screenOrder = [
  "intro",
  "layout",
  "front",
  "top",
  "contact",
  "success"
];


/* =========================================================
   PASSI VISIBILI
========================================================= */

const stepMap = {
  intro: 1,
  layout: 1,
  front: 2,
  top: 3,
  contact: 4,
  success: 4
};


/* =========================================================
   ELEMENTI HTML
========================================================= */

const screens = document.querySelectorAll(".screen");
const stepDots = document.querySelectorAll(".step-dot");

const selectionCards = document.querySelectorAll(
  ".option-card, .material-card"
);

const startButton = document.getElementById("start-button");
const layoutNextButton = document.getElementById("layout-next");
const frontNextButton = document.getElementById("front-next");
const topNextButton = document.getElementById("top-next");
const restartButton = document.getElementById("restart-button");

const backButtons = document.querySelectorAll(
  '[data-action="back"]'
);

const contactForm = document.getElementById("contact-form");

const stepIndicator = document.getElementById("step-indicator");
const stepCopy = document.getElementById("step-copy");

const layoutError = document.getElementById("layout-error");
const frontError = document.getElementById("front-error");
const topError = document.getElementById("top-error");
const contactError = document.getElementById("contact-error");

const summaryLayout = document.getElementById("summary-layout");
const summaryFront = document.getElementById("summary-front");
const summaryTop = document.getElementById("summary-top");

const visualTitle = document.getElementById("visual-title");
const renderStage = document.getElementById("render-stage");
const successLayout = document.getElementById("success-layout");
const successFront = document.getElementById("success-front");
const successTop = document.getElementById("success-top");
const chipLayout = document.getElementById("chip-layout");
const chipFront = document.getElementById("chip-front");
const chipTop = document.getElementById("chip-top");
const controlPanel = document.getElementById("control-panel");
const visualPanel = document.getElementById("visual-panel");

const renderPlaceholder = document.getElementById(
  "render-placeholder"
);

const kitchenRender = document.getElementById("kitchen-render");
const renderLoader = document.getElementById("render-loader");
const renderMessage = document.getElementById("render-message");
const renderStatusCopy = document.getElementById("render-status-copy");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const privacyInput = document.getElementById("privacy");


/* =========================================================
   NAVIGAZIONE
========================================================= */

function showScreen(screenName) {
  if (!screenOrder.includes(screenName)) {
    return;
  }

  state.screen = screenName;
  document.body.dataset.screen = screenName;

  if (controlPanel) {
    controlPanel.dataset.step = screenName;
  }

  if (visualPanel) {
    visualPanel.dataset.step = screenName;
  }

  screens.forEach((screen) => {
    const isActive = screen.dataset.screen === screenName;

    screen.classList.toggle("active-screen", isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
  });

  updateProgress();
  updateSummary();
  updateVisualPanel();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function goBack() {
  const currentIndex = screenOrder.indexOf(state.screen);

  if (currentIndex <= 0) {
    return;
  }

  const previousScreen = screenOrder[currentIndex - 1];

  showScreen(previousScreen);
}


/* =========================================================
   INDICATORE DI AVANZAMENTO
========================================================= */

function updateProgress() {
  const currentStep = stepMap[state.screen] || 1;

  const stepLabels = {
    1: "01 · Layout",
    2: "02 · Ante",
    3: "03 · Top",
    4: "04 · Contatti"
  };

  stepCopy.textContent = stepLabels[currentStep];

  stepDots.forEach((dot, index) => {
    dot.classList.toggle("active", index < currentStep);
  });

  stepIndicator.hidden =
    state.screen === "intro" ||
    state.screen === "success";
}


/* =========================================================
   SELEZIONE DELLE CARD
========================================================= */

function selectCard(card) {
  const group = card.dataset.group;
  const value = card.dataset.value;

  if (!group || !value || !(group in state)) {
    return;
  }

  state[group] = value;

  updateSelectedCards(group, value);
  hideSelectionError(group);
  updateContinueButtons();
  updateSummary();
  updateVisualPanel();
}


function updateSelectedCards(group, selectedValue) {
  const groupCards = document.querySelectorAll(
    `[data-group="${group}"]`
  );

  groupCards.forEach((card) => {
    const isSelected =
      card.dataset.value === selectedValue;

    card.classList.toggle("selected", isSelected);

    card.setAttribute(
      "aria-pressed",
      String(isSelected)
    );
  });
}


function hideSelectionError(group) {
  const errors = {
    layout: layoutError,
    front: frontError,
    top: topError
  };

  if (errors[group]) {
    errors[group].hidden = true;
  }
}


function updateContinueButtons() {
  layoutNextButton.disabled = !state.layout;
  frontNextButton.disabled = !state.front;
  topNextButton.disabled = !state.top;
}


/* =========================================================
   RIEPILOGO
========================================================= */

function updateSummary() {
  summaryLayout.textContent = state.layout
    ? labels.layout[state.layout]
    : "Da scegliere";

  summaryFront.textContent = state.front
    ? labels.front[state.front]
    : "Da scegliere";

  summaryTop.textContent = state.top
    ? labels.top[state.top]
    : "Da scegliere";

  if (successLayout) {
    successLayout.textContent = state.layout ? labels.layout[state.layout] : "—";
  }

  if (successFront) {
    successFront.textContent = state.front ? labels.front[state.front] : "—";
  }

  if (successTop) {
    successTop.textContent = state.top ? labels.top[state.top] : "—";
  }

  if (chipLayout) {
    chipLayout.textContent = state.layout ? labels.layout[state.layout] : "Layout";
  }

  if (chipFront) {
    chipFront.textContent = state.front ? labels.front[state.front] : "Ante";
  }

  if (chipTop) {
    chipTop.textContent = state.top ? labels.top[state.top] : "Top";
  }
}


/* =========================================================
   COSTRUZIONE DEL NOME DELL'IMMAGINE
========================================================= */

function getRenderFilename() {
  if (!state.layout) {
    return null;
  }

  /*
    Dopo la scelta del solo layout:
    lineare_base.png
    angolare_base.png
    penisola_base.png
    isola_base.png
  */

  if (!state.front) {
    return `${state.layout}_base`;
  }

  const frontValue = imageValues.front[state.front];

  /*
    Dopo la scelta delle ante utilizziamo temporaneamente
    il top chiaro, finché l'utente non sceglie il top.
  */

  const topValue = state.top
    ? imageValues.top[state.top]
    : "chiaro";

  return `${state.layout}_${frontValue}_${topValue}`;
}


function getRenderPath() {
  const filename = getRenderFilename();

  if (!filename) {
    return null;
  }

  return `${IMAGE_FOLDER}/${filename}.${IMAGE_EXTENSION}`;
}


/* =========================================================
   AGGIORNAMENTO DELL'IMMAGINE
========================================================= */

function loadKitchenRender() {
  const imagePath = getRenderPath();

  if (!imagePath) {
    showRenderPlaceholder();
    return;
  }

  renderPlaceholder.hidden = true;
  renderMessage.hidden = true;
  renderLoader.hidden = false;

  if (renderStage) {
    renderStage.classList.remove("render-complete");
    renderStage.classList.add("is-loading");
  }

  const nextImage = new Image();

  nextImage.onload = () => {
    kitchenRender.classList.add("is-switching");

    window.setTimeout(() => {
      kitchenRender.src = imagePath;
      kitchenRender.alt = buildRenderAltText();
      kitchenRender.hidden = false;

      requestAnimationFrame(() => {
        kitchenRender.classList.remove("is-switching");
        kitchenRender.classList.add("is-visible");
      });

      renderLoader.hidden = true;

      if (renderStage) {
        renderStage.classList.remove("is-loading");
        renderStage.classList.remove("render-complete");
        void renderStage.offsetWidth;
        renderStage.classList.add("render-complete");
      }

      if (renderStatusCopy) {
        renderStatusCopy.textContent = state.top
          ? "Configurazione completa"
          : "Anteprima progetto";
      }
    }, 90);
  };

  nextImage.onerror = () => {
    renderLoader.hidden = true;
    kitchenRender.hidden = true;
    renderPlaceholder.hidden = false;
    renderMessage.hidden = false;

    if (renderStage) {
      renderStage.classList.remove("is-loading");
    }

    renderMessage.textContent = `Immagine non trovata: ${imagePath}`;
    console.error(`Kitchen Experience: immagine non trovata: ${imagePath}`);
  };

  nextImage.src = imagePath;
}


function buildRenderAltText() {
  if (!state.layout) {
    return "Anteprima della cucina";
  }

  let altText =
    `Cucina ${labels.layout[state.layout]}`;

  if (state.front) {
    altText +=
      ` con ante ${labels.front[state.front]}`;
  }

  if (state.top) {
    altText +=
      ` e top ${labels.top[state.top]}`;
  }

  return altText;
}


function showRenderPlaceholder() {
  kitchenRender.hidden = true;
  kitchenRender.classList.remove("is-switching", "is-visible");
  renderLoader.hidden = true;
  renderMessage.hidden = true;
  renderPlaceholder.hidden = false;

  if (renderStatusCopy) {
    renderStatusCopy.textContent = "Anteprima progetto";
  }

  if (renderStage) {
    renderStage.classList.remove("is-loading");
  }
}


/* =========================================================
   TESTI DEL PANNELLO VISIVO
========================================================= */

function updateVisualPanel() {
  const placeholderLabel =
    renderPlaceholder.querySelector("span");

  const placeholderTitle =
    renderPlaceholder.querySelector("strong");

  const placeholderText =
    renderPlaceholder.querySelector("p");

  if (state.screen === "intro") {
    showRenderPlaceholder();

    visualTitle.textContent =
      "La tua cucina prende forma.";

    placeholderLabel.textContent =
      "Atelier Casa Milano";

    placeholderTitle.textContent =
      "La tua cucina apparirà qui";

    placeholderText.textContent =
      "Inizia scegliendo la configurazione.";

    return;
  }

  if (!state.layout) {
    showRenderPlaceholder();

    visualTitle.textContent =
      "Scegli la configurazione della cucina.";

    placeholderLabel.textContent =
      "Passo 1";

    placeholderTitle.textContent =
      "Quale cucina immagini?";

    placeholderText.textContent =
      "Seleziona una delle configurazioni disponibili.";

    return;
  }

  if (!state.front) {
    visualTitle.textContent =
      `${labels.layout[state.layout]} · Scelta delle ante`;
  } else if (!state.top) {
    visualTitle.textContent =
      `${labels.layout[state.layout]} · ${labels.front[state.front]}`;
  } else {
    visualTitle.textContent =
      `${labels.layout[state.layout]} · Configurazione completa`;
  }

  loadKitchenRender();
}


/* =========================================================
   VALIDAZIONE DEI PASSAGGI
========================================================= */

function validateSelection(group) {
  const errors = {
    layout: layoutError,
    front: frontError,
    top: topError
  };

  const isValid = Boolean(state[group]);

  if (errors[group]) {
    errors[group].hidden = isValid;
  }

  return isValid;
}


/* =========================================================
   VALIDAZIONE DEL FORM
========================================================= */

function isValidEmail(email) {
  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email.trim());
}


function isValidPhone(phone) {
  const cleanedPhone = phone.replace(
    /[\s()+.-]/g,
    ""
  );

  return /^[0-9]{7,15}$/.test(cleanedPhone);
}


function validateContactForm() {
  const nameIsValid =
    nameInput.value.trim().length >= 2;

  const phoneIsValid =
    isValidPhone(phoneInput.value);

  const emailIsValid =
    isValidEmail(emailInput.value);

  const privacyIsValid =
    privacyInput.checked;

  nameInput.classList.toggle(
    "invalid",
    !nameIsValid
  );

  phoneInput.classList.toggle(
    "invalid",
    !phoneIsValid
  );

  emailInput.classList.toggle(
    "invalid",
    !emailIsValid
  );

  const formIsValid =
    nameIsValid &&
    phoneIsValid &&
    emailIsValid &&
    privacyIsValid;

  contactError.hidden = formIsValid;

  return formIsValid;
}


/* =========================================================
   RESET
========================================================= */

function resetExperience() {
  state.screen = "intro";
  state.layout = null;
  state.front = null;
  state.top = null;

  selectionCards.forEach((card) => {
    card.classList.remove("selected");

    card.setAttribute(
      "aria-pressed",
      "false"
    );
  });

  contactForm.reset();

  nameInput.classList.remove("invalid");
  phoneInput.classList.remove("invalid");
  emailInput.classList.remove("invalid");

  layoutError.hidden = true;
  frontError.hidden = true;
  topError.hidden = true;
  contactError.hidden = true;

  kitchenRender.removeAttribute("src");

  updateContinueButtons();
  updateSummary();
  showScreen("intro");
}


/* =========================================================
   PRECARICAMENTO DELLE IMMAGINI BASE
========================================================= */

function preloadBaseImages() {
  const layouts = [
    "lineare",
    "angolare",
    "penisola",
    "isola"
  ];

  layouts.forEach((layout) => {
    const image = new Image();

    image.src =
      `${IMAGE_FOLDER}/${layout}_base.${IMAGE_EXTENSION}`;
  });
}


/* =========================================================
   EVENTI
========================================================= */

startButton.addEventListener("click", () => {
  showScreen("layout");
});


selectionCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectCard(card);
  });
});


layoutNextButton.addEventListener("click", () => {
  if (!validateSelection("layout")) {
    return;
  }

  showScreen("front");
});


frontNextButton.addEventListener("click", () => {
  if (!validateSelection("front")) {
    return;
  }

  showScreen("top");
});


topNextButton.addEventListener("click", () => {
  if (!validateSelection("top")) {
    return;
  }

  showScreen("contact");
});


backButtons.forEach((button) => {
  button.addEventListener("click", () => {
    goBack();
  });
});


contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateContactForm()) {
    return;
  }

  const submitButton =
    contactForm.querySelector('button[type="submit"]');

  const originalButtonContent =
    submitButton.innerHTML;

  const leadData = {
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    layout: labels.layout[state.layout] || state.layout,
    front: labels.front[state.front] || state.front,
    top: labels.top[state.top] || state.top
  };

  submitButton.disabled = true;
  submitButton.textContent = "Invio in corso...";

  contactError.hidden = true;

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(leadData)
    });

    showScreen("success");

  } catch (error) {
    console.error(error);

    contactError.textContent =
      "Non è stato possibile inviare la richiesta. Riprova.";

    contactError.hidden = false;

  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
  }
});


restartButton.addEventListener("click", () => {
  resetExperience();
});


[nameInput, phoneInput, emailInput].forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("invalid");
    contactError.hidden = true;
  });
});


privacyInput.addEventListener("change", () => {
  contactError.hidden = true;
});


/* =========================================================
   AVVIO
========================================================= */

preloadBaseImages();
updateContinueButtons();
updateSummary();
showScreen("intro");