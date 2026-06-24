const STORAGE_KEY = "ai-api-tester-configs-v1";

const els = {
  form: document.querySelector("#apiForm"),
  baseUrl: document.querySelector("#baseUrl"),
  apiKey: document.querySelector("#apiKey"),
  model: document.querySelector("#model"),
  temperature: document.querySelector("#temperature"),
  configName: document.querySelector("#configName"),
  prompt: document.querySelector("#prompt"),
  result: document.querySelector("#result"),
  rawJson: document.querySelector("#rawJson"),
  savedList: document.querySelector("#savedList"),
  saveConfig: document.querySelector("#saveConfig"),
  clearForm: document.querySelector("#clearForm"),
  toggleKey: document.querySelector("#toggleKey"),
  copyResult: document.querySelector("#copyResult"),
  sendBtn: document.querySelector("#sendBtn"),
  statusPulse: document.querySelector("#statusPulse"),
  statusTitle: document.querySelector("#statusTitle"),
  statusText: document.querySelector("#statusText"),
  metaInfo: document.querySelector("#metaInfo"),
  toast: document.querySelector("#toast"),
};

function showErrorInResponse(error, context = "Error") {
  const details = formatError(error);
  els.result.textContent = `${context}:\n${details}\n\nIf this is a browser/CORS/network error, the remote API may not allow direct calls from a web page.`;
  els.rawJson.textContent = "None";
  els.metaInfo.textContent = "Failed";
  setStatus("error", "Failed", "See response panel");
}

function formatError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;

  const parts = [];
  if (error.name) parts.push(`Type: ${error.name}`);
  if (error.message) parts.push(`Message: ${error.message}`);
  if (error.stack) parts.push(`Stack:\n${error.stack}`);

  return parts.length ? parts.join("\n") : JSON.stringify(error, null, 2);
}

window.addEventListener("error", event => {
  showErrorInResponse(event.error || event.message, "Page error");
});

window.addEventListener("unhandledrejection", event => {
  showErrorInResponse(event.reason, "Unhandled promise rejection");
});

function getConfigs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setConfigs(configs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2300);
}

function setStatus(type, title, text) {
  els.statusPulse.className = `pulse ${type || ""}`.trim();
  els.statusTitle.textContent = title;
  els.statusText.textContent = text;
}

function normalizeBaseUrl(url) {
  return url.trim().replace(/\/+$/, "");
}

function endpointFromBaseUrl(url) {
  const clean = normalizeBaseUrl(url);
  if (/\/chat\/completions$/i.test(clean)) return clean;
  return `${clean}/chat/completions`;
}

function formToConfig() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: els.configName.value.trim() || `${els.model.value.trim()} @ ${new URL(normalizeBaseUrl(els.baseUrl.value)).host}`,
    baseUrl: normalizeBaseUrl(els.baseUrl.value),
    apiKey: els.apiKey.value.trim(),
    model: els.model.value.trim(),
    temperature: Number(els.temperature.value),
    updatedAt: new Date().toISOString(),
  };
}

function loadConfig(config) {
  els.configName.value = config.name || "";
  els.baseUrl.value = config.baseUrl || "";
  els.apiKey.value = config.apiKey || "";
  els.model.value = config.model || "";
  els.temperature.value = config.temperature ?? 0.7;
  toast(`Loaded: ${config.name}`);
}

function maskKey(key = "") {
  if (key.length <= 10) return "••••••";
  return `${key.slice(0, 5)}••••••${key.slice(-4)}`;
}

function renderConfigs() {
  const configs = getConfigs();
  if (!configs.length) {
    els.savedList.innerHTML = `<div class="empty">No saved configs yet.</div>`;
    return;
  }

  els.savedList.innerHTML = configs.map(config => `
    <article class="config-item" data-id="${config.id}">
      <strong>${escapeHtml(config.name)}</strong>
      <small>${escapeHtml(config.model)} · ${escapeHtml(config.baseUrl)}</small>
      <small>${maskKey(config.apiKey)} · temperature ${config.temperature}</small>
      <div class="config-actions">
        <button type="button" class="ghost small" data-action="load">Load</button>
        <button type="button" class="danger small" data-action="delete">Delete</button>
      </div>
    </article>
  `).join("");
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.saveConfig.addEventListener("click", () => {
  if (!els.baseUrl.value || !els.apiKey.value || !els.model.value) {
    toast("Fill Base URL, API Key, and Model first.");
    return;
  }
  let config;
  try {
    config = formToConfig();
  } catch {
    toast("Invalid Base URL.");
    return;
  }
  const configs = getConfigs();
  const sameNameIndex = configs.findIndex(item => item.name === config.name);
  if (sameNameIndex >= 0) configs.splice(sameNameIndex, 1, config);
  else configs.unshift(config);
  setConfigs(configs);
  renderConfigs();
  toast("Config saved locally.");
});

els.savedList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  const item = event.target.closest(".config-item");
  if (!button || !item) return;

  const configs = getConfigs();
  const config = configs.find(entry => entry.id === item.dataset.id);
  if (!config) return;

  if (button.dataset.action === "load") {
    loadConfig(config);
  } else if (button.dataset.action === "delete") {
    setConfigs(configs.filter(entry => entry.id !== config.id));
    renderConfigs();
    toast("Config deleted.");
  }
});

els.clearForm.addEventListener("click", () => {
  els.form.reset();
  els.temperature.value = 0.7;
  setStatus("", "Idle", "Ready to test");
  els.metaInfo.textContent = "Not sent";
  toast("Form reset.");
});

els.toggleKey.addEventListener("click", () => {
  const isPassword = els.apiKey.type === "password";
  els.apiKey.type = isPassword ? "text" : "password";
  els.toggleKey.textContent = isPassword ? "Hide" : "Show";
});

els.copyResult.addEventListener("click", async () => {
  await navigator.clipboard.writeText(els.result.textContent || "");
  toast("Copied.");
});

els.form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!els.prompt.value.trim()) {
    toast("Enter a prompt first.");
    return;
  }

  const started = performance.now();
  els.sendBtn.disabled = true;
  els.result.textContent = "Sending...";
  els.rawJson.textContent = "None";
  els.metaInfo.textContent = "Running";
  setStatus("loading", "Running", "Waiting for response");

  try {
    const endpoint = endpointFromBaseUrl(els.baseUrl.value);
    const payload = {
      model: els.model.value.trim(),
      temperature: Number(els.temperature.value),
      messages: [{ role: "user", content: els.prompt.value.trim() }],
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${els.apiKey.value.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const data = tryParseJson(text);
    const cost = Math.round(performance.now() - started);
    els.rawJson.textContent = data ? JSON.stringify(data, null, 2) : text;

    if (!response.ok) {
      const message = data?.error?.message || data?.message || text || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || text;
    els.result.textContent = content || "Success, but no text content was found in the response.";
    els.metaInfo.textContent = `OK · HTTP ${response.status} · ${cost}ms`;
    setStatus("success", "Success", `${cost}ms`);
  } catch (error) {
    showErrorInResponse(error, "Request failed");
  } finally {
    els.sendBtn.disabled = false;
  }
});

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

renderConfigs();
