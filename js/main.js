/**
 * Clima Quillota — Configuración central Rank & Rent
 * Cambia estos valores al arrendar la marca sin tocar el HTML/SEO estructural.
 */
const SITE_CONFIG = {
  brandName: "Clima Quillota",
  email: "eduardorojas@outlook.cl",
  domain: "https://climatizacionquillota.cl/",
  city: "Quillota",
  topbar:
    "Técnicos de climatización en Quillota • Cotiza por formulario y te respondemos por correo",
  businessHours: "Lunes a sábado 08:30–19:00",
  /** FormSubmit entrega el lead al correo sin backend propio */
  formEndpoint: "https://formsubmit.co/ajax/eduardorojas@outlook.cl",
};

const BTU_SIZES = [9000, 12000, 18000, 24000];

const RECINTO_FACTOR = {
  dormitorio: 600,
  living: 750,
  oficina: 850,
};

const RADIACION_FACTOR = {
  baja: 1.0,
  media: 1.2,
  alta: 1.4,
};

const RECINTO_LABEL = {
  dormitorio: "dormitorio",
  living: "living-comedor",
  oficina: "oficina/local",
};

const RADIACION_LABEL = {
  baja: "baja",
  media: "media",
  alta: "alta (segundo piso / sol intenso)",
};

/* ——— Utils ——— */
function formatBTU(value) {
  return value.toLocaleString("es-CL");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function trackEvent(name, detail = {}) {
  const payload = {
    event: name,
    brand: SITE_CONFIG.brandName,
    timestamp: new Date().toISOString(),
    ...detail,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", name, detail);
  }

  if (typeof console !== "undefined" && console.debug) {
    console.debug("[track]", payload);
  }
}

function applySiteConfig() {
  document.querySelectorAll('[data-config="brandName"]').forEach((el) => {
    el.textContent = SITE_CONFIG.brandName;
  });

  document.querySelectorAll('[data-config="topbar"]').forEach((el) => {
    el.textContent = SITE_CONFIG.topbar;
  });

  document.querySelectorAll('[data-config="email"]').forEach((el) => {
    el.textContent = SITE_CONFIG.email;
    if (el.tagName === "A") {
      el.setAttribute("href", `mailto:${SITE_CONFIG.email}`);
    }
  });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

/* ——— Navegación móvil ——— */
function initMobileNav() {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__toggle");
  const panel = document.getElementById("nav-menu");
  if (!nav || !toggle || !panel) return;

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  };

  const open = () => {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
  };

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) {
      close();
    } else {
      open();
      trackEvent("nav_menu_open");
    }
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => close());
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) close();
  });
}

/* ——— FAQ: un ítem abierto a la vez (acordeón) ——— */
function initFaqAccordion() {
  const root = document.querySelector("[data-accordion]");
  if (!root) return;

  const items = Array.from(root.querySelectorAll("details.faq__item"));

  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;

      items.forEach((other) => {
        if (other !== item) other.open = false;
      });

      const question = item.querySelector("h3")?.textContent?.trim() || "";
      trackEvent("faq_open", { question });
    });
  });
}

/* ——— Calculadora BTU ——— */
function getAreaM2(form) {
  const modo = form.querySelector('input[name="modo"]:checked')?.value || "dimensiones";

  if (modo === "metros") {
    const m2 = parseFloat(form.m2.value);
    return Number.isFinite(m2) && m2 > 0 ? m2 : 0;
  }

  const largo = parseFloat(form.largo.value);
  const ancho = parseFloat(form.ancho.value);
  if (!Number.isFinite(largo) || !Number.isFinite(ancho) || largo <= 0 || ancho <= 0) {
    return 0;
  }
  return largo * ancho;
}

function recommendBTU(m2, radiacion, recinto) {
  const base = RECINTO_FACTOR[recinto] || RECINTO_FACTOR.living;
  const mult = RADIACION_FACTOR[radiacion] || RADIACION_FACTOR.media;
  const raw = m2 * base * mult;

  let recommended = BTU_SIZES[BTU_SIZES.length - 1];
  for (const size of BTU_SIZES) {
    if (raw <= size) {
      recommended = size;
      break;
    }
  }

  const oversized = raw > 26000;
  return { raw, recommended, oversized, mult };
}

function buildAdvice({ m2, radiacion, recinto, recommended, oversized }) {
  const recintoTxt = RECINTO_LABEL[recinto] || "recinto";
  const radTxt = RADIACION_LABEL[radiacion] || "media";

  if (oversized) {
    return `Tu espacio (~${m2.toFixed(1)} m²) con radiación ${radTxt} puede requerir más de un equipo o un multi-split. Partimos la cotización en 24.000 BTU y evaluamos en terreno.`;
  }

  if (recommended <= 9000) {
    return `Para ${recintoTxt} compacto (~${m2.toFixed(1)} m²) con radiación ${radTxt}, un Split Inverter de 9.000 BTU suele bastar y mantiene bajo el consumo eléctrico en ${SITE_CONFIG.city}.`;
  }

  if (recommended === 12000) {
    return `Para ${recintoTxt} con radiación ${radTxt} en ${SITE_CONFIG.city}, un Split Inverter de 12.000 BTU equilibra confort y consumo eléctrico.`;
  }

  if (recommended === 18000) {
    return `Espacio amplio o con carga solar ${radTxt}: recomendamos 18.000 BTU Inverter para enfriar de forma estable en olas de calor del valle.`;
  }

  return `Alta demanda térmica (~${m2.toFixed(1)} m², radiación ${radTxt}). Un equipo de 24.000 BTU Inverter es la base correcta; validamos en visita si conviene multi-split.`;
}

function getLatestBTUSnapshot() {
  const form = document.getElementById("btu-form");
  if (!form) return null;

  const m2 = getAreaM2(form);
  if (m2 <= 0) return null;

  const radiacion = form.radiacion.value;
  const recinto = form.recinto.value;
  const result = recommendBTU(m2, radiacion, recinto);

  return {
    m2,
    radiacion,
    recinto,
    recommended: result.recommended,
    detalle: [
      `BTU recomendados: ${formatBTU(result.recommended)}`,
      `Espacio: ${m2.toFixed(1)} m²`,
      `Recinto: ${RECINTO_LABEL[recinto]}`,
      `Radiación: ${RADIACION_LABEL[radiacion]}`,
      `Cálculo bruto: ~${formatBTU(Math.round(result.raw))} BTU`,
    ].join(" | "),
  };
}

function updateBTUCalculator() {
  const form = document.getElementById("btu-form");
  const valueEl = document.getElementById("btu-value");
  const metaEl = document.getElementById("btu-meta");
  const adviceEl = document.getElementById("btu-advice");
  const cta = document.getElementById("btu-cta");
  if (!form || !valueEl || !metaEl || !adviceEl || !cta) return;

  const m2 = getAreaM2(form);
  const radiacion = form.radiacion.value;
  const recinto = form.recinto.value;

  if (m2 <= 0) {
    valueEl.textContent = "—";
    metaEl.textContent = "Ingresa las medidas del espacio";
    adviceEl.textContent =
      "Completa largo y ancho, o los m² totales, para calcular la potencia recomendada.";
    cta.textContent = "Cotizar equipo instalado en Quillota";
    return;
  }

  const result = recommendBTU(m2, radiacion, recinto);
  const btuLabel = formatBTU(result.recommended);

  valueEl.textContent = btuLabel;
  metaEl.textContent = `Espacio estimado: ${m2.toFixed(1)} m² · Carga térmica ${RADIACION_LABEL[radiacion]} · ~${formatBTU(Math.round(result.raw))} BTU calculados`;
  adviceEl.textContent = buildAdvice({
    m2,
    radiacion,
    recinto,
    recommended: result.recommended,
    oversized: result.oversized,
  });

  cta.textContent = `Cotizar equipo de ${btuLabel} BTU instalado en Quillota`;
}

function initBTUCalculator() {
  const form = document.getElementById("btu-form");
  const dims = document.getElementById("calc-dims");
  const m2Field = document.getElementById("calc-m2-field");
  const cta = document.getElementById("btu-cta");
  if (!form) return;

  const syncMode = () => {
    const modo = form.querySelector('input[name="modo"]:checked')?.value || "dimensiones";
    const isM2 = modo === "metros";
    if (dims) dims.hidden = isM2;
    if (m2Field) m2Field.classList.toggle("is-hidden", !isM2);
    updateBTUCalculator();
  };

  form.addEventListener("input", updateBTUCalculator);
  form.addEventListener("change", (e) => {
    if (e.target.name === "modo") {
      syncMode();
      trackEvent("btu_mode_change", { mode: e.target.value });
      return;
    }
    updateBTUCalculator();
  });

  if (cta) {
    cta.addEventListener("click", () => {
      const snap = getLatestBTUSnapshot();
      const quoteForm = document.getElementById("quote-form");

      if (snap && quoteForm) {
        quoteForm.servicio.value = "Instalación";
        if (snap.m2) quoteForm.metros.value = String(Math.round(snap.m2));

        const btuInput = document.getElementById("quote-btu");
        const detalleInput = document.getElementById("quote-detalle");
        if (btuInput) btuInput.value = `${formatBTU(snap.recommended)} BTU`;
        if (detalleInput) detalleInput.value = snap.detalle;

        const mensaje = quoteForm.mensaje;
        if (mensaje && !mensaje.value.trim()) {
          mensaje.value = `Quiero cotizar instalación de un Split Inverter de ${formatBTU(snap.recommended)} BTU. ${snap.detalle}`;
        }
      }

      trackEvent("btu_cta_click", {
        source: "btu_calculator",
        btu: document.getElementById("btu-value")?.textContent,
        m2: snap ? snap.m2.toFixed(1) : null,
      });
    });
  }

  syncMode();
}

function setQuoteStatus(type, message) {
  const status = document.getElementById("quote-status");
  if (!status) return;

  status.hidden = !message;
  status.textContent = message || "";
  status.className = `quote-form__status${type ? ` is-${type}` : ""}`;
}

/* ——— Formulario hero → correo (FormSubmit) ——— */
function initQuoteForm() {
  const form = document.getElementById("quote-form");
  const submitBtn = document.getElementById("quote-submit");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const sector = form.sector.value.trim();
    const servicio = form.servicio.value;
    const metros = form.metros.value.trim();
    const mensaje = form.mensaje?.value.trim() || "";
    const honeypot = form._gotcha?.value || "";

    if (honeypot) {
      setQuoteStatus("success", "Solicitud enviada. Te contactaremos por correo.");
      form.reset();
      return;
    }

    let valid = true;
    const checks = [
      [form.nombre, Boolean(nombre)],
      [form.email, isValidEmail(email)],
      [form.sector, Boolean(sector)],
      [form.servicio, Boolean(servicio)],
    ];

    checks.forEach(([input, ok]) => {
      input.closest(".field")?.classList.toggle("is-invalid", !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      trackEvent("quote_form_invalid");
      setQuoteStatus("error", "Revisa los campos marcados e intenta nuevamente.");
      form.querySelector(".is-invalid input, .is-invalid select")?.focus();
      return;
    }

    const snap = getLatestBTUSnapshot();
    const btuValue =
      document.getElementById("quote-btu")?.value ||
      (snap ? `${formatBTU(snap.recommended)} BTU` : "No calculado");
    const detalleValue =
      document.getElementById("quote-detalle")?.value ||
      (snap ? snap.detalle : "Sin cálculo BTU");

    const payload = {
      nombre,
      email,
      sector,
      servicio,
      metros: metros ? `${metros} m²` : "No indicado",
      mensaje: mensaje || "Sin mensaje adicional",
      btu_recomendados: btuValue,
      detalle_calculo: detalleValue,
      ciudad: SITE_CONFIG.city,
      origen: SITE_CONFIG.domain,
      _subject: `Nueva cotización ${SITE_CONFIG.brandName} — ${servicio} — ${sector}`,
      _template: "table",
      _replyto: email,
      _captcha: "false",
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando…";
    }
    setQuoteStatus("pending", "Enviando tu cotización…");

    try {
      const response = await fetch(SITE_CONFIG.formEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      trackEvent("quote_form_submit", {
        servicio,
        sector,
        metros: metros || null,
        channel: "email",
      });

      form.reset();
      const btuInput = document.getElementById("quote-btu");
      const detalleInput = document.getElementById("quote-detalle");
      if (btuInput) btuInput.value = "";
      if (detalleInput) detalleInput.value = "";

      setQuoteStatus(
        "success",
        "Listo. Recibimos tu solicitud y te responderemos por correo a la brevedad."
      );
    } catch (err) {
      trackEvent("quote_form_error", { message: String(err) });
      setQuoteStatus(
        "error",
        `No pudimos enviar el formulario automáticamente. Escríbenos a ${SITE_CONFIG.email} o reintenta en unos minutos.`
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar cotización por correo";
      }
    }
  });
}

function initCTATracking() {
  document.querySelectorAll('a[href="#cotizar"]').forEach((el) => {
    el.addEventListener("click", () => {
      trackEvent("cta_cotizar_click", { source: el.className || "link" });
    });
  });
}

/* ——— Init ——— */
document.addEventListener("DOMContentLoaded", () => {
  applySiteConfig();
  initMobileNav();
  initFaqAccordion();
  initBTUCalculator();
  initQuoteForm();
  initCTATracking();
  trackEvent("page_view", { path: window.location.pathname });
});
