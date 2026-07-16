(function () {
  const svg = document.getElementById("wheelSvg");
  const stage = document.getElementById("stage");
  const statusText = document.getElementById("statusText");

  const state = {
    visible: true,
    levels: 10,
    divisions: 36,
    startValue: 1,
    increment: 1,
    clockwise: true,
    showNumbers: true,
    fill: "levels",
    showProtractor: true,
    protractorClockwise: true,
    markerAngle: 20,
    showCalendar: true,
    calendarClockwise: true,
    wheelSize: 100,
    zoom: 1,
  };

  function numberParam(name, fallback) {
    const value = new URLSearchParams(location.search).get(name);
    if (value === null || value === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function boolParam(name, fallback) {
    const value = new URLSearchParams(location.search).get(name);
    if (value === null) return fallback;
    return value === "true" || value === "1";
  }

  function loadFromUrl() {
    state.levels = Math.max(1, Math.min(20, numberParam("levels", state.levels)));
    state.divisions = Math.max(4, Math.min(72, numberParam("divisions", state.divisions)));
    state.startValue = numberParam("startValue", state.startValue);
    state.increment = numberParam("increment", state.increment);
    state.clockwise = boolParam("clockwise", state.clockwise);
    state.showProtractor = boolParam("showProtractor", state.showProtractor);
    state.showCalendar = boolParam("showCalendar", state.showCalendar);
    state.wheelSize = Math.max(35, Math.min(200, numberParam("wheelSize", state.wheelSize)));
    state.zoom = Math.max(0.4, Math.min(3, numberParam("zoom", state.zoom)));
  }

  function syncUrl() {
    const p = new URLSearchParams();
    p.set("levels", state.levels);
    p.set("divisions", state.divisions);
    p.set("startValue", state.startValue);
    p.set("increment", state.increment);
    p.set("clockwise", state.clockwise);
    p.set("showProtractor", state.showProtractor);
    p.set("showCalendar", state.showCalendar);
    p.set("wheelSize", Math.round(state.wheelSize));
    p.set("zoom", state.zoom.toFixed(2));
    history.replaceState(null, "", `${location.pathname}?${p.toString()}`);
  }

  function applyZoom() {
    const availableWidth = Math.max(320, stage.clientWidth - 24);
    const availableHeight = Math.max(320, stage.clientHeight - 24);
    const fitBase = Math.min(availableWidth, availableHeight);
    const sizeFactor = state.wheelSize / 100;
    const px = Math.max(300, fitBase * sizeFactor * state.zoom);

    svg.style.width = `${px}px`;
    svg.style.height = `${px}px`;

    document.getElementById("zoomLabel").textContent =
      `${Math.round(state.wheelSize * state.zoom)}%`;

    const range = document.getElementById("wheelSizeRange");
    const number = document.getElementById("wheelSizeNumber");
    if (range && Number(range.value) !== Math.round(state.wheelSize)) {
      range.value = Math.round(state.wheelSize);
    }
    if (number && Number(number.value) !== Math.round(state.wheelSize)) {
      number.value = Math.round(state.wheelSize);
    }
  }

  function render(message = "Ready") {
    window.TasiGannWheel.drawWheel(svg, state);
    applyZoom();
    syncUrl();
    statusText.textContent = message;
  }

  function bind(id, event, fn) {
    document.getElementById(id).addEventListener(event, fn);
  }

  loadFromUrl();

  bind("visibleInput", "change", e => { state.visible = e.target.checked; render("Visibility updated"); });
  bind("clockwiseInput", "change", e => { state.clockwise = e.target.checked; render("Direction updated"); });
  bind("levelsInput", "input", e => { state.levels = Math.max(1, Math.min(20, Number(e.target.value) || 10)); render("Levels updated"); });
  bind("startValueInput", "input", e => { state.startValue = Number(e.target.value) || 0; render("Start value updated"); });
  bind("incrementInput", "input", e => { state.increment = Number(e.target.value) || 1; render("Increment updated"); });
  bind("showNumbersInput", "change", e => { state.showNumbers = e.target.checked; render("Numbers updated"); });
  bind("fillInput", "change", e => { state.fill = e.target.value; render("Fill updated"); });
  bind("protractorVisibleInput", "change", e => { state.showProtractor = e.target.checked; render("Protractor updated"); });
  bind("protractorClockwiseInput", "change", e => { state.protractorClockwise = e.target.checked; render("Protractor direction updated"); });
  bind("angleInput", "input", e => { state.markerAngle = Number(e.target.value) || 0; render("Marker updated"); });
  bind("calendarVisibleInput", "change", e => { state.showCalendar = e.target.checked; render("Chronometer updated"); });
  bind("calendarClockwiseInput", "change", e => { state.calendarClockwise = e.target.checked; render("Chronometer direction updated"); });

  function setWheelSize(rawValue) {
    const value = Math.max(35, Math.min(200, Number(rawValue) || 100));
    state.wheelSize = value;
    render(`Wheel size: ${Math.round(value)}%`);
  }

  bind("wheelSizeRange", "input", e => setWheelSize(e.target.value));
  bind("wheelSizeNumber", "input", e => setWheelSize(e.target.value));

  bind("zoomInBtn", "click", () => { state.zoom = Math.min(3, state.zoom + 0.1); render("Zoomed in"); });
  bind("zoomOutBtn", "click", () => { state.zoom = Math.max(0.4, state.zoom - 0.1); render("Zoomed out"); });
  bind("fitBtn", "click", () => {
    state.wheelSize = 100;
    state.zoom = 1;
    render("Fit to screen");
  });
  bind("newBtn", "click", () => {
    Object.assign(state, {
      visible: true, levels: 10, divisions: 36, startValue: 1, increment: 1,
      clockwise: true, showNumbers: true, fill: "levels",
      showProtractor: true, protractorClockwise: true, markerAngle: 20,
      showCalendar: true, calendarClockwise: true, wheelSize: 100, zoom: 1,
    });
    location.search = "";
  });

  bind("exportSvgBtn", "click", () => {
    const copy = svg.cloneNode(true);
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasi-gannzilla-baseline-v4.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusText.textContent = "SVG exported";
  });

  bind("exportPngBtn", "click", () => {
    const copy = svg.cloneNode(true);
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const source = new XMLSerializer().serializeToString(copy);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 4096;
      canvas.height = 4096;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "tasi-gannzilla-baseline-v4-4096.png";
      a.click();
      statusText.textContent = "PNG 4096 × 4096 exported";
    };

    image.src = url;
  });

  window.addEventListener("resize", applyZoom);

  // Initialize inputs from URL/state.
  document.getElementById("levelsInput").value = state.levels;
  document.getElementById("startValueInput").value = state.startValue;
  document.getElementById("incrementInput").value = state.increment;
  document.getElementById("clockwiseInput").checked = state.clockwise;
  document.getElementById("protractorVisibleInput").checked = state.showProtractor;
  document.getElementById("calendarVisibleInput").checked = state.showCalendar;
  document.getElementById("wheelSizeRange").value = Math.round(state.wheelSize);
  document.getElementById("wheelSizeNumber").value = Math.round(state.wheelSize);

  // Drag the workspace to pan when the wheel is larger than the screen.
  stage.classList.add("drag-scroll");
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;

  stage.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    dragging = true;
    stage.classList.add("is-dragging");
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = stage.scrollLeft;
    startScrollTop = stage.scrollTop;
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointermove", event => {
    if (!dragging) return;
    stage.scrollLeft = startScrollLeft - (event.clientX - startX);
    stage.scrollTop = startScrollTop - (event.clientY - startY);
  });

  function stopDragging(event) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    if (event && stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  }

  stage.addEventListener("pointerup", stopDragging);
  stage.addEventListener("pointercancel", stopDragging);

  render("Baseline V4 loaded");
})();
