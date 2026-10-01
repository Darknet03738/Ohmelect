const panel = document.getElementById("quickPanel");
const backdrop = document.getElementById("quickBackdrop");
const openButton = document.getElementById("quickOpen");
const closeButton = document.getElementById("quickClose");
const voltageInput = document.getElementById("voltage");
const resistanceInput = document.getElementById("resistance");
const currentOutput = document.getElementById("current");

if (panel && backdrop && openButton && closeButton) {
function setPanel(open) {
  panel.classList.toggle("open", open);
  backdrop.classList.toggle("open", open);
  panel.setAttribute("aria-hidden", String(!open));
  openButton.setAttribute("aria-expanded", String(open));

  if (open) {
    closeButton.focus();
  } else {
    openButton.focus();
  }
}

function calculateCurrent() {
  const voltage = Number(voltageInput.value);
  const resistance = Number(resistanceInput.value);
  const isValid = resistance > 0 && Number.isFinite(voltage);

  currentOutput.textContent = isValid ? `${(voltage / resistance).toFixed(2)} A` : "—";
}

openButton.addEventListener("click", () => setPanel(true));
closeButton.addEventListener("click", () => setPanel(false));
backdrop.addEventListener("click", () => setPanel(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && panel.classList.contains("open")) {
    setPanel(false);
  }
});
}

if (voltageInput && resistanceInput && currentOutput) {
  voltageInput.addEventListener("input", calculateCurrent);
  resistanceInput.addEventListener("input", calculateCurrent);
}

const numberFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const quickNumber = (id) => Number(document.getElementById(id)?.value);
const setQuickText = (id, value) => {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
};
const formatQuick = (value, unit = "") => Number.isFinite(value)
  ? `${numberFormat.format(value)}${unit ? ` ${unit}` : ""}`
  : "—";

const quickLinks = document.querySelectorAll("[data-calc]");
const quickCalculators = document.querySelectorAll("[data-calc-panel]");

quickLinks.forEach((button) => {
  button.addEventListener("click", () => {
    quickLinks.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    quickCalculators.forEach((calculator) => {
      const selected = calculator.dataset.calcPanel === button.dataset.calc;
      calculator.hidden = !selected;
      calculator.classList.toggle("active", selected);
    });
  });
});

function calculateOhmQuick() {
  const target = document.getElementById("ohmTarget")?.value || "I";
  const system = document.getElementById("ohmSystem")?.value || "dc";
  const methodIndex = Number(document.getElementById("ohmMethod")?.value || 0);
  const method = getOhmMethods(target, system)[methodIndex];
  if (!method) return;
  const a = quickNumber("ohmValueA");
  const b = quickNumber("ohmValueB");
  const c = quickNumber("ohmValueC");
  const result = method.calculate(a, b, c);
  setQuickText("ohmResultLabel", `${ohmNames[target].name} calculada`);
  setQuickText("ohmResult", Number.isFinite(result) && result >= 0 ? formatQuick(result, ohmNames[target].unit) : "Revisa los datos");
  setQuickText("ohmFormula", method.formula);
}

const ohmNames = {
  V: { name: "Tensión", unit: "V" }, I: { name: "Corriente", unit: "A" },
  R: { name: "Resistencia", unit: "Ω" }, P: { name: "Potencia", unit: "W" },
  PF: { name: "Factor de potencia", unit: "cosφ" }
};

const ohmMethods = {
  V: [
    { known: ["I", "R"], formula: "V = I × R", calculate: (i, r) => i * r },
    { known: ["P", "I"], formula: "V = P / I", calculate: (p, i) => i > 0 ? p / i : NaN },
    { known: ["P", "R"], formula: "V = √(P × R)", calculate: (p, r) => p >= 0 && r >= 0 ? Math.sqrt(p * r) : NaN },
    { known: ["P", "I", "PF"], formula: "V = P / (I × cosφ) · monofásico", calculate: (p, i, pf) => i > 0 && pf > 0 ? p / (i * pf) : NaN },
    { known: ["P", "I", "PF"], formula: "V = P / (√3 × I × cosφ) · trifásico", calculate: (p, i, pf) => i > 0 && pf > 0 ? p / (Math.sqrt(3) * i * pf) : NaN }
  ],
  I: [
    { known: ["V", "R"], formula: "I = V / R", calculate: (v, r) => r > 0 ? v / r : NaN },
    { known: ["P", "V"], formula: "I = P / V", calculate: (p, v) => v > 0 ? p / v : NaN },
    { known: ["P", "R"], formula: "I = √(P / R)", calculate: (p, r) => p >= 0 && r > 0 ? Math.sqrt(p / r) : NaN },
    { known: ["P", "V", "PF"], formula: "I = P / (V × cosφ) · monofásico", calculate: (p, v, pf) => v > 0 && pf > 0 ? p / (v * pf) : NaN },
    { known: ["P", "V", "PF"], formula: "I = P / (√3 × V × cosφ) · trifásico", calculate: (p, v, pf) => v > 0 && pf > 0 ? p / (Math.sqrt(3) * v * pf) : NaN }
  ],
  R: [
    { known: ["V", "I"], formula: "R = V / I", calculate: (v, i) => i > 0 ? v / i : NaN },
    { known: ["V", "P"], formula: "R = V² / P", calculate: (v, p) => p > 0 ? v ** 2 / p : NaN },
    { known: ["P", "I"], formula: "R = P / I²", calculate: (p, i) => i !== 0 ? p / i ** 2 : NaN }
  ],
  P: [
    { known: ["V", "I"], formula: "P = V × I", calculate: (v, i) => v * i },
    { known: ["V", "R"], formula: "P = V² / R", calculate: (v, r) => r > 0 ? v ** 2 / r : NaN },
    { known: ["I", "R"], formula: "P = I² × R", calculate: (i, r) => i ** 2 * r },
    { known: ["V", "I", "PF"], formula: "P = V × I × cosφ · monofásico", calculate: (v, i, pf) => v * i * pf },
    { known: ["V", "I", "PF"], formula: "P = √3 × V × I × cosφ · trifásico", calculate: (v, i, pf) => Math.sqrt(3) * v * i * pf }
  ]
};

function getOhmMethods(target, system) {
  const methods = ohmMethods[target] || [];
  const resistiveMethods = methods.slice(0, 3);
  if (target === "R" || system === "dc") return resistiveMethods;
  const acMethod = system === "single" ? methods[3] : methods[4];
  return acMethod ? [...resistiveMethods, acMethod] : resistiveMethods;
}

function updateOhmSystem() {
  populateOhmMethods();
}

function populateOhmMethods() {
  const target = document.getElementById("ohmTarget")?.value || "I";
  const system = document.getElementById("ohmSystem")?.value || "dc";
  const select = document.getElementById("ohmMethod");
  if (!select) return;
  select.innerHTML = getOhmMethods(target, system).map((method, index) => `<option value="${index}">${method.formula}</option>`).join("");
  updateOhmFields();
}

function updateOhmFields() {
  const target = document.getElementById("ohmTarget")?.value || "I";
  const system = document.getElementById("ohmSystem")?.value || "dc";
  const method = getOhmMethods(target, system)[Number(document.getElementById("ohmMethod")?.value || 0)];
  if (!method) return;
  setQuickText("ohmLabelA", `${ohmNames[method.known[0]].name} (${ohmNames[method.known[0]].unit})`);
  setQuickText("ohmLabelB", `${ohmNames[method.known[1]].name} (${ohmNames[method.known[1]].unit})`);
  const fieldC = document.getElementById("ohmFieldC");
  if (fieldC) fieldC.hidden = method.known.length < 3;
  if (method.known[2]) setQuickText("ohmLabelC", `${ohmNames[method.known[2]].name} (${ohmNames[method.known[2]].unit})`);
  calculateOhmQuick();
}

function updatePowerFields() {
  const system = document.getElementById("powerSystem")?.value || "single";
  const targetSelect = document.getElementById("powerTarget");
  const pfOption = targetSelect?.querySelector('option[value="PF"]');
  if (pfOption) pfOption.disabled = system === "dc";
  if (system === "dc" && targetSelect?.value === "PF") targetSelect.value = "P";
  const target = targetSelect?.value || "P";
  const labels = target === "P" ? ["Tensión (V)", "Corriente (A)"]
    : target === "V" ? ["Potencia activa (W)", "Corriente (A)"]
    : target === "I" ? ["Potencia activa (W)", "Tensión (V)"]
    : ["Potencia activa (W)", "Tensión (V)"];
  setQuickText("powerLabelA", labels[0]);
  setQuickText("powerLabelB", labels[1]);
  setQuickText("powerPfLabel", target === "PF" ? "Corriente (A)" : "Factor de potencia");
  const pfField = document.getElementById("powerPfField");
  const pfInput = document.getElementById("powerPf");
  if (pfField) pfField.hidden = system === "dc" && target !== "PF";
  if (pfInput) {
    pfInput.min = target === "PF" ? "0" : "0.01";
    pfInput.step = target === "PF" ? "0.1" : "0.01";
    if (target === "PF") pfInput.removeAttribute("max");
    else pfInput.max = "1";
  }
  calculatePowerQuick();
}

function calculatePowerQuick() {
  const system = document.getElementById("powerSystem")?.value || "single";
  const target = document.getElementById("powerTarget")?.value || "P";
  const a = quickNumber("powerValueA");
  const b = quickNumber("powerValueB");
  const third = quickNumber("powerPf");
  const phaseFactor = system === "three" ? Math.sqrt(3) : 1;
  const pf = system === "dc" ? 1 : third;
  let result = NaN;
  let unit = "";
  let label = "";
  if (target === "P") { result = phaseFactor * a * b * pf; unit = "W"; label = "Potencia activa"; }
  if (target === "V") { result = b > 0 && pf > 0 ? a / (phaseFactor * b * pf) : NaN; unit = "V"; label = "Tensión"; }
  if (target === "I") { result = b > 0 && pf > 0 ? a / (phaseFactor * b * pf) : NaN; unit = "A"; label = "Corriente"; }
  if (target === "PF") { result = phaseFactor * b * third > 0 ? a / (phaseFactor * b * third) : NaN; unit = ""; label = "Factor de potencia"; }
  const valid = Number.isFinite(result) && result >= 0 && (target !== "PF" || result <= 1) && (system === "dc" || target === "PF" || (pf > 0 && pf <= 1));
  setQuickText("powerResultLabel", label);
  setQuickText("powerResult", valid ? formatQuick(result, unit) : "Revisa los datos");
  if (target === "P" && valid && system !== "dc") {
    const apparent = phaseFactor * a * b;
    const reactive = Math.sqrt(Math.max(0, apparent ** 2 - result ** 2));
    setQuickText("powerDetail", `${formatQuick(apparent / 1000, "kVA")} · ${formatQuick(reactive / 1000, "kVAr")}`);
  } else {
    setQuickText("powerDetail", system === "three" ? "Sistema trifásico · √3" : system === "single" ? "Sistema monofásico" : "Corriente continua");
  }
}

const unitGroups = {
  voltage: { µV: 1e-6, mV: 1e-3, V: 1, kV: 1e3, MV: 1e6 },
  current: { µA: 1e-6, mA: 1e-3, A: 1, kA: 1e3 },
  resistance: { µΩ: 1e-6, mΩ: 1e-3, Ω: 1, kΩ: 1e3, MΩ: 1e6, GΩ: 1e9 },
  conductance: { µS: 1e-6, mS: 1e-3, S: 1, kS: 1e3 },
  power: { mW: 1e-3, W: 1, kW: 1e3, MW: 1e6, hp: 745.699872 },
  reactivePower: { var: 1, kVAr: 1e3, MVAr: 1e6 },
  apparentPower: { VA: 1, kVA: 1e3, MVA: 1e6 },
  energy: { J: 1, Wh: 3600, kWh: 3.6e6, MWh: 3.6e9, cal: 4.184, BTU: 1055.05585 },
  charge: { µC: 1e-6, mC: 1e-3, C: 1, Ah: 3600, mAh: 3.6 },
  capacitance: { pF: 1e-12, nF: 1e-9, µF: 1e-6, mF: 1e-3, F: 1 },
  inductance: { µH: 1e-6, mH: 1e-3, H: 1 },
  frequency: { mHz: 1e-3, Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, rpm: 1 / 60 },
  resistivity: { "Ω·mm²/m": 1e-6, "Ω·m": 1, "Ω·cm": .01 },
  conductivity: { "µS/m": 1e-6, "mS/m": 1e-3, "S/m": 1, "kS/m": 1e3, "MS/m": 1e6 },
  electricField: { "V/m": 1, "V/cm": 100, "kV/m": 1e3, "kV/cm": 1e5 },
  illuminance: { lux: 1, "foot-candle": 10.7639104, phot: 1e4 },
  luminousFlux: { lm: 1, klm: 1e3 },
  luminousIntensity: { cd: 1, mcd: 1e-3 },
  luminance: { "cd/m²": 1, nit: 1, stilb: 1e4, "foot-lambert": 3.4262591 },
  torque: { "N·m": 1, "kgf·m": 9.80665, "lbf·ft": 1.35581795, "lbf·in": .112984829 },
  speed: { "rad/s": 1, rpm: 2 * Math.PI / 60, "°/s": Math.PI / 180 },
  force: { N: 1, kN: 1e3, kgf: 9.80665, lbf: 4.44822162 },
  pressure: { Pa: 1, kPa: 1e3, MPa: 1e6, bar: 1e5, psi: 6894.75729, atm: 101325 },
  length: { mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, in: .0254, ft: .3048, yd: .9144, mi: 1609.344 },
  area: { "mm²": 1e-6, "cm²": 1e-4, "m²": 1, ha: 1e4, "in²": .00064516, "ft²": .09290304 },
  volume: { mL: 1e-6, L: 1e-3, "m³": 1, "in³": .000016387064, "ft³": .0283168466, gal: .00378541178 },
  mass: { mg: 1e-6, g: 1e-3, kg: 1, t: 1e3, oz: .0283495231, lb: .45359237 },
  temperature: { "°C": 1, "°F": 1, K: 1 },
  angle: { "°": Math.PI / 180, rad: 1, grad: Math.PI / 200 },
  time: { ms: 1e-3, s: 1, min: 60, h: 3600, día: 86400 }
};

function calculateUnitsQuick() {
  const quantity = document.getElementById("unitQuantity")?.value;
  const from = document.getElementById("unitFrom")?.value;
  const to = document.getElementById("unitTo")?.value;
  const group = unitGroups[quantity];
  const value = quickNumber("unitValue");
  let result = group && from && to ? value * group[from] / group[to] : NaN;
  if (quantity === "temperature" && from && to) {
    const celsius = from === "°C" ? value : from === "°F" ? (value - 32) * 5 / 9 : value - 273.15;
    result = to === "°C" ? celsius : to === "°F" ? celsius * 9 / 5 + 32 : celsius + 273.15;
  }
  setQuickText("unitResult", formatQuick(result, to));
}

function populateUnitsQuick() {
  const quantity = document.getElementById("unitQuantity")?.value || "power";
  const units = Object.keys(unitGroups[quantity]);
  ["unitFrom", "unitTo"].forEach((id, index) => {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = units.map((unit, unitIndex) => `<option value="${unit}"${unitIndex === index ? " selected" : ""}>${unit}</option>`).join("");
  });
  calculateUnitsQuick();
}

const conductorData = {
  cu: [["14 AWG",15,8.286],["12 AWG",20,5.211],["10 AWG",30,3.277],["8 AWG",50,2.061],["6 AWG",65,1.296],["4 AWG",85,.815],["3 AWG",100,.646],["2 AWG",115,.513],["1 AWG",130,.406],["1/0 AWG",150,.322],["2/0 AWG",175,.255],["3/0 AWG",200,.202],["4/0 AWG",230,.161]],
  al: [["12 AWG",15,8.5],["10 AWG",25,5.35],["8 AWG",40,3.36],["6 AWG",50,2.11],["4 AWG",65,1.33],["3 AWG",75,1.05],["2 AWG",90,.835],["1 AWG",100,.662],["1/0 AWG",120,.525],["2/0 AWG",135,.416],["3/0 AWG",155,.33],["4/0 AWG",180,.261]]
};

function calculateConductorQuick() {
  const current = quickNumber("conductorCurrent");
  const length = quickNumber("conductorLength");
  const voltage = quickNumber("conductorVoltage");
  const material = document.getElementById("conductorMaterial")?.value || "cu";
  const factor = document.getElementById("conductorSystem")?.value === "three" ? Math.sqrt(3) : 2;
  if (!(current > 0 && length >= 0 && voltage > 0)) {
    setQuickText("conductorResult", "Revisa los datos");
    setQuickText("conductorDetail", "Ingresa valores válidos.");
    return;
  }
  const selected = conductorData[material].find((item) => item[1] >= current * 1.25 && factor * current * item[2] * length / 1000 / voltage * 100 <= 3);
  if (!selected) {
    setQuickText("conductorResult", "Superior a 4/0 AWG");
    setQuickText("conductorDetail", "La tabla rápida no cubre esta condición.");
    return;
  }
  const drop = factor * current * selected[2] * length / 1000 / voltage * 100;
  setQuickText("conductorResult", `${selected[0]} ${material === "cu" ? "Cu" : "Al"}`);
  setQuickText("conductorDetail", `Ampacidad ${selected[1]} A · ΔV ${numberFormat.format(drop)}%`);
}

function calculatePowerFactorQuick() {
  const power = quickNumber("pfPower");
  const initial = quickNumber("pfInitial");
  const target = quickNumber("pfTarget");
  const valid = power >= 0 && initial > 0 && initial < 1 && target > initial && target <= 1;
  const kvar = valid ? power * (Math.tan(Math.acos(initial)) - Math.tan(Math.acos(target))) : NaN;
  setQuickText("pfResult", valid ? formatQuick(kvar, "kVAr") : "Revisa los datos");
  setQuickText("pfDetail", valid ? `De ${numberFormat.format(initial)} a ${numberFormat.format(target)}` : "El FP objetivo debe ser mayor que el actual.");
}

const quickCalculationBindings = [
  [["ohmValueA", "ohmValueB", "ohmValueC"], calculateOhmQuick],
  [["powerValueA", "powerValueB", "powerPf"], calculatePowerQuick],
  [["unitValue", "unitFrom", "unitTo"], calculateUnitsQuick],
  [["conductorCurrent", "conductorLength", "conductorVoltage", "conductorMaterial", "conductorSystem"], calculateConductorQuick],
  [["pfPower", "pfInitial", "pfTarget"], calculatePowerFactorQuick]
];

quickCalculationBindings.forEach(([ids, calculation]) => ids.forEach((id) => {
  const element = document.getElementById(id);
  element?.addEventListener("input", calculation);
  element?.addEventListener("change", calculation);
}));

document.getElementById("unitQuantity")?.addEventListener("change", populateUnitsQuick);
document.getElementById("ohmTarget")?.addEventListener("change", populateOhmMethods);
document.getElementById("ohmSystem")?.addEventListener("change", updateOhmSystem);
document.getElementById("ohmMethod")?.addEventListener("change", updateOhmFields);
document.querySelectorAll("[data-ohm-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.ohmTarget;
    const select = document.getElementById("ohmTarget");
    if (!select || !target) return;
    select.value = target;
    document.querySelectorAll("[data-ohm-target]").forEach((item) => item.classList.toggle("active", item === button));
    populateOhmMethods();
  });
});
document.getElementById("powerSystem")?.addEventListener("change", updatePowerFields);
document.getElementById("powerTarget")?.addEventListener("change", updatePowerFields);
populateUnitsQuick();
updateOhmSystem();
updatePowerFields();
calculateConductorQuick();
calculatePowerFactorQuick();

const scientificExpression = document.getElementById("scientificExpression");
const scientificResult = document.getElementById("scientificResult");
const angleModeButton = document.getElementById("angleMode");
let angleMode = "DEG";

function evaluateScientific() {
  if (!scientificExpression || !scientificResult) return;
  const normalized = scientificExpression.value.toLowerCase().replaceAll("π", "pi").replaceAll("×", "*").replaceAll("÷", "/").replace(/\s+/g, "");
  if (!normalized) {
    scientificResult.textContent = "0";
    return;
  }
  const tokens = normalized.match(/\d*\.?\d+(?:e[+-]?\d+)?|asin|acos|atan|sin|cos|tan|sqrt|log|ln|abs|pi|e|[()+\-*/^%]/g);
  if (!tokens || tokens.join("") !== normalized) {
    scientificResult.textContent = "Expresión no válida";
    return;
  }
  const code = tokens.map((token) => token === "^" ? "**" : token).join("");
  const toRadians = (value) => angleMode === "DEG" ? value * Math.PI / 180 : value;
  const fromRadians = (value) => angleMode === "DEG" ? value * 180 / Math.PI : value;
  try {
    const calculate = Function("sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "log", "ln", "abs", "pi", "e", `"use strict"; return (${code});`);
    const value = calculate(
      (x) => Math.sin(toRadians(x)),
      (x) => Math.cos(toRadians(x)),
      (x) => Math.tan(toRadians(x)),
      (x) => fromRadians(Math.asin(x)),
      (x) => fromRadians(Math.acos(x)),
      (x) => fromRadians(Math.atan(x)),
      Math.sqrt,
      Math.log10,
      Math.log,
      Math.abs,
      Math.PI,
      Math.E
    );
    scientificResult.textContent = Number.isFinite(value) ? numberFormat.format(Number(value.toPrecision(12))) : "Resultado no definido";
  } catch {
    scientificResult.textContent = "Expresión incompleta";
  }
}

function insertScientificValue(value) {
  if (!scientificExpression) return;
  const start = scientificExpression.selectionStart ?? scientificExpression.value.length;
  const end = scientificExpression.selectionEnd ?? start;
  scientificExpression.value = scientificExpression.value.slice(0, start) + value + scientificExpression.value.slice(end);
  scientificExpression.focus();
  scientificExpression.setSelectionRange(start + value.length, start + value.length);
}

document.querySelectorAll("[data-sci-value]").forEach((button) => {
  button.addEventListener("click", () => insertScientificValue(button.dataset.sciValue || ""));
});

document.querySelectorAll("[data-sci-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!scientificExpression) return;
    if (button.dataset.sciAction === "clear") {
      scientificExpression.value = "";
      setQuickText("scientificResult", "0");
    } else if (button.dataset.sciAction === "backspace") {
      const start = scientificExpression.selectionStart ?? scientificExpression.value.length;
      const end = scientificExpression.selectionEnd ?? start;
      const deleteFrom = start === end ? Math.max(0, start - 1) : start;
      scientificExpression.value = scientificExpression.value.slice(0, deleteFrom) + scientificExpression.value.slice(end);
      scientificExpression.focus();
      scientificExpression.setSelectionRange(deleteFrom, deleteFrom);
    } else {
      evaluateScientific();
    }
  });
});

scientificExpression?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    evaluateScientific();
  }
});

angleModeButton?.addEventListener("click", () => {
  angleMode = angleMode === "DEG" ? "RAD" : "DEG";
  angleModeButton.textContent = angleMode;
  angleModeButton.setAttribute("aria-label", `Unidad angular: ${angleMode === "DEG" ? "grados" : "radianes"}. Cambiar unidad`);
  if (scientificExpression?.value) evaluateScientific();
});

window.addEventListener("pageshow", (event) => {
  document.body.classList.remove("page-exit");

  if (event.persisted) {
    document.body.style.opacity = "1";
    document.body.style.animation = "none";

    window.requestAnimationFrame(() => {
      document.body.style.animation = "";
      document.body.style.opacity = "";
    });
  }
});

document.querySelectorAll("a[href]").forEach((link) => {
  const url = new URL(link.href, window.location.href);
  const isSamePageHash = url.pathname === window.location.pathname && url.hash;
  const isLocalPage = url.origin === window.location.origin && !isSamePageHash;
  const opensNewContext = link.target === "_blank" || link.hasAttribute("download");

  if (!isLocalPage || opensNewContext || url.protocol === "mailto:") return;

  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    document.body.classList.add("page-exit");
    window.setTimeout(() => {
      window.location.href = link.href;
    }, 170);
  });
});
