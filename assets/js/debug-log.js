(function () {
  const state = {
    paused: false,
    level: "debug",
    maxLines: 500,
  };

  const levelOrder = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };

  function now() {
    return new Date().toLocaleTimeString();
  }

  function stringify(value) {
    if (value instanceof Error) {
      return value.stack || value.toString();
    }
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch (_err) {
      return String(value);
    }
  }

  function format(args) {
    return Array.from(args).map(stringify).join(" ");
  }

  function shouldShow(level) {
    return levelOrder[level] >= levelOrder[state.level];
  }

  function ensurePanel() {
    let panel = document.getElementById("debug-log-panel");
    if (panel) return panel;

    const anchor = document.getElementById("log");
    if (!anchor) return null;

    panel = document.createElement("section");
    panel.id = "debug-log-panel";
    panel.className = "debug-log-panel";
    panel.innerHTML = `
      <div class="debug-log-toolbar">
        <strong>Debug log</strong>
        <label>
          Level
          <select id="debug-log-level">
            <option value="debug">debug</option>
            <option value="info" selected>info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
        </label>
        <button id="debug-log-pause" type="button">Pause</button>
        <button id="debug-log-clear" type="button">Clear</button>
        <button id="debug-log-copy" type="button">Copy</button>
      </div>
      <pre id="debug-log-output" class="debug-log-output" aria-live="polite"></pre>
    `;

    anchor.replaceChildren(panel);

    panel.querySelector("#debug-log-level").addEventListener("change", (event) => {
      state.level = event.target.value;
    });

    panel.querySelector("#debug-log-pause").addEventListener("click", (event) => {
      state.paused = !state.paused;
      event.currentTarget.textContent = state.paused ? "Resume" : "Pause";
    });

    panel.querySelector("#debug-log-clear").addEventListener("click", () => {
      const out = panel.querySelector("#debug-log-output");
      if (out) out.textContent = "";
    });

    panel.querySelector("#debug-log-copy").addEventListener("click", async () => {
      const out = panel.querySelector("#debug-log-output");
      if (!out) return;
      try {
        await navigator.clipboard.writeText(out.textContent || "");
      } catch (err) {
        window.DebugLog.error("clipboard copy failed: " + err);
      }
    });

    return panel;
  }

  function append(level, message) {
    if (state.paused || !shouldShow(level)) return;

    const panel = ensurePanel();
    const out = panel && panel.querySelector("#debug-log-output");
    if (!out) return;

    const line = document.createElement("div");
    line.className = "debug-log-line debug-log-" + level;
    line.textContent = `[${now()}] [${level}] ${message}`;
    out.appendChild(line);

    while (out.childNodes.length > state.maxLines) {
      out.removeChild(out.firstChild);
    }
    out.scrollTop = out.scrollHeight;
  }

  function hookConsole(method, level) {
    const original = console[method].bind(console);
    console[method] = function (...args) {
      append(level, format(args));
      original(...args);
    };
  }

  window.DebugLog = {
    debug: (...args) => append("debug", format(args)),
    info: (...args) => append("info", format(args)),
    warn: (...args) => append("warn", format(args)),
    error: (...args) => append("error", format(args)),
    append,
    state,
  };

  hookConsole("debug", "debug");
  hookConsole("log", "info");
  hookConsole("info", "info");
  hookConsole("warn", "warn");
  hookConsole("error", "error");

  window.addEventListener("error", (event) => {
    window.DebugLog.error(
      `window.onerror: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    window.DebugLog.error(`unhandledrejection: ${format([event.reason])}`);
  });
})();
