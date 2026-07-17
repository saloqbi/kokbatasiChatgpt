(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const wheelApi = window.TasiGannWheel;
  if (!wheelApi || typeof wheelApi.drawWheel !== "function") return;

  function svgEl(tag, attrs = {}, text = null) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) el.setAttribute(key, value);
    }
    if (text !== null) el.textContent = text;
    return el;
  }

  function polar(cx, cy, radius, angleFromTopClockwise) {
    const rad = (angleFromTopClockwise - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function readableRotation(angle) {
    const normalized = ((angle % 360) + 360) % 360;
    return normalized > 90 && normalized < 270 ? normalized + 180 : normalized;
  }

  function annularPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
    const p1 = polar(cx, cy, outerRadius, startAngle);
    const p2 = polar(cx, cy, outerRadius, endAngle);
    const p3 = polar(cx, cy, innerRadius, endAngle);
    const p4 = polar(cx, cy, innerRadius, startAngle);
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${outerRadius} ${outerRadius} 0 0 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${innerRadius} ${innerRadius} 0 0 0 ${p4.x} ${p4.y}`,
      "Z",
    ].join(" ");
  }

  const DATE_MARKS = [
    [0, "21 JUN"], [15, "6 JUL"], [30, "22 JUL"], [45, "6 AUG"],
    [60, "22 AUG"], [75, "6 SEP"], [90, "22 SEP"], [105, "7 OCT"],
    [120, "22 OCT"], [135, "6 NOV"], [150, "21 NOV"], [165, "6 DEC"],
    [180, "21 DEC"], [195, "5 JAN"], [210, "20 JAN"], [225, "4 FEB"],
    [240, "19 FEB"], [255, "6 MAR"], [270, "21 MAR"], [285, "5 APR"],
    [300, "21 APR"], [315, "6 MAY"], [330, "21 MAY"], [345, "6 JUN"],
  ];

  const DAY_NAMES = [
    { name: "الأحد", color: "#d5231f" },
    { name: "الإثنين", color: "#138a38" },
    { name: "الثلاثاء", color: "#e88500" },
    { name: "الأربعاء", color: "#1746c5" },
    { name: "الخميس", color: "#a21993" },
    { name: "الجمعة", color: "#1f1f1f" },
    { name: "السبت", color: "#1746c5" },
    { name: "الأحد", color: "#d5231f" },
    { name: "الإثنين", color: "#138a38" },
    { name: "الثلاثاء", color: "#e88500" },
    { name: "الأربعاء", color: "#1746c5" },
    { name: "الخميس", color: "#a21993" },
  ];

  const ZODIAC_SIGNS = [
    { symbol: "♈", name: "الحمل", element: "نار", color: "#d5231f" },
    { symbol: "♉", name: "الثور", element: "تراب", color: "#4f7419" },
    { symbol: "♊", name: "الجوزاء", element: "هواء", color: "#e88500" },
    { symbol: "♋", name: "السرطان", element: "ماء", color: "#1746c5" },
    { symbol: "♌", name: "الأسد", element: "نار", color: "#d5231f" },
    { symbol: "♍", name: "العذراء", element: "تراب", color: "#2c7c2e" },
    { symbol: "♎", name: "الميزان", element: "هواء", color: "#65811e" },
    { symbol: "♏", name: "العقرب", element: "ماء", color: "#1746c5" },
    { symbol: "♐", name: "القوس", element: "نار", color: "#d5231f" },
    { symbol: "♑", name: "الجدي", element: "تراب", color: "#4f7419" },
    { symbol: "♒", name: "الدلو", element: "هواء", color: "#1746c5" },
    { symbol: "♓", name: "الحوت", element: "ماء", color: "#1746c5" },
  ];

  let manualAngleOffset = 0;
  const originalDrawWheel = wheelApi.drawWheel;

  wheelApi.drawWheel = function drawWheelWithArabicOuterRings(svg, options) {
    originalDrawWheel(svg, options);

    // Expand the canvas without changing the approved wheel geometry.
    svg.setAttribute("viewBox", "0 0 2200 2200");
    const root = svg.querySelector("g") || svg;
    root.setAttribute("transform", "translate(200 200)");

    const cx = 900;
    const cy = 900;
    const screenCx = 1100;
    const screenCy = 1100;
    const redAngleRadius = 763;
    const greenCalendarRadius = 852;
    const angleLabelRadius = 800;
    const dateLabelRadius = 875;
    const zodiacInnerRadius = 900;
    const zodiacOuterRadius = 988;
    const dayInnerRadius = 988;
    const dayOuterRadius = 1042;

    // Remove all previous outer-frame graphics without touching the numbered wheel grid.
    svg.querySelectorAll("circle").forEach(circle => {
      const radius = Number(circle.getAttribute("r"));
      if (Number.isFinite(radius) && radius >= redAngleRadius) circle.remove();
    });

    const oldOuterStrokes = new Set([
      "#dcc0bc", "#d9a9a5", "#d95650", "#aaa9a5",
      "#b8cfc2", "#b6cfc0", "#d94a43", "#3c9b60",
      "#38965d", "#86b19a", "#e2c7c3", "#dcb7b2",
      "#73a287", "#c6c9c6", "#d0dfd7", "#b7cec1",
      "#d0d2d0", "#aeb1ae", "#aeb0ae", "#ed8b8b",
      "#ef5555", "#ee1717", "#07952e", "#d99a95",
      "#df2e29", "#d8615b", "#6fa88a", "#dc8f89",
      "#c4c5c2", "#e5a09b", "#d95e57", "#dc2b25",
    ]);
    svg.querySelectorAll("line").forEach(line => {
      if (oldOuterStrokes.has(line.getAttribute("stroke"))) line.remove();
    });
    svg.querySelectorAll(".degree-label, .calendar-label, .outer-day-label, .zodiac-label").forEach(node => node.remove());
    svg.querySelectorAll('path[fill="#d9211f"], path[fill="#df1717"]').forEach(node => node.remove());

    // Interactive red angle frame.
    const angleGroup = svgEl("g", {
      id: "manualAngleFrame",
      transform: `rotate(${manualAngleOffset} ${cx} ${cy})`,
    });
    root.appendChild(angleGroup);

    angleGroup.appendChild(svgEl("circle", {
      cx, cy, r: redAngleRadius,
      fill: "none",
      stroke: "#dc8f89",
      "stroke-width": 1.2,
      "vector-effect": "non-scaling-stroke",
    }));

    // Gray one-degree ticks point outward from the red circle.
    for (let angle = 0; angle < 360; angle += 1) {
      const cardinal = angle % 90 === 0;
      const ten = angle % 10 === 0;
      const five = angle % 5 === 0;
      let length = 5;
      let color = "#b8b9b6";
      let width = 0.5;
      if (five) { length = 10; color = "#e2a09b"; width = 0.8; }
      if (ten) { length = 17; color = "#d95e57"; width = 1.2; }
      if (cardinal) { length = 24; color = "#dc2b25"; width = 1.9; }
      const p0 = polar(cx, cy, redAngleRadius, angle);
      const p1 = polar(cx, cy, redAngleRadius + length, angle);
      angleGroup.appendChild(svgEl("line", {
        x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y,
        stroke: color,
        "stroke-width": width,
        "vector-effect": "non-scaling-stroke",
      }));
    }

    for (let angle = 0; angle < 360; angle += 5) {
      const cardinal = angle % 90 === 0;
      const ten = angle % 10 === 0;
      const p = polar(cx, cy, angleLabelRadius, angle);
      angleGroup.appendChild(svgEl("text", {
        x: p.x, y: p.y,
        fill: cardinal ? "#dc2b25" : (ten ? "#171717" : "#858582"),
        "font-family": "Arial, sans-serif",
        "font-size": cardinal ? 13 : (ten ? 10.8 : 9.8),
        "font-weight": cardinal || ten ? 700 : 400,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, `${angle}°`));
    }

    // Draggable circular handle at 0°, with its head above the red circle.
    const handleBase = polar(cx, cy, redAngleRadius, 0);
    const handleHead = polar(cx, cy, redAngleRadius + 12, 0);
    angleGroup.appendChild(svgEl("line", {
      x1: handleBase.x, y1: handleBase.y,
      x2: handleHead.x, y2: handleHead.y,
      stroke: "#dc2b25",
      "stroke-width": 1.6,
      "vector-effect": "non-scaling-stroke",
      "pointer-events": "none",
    }));
    const dragHandle = svgEl("circle", {
      cx: handleHead.x, cy: handleHead.y, r: 6,
      fill: "#ffffff",
      stroke: "#dc2b25",
      "stroke-width": 2,
      cursor: "grab",
      class: "angle-drag-handle",
    });
    angleGroup.appendChild(dragHandle);

    // Fixed green calendar circle and dates.
    root.appendChild(svgEl("circle", {
      cx, cy, r: greenCalendarRadius,
      fill: "none",
      stroke: "#6fa88a",
      "stroke-width": 1.25,
      "vector-effect": "non-scaling-stroke",
    }));

    for (const [angle, label] of DATE_MARKS) {
      const p0 = polar(cx, cy, greenCalendarRadius - 2, angle);
      const p1 = polar(cx, cy, greenCalendarRadius + 12, angle);
      root.appendChild(svgEl("line", {
        x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y,
        stroke: "#6fa88a",
        "stroke-width": angle % 30 === 0 ? 1.35 : 0.9,
        "vector-effect": "non-scaling-stroke",
      }));
      const p = polar(cx, cy, dateLabelRadius, angle);
      root.appendChild(svgEl("text", {
        x: p.x, y: p.y,
        fill: "#5e7769",
        "font-family": "Arial, sans-serif",
        "font-size": 10.2,
        "font-weight": 500,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, label));
    }

    // Zodiac ring: 12 equal 30-degree sectors.
    for (let index = 0; index < 12; index += 1) {
      const centerAngle = index * 30;
      const startAngle = centerAngle - 15;
      const endAngle = centerAngle + 15;
      const sign = ZODIAC_SIGNS[index];
      root.appendChild(svgEl("path", {
        d: annularPath(cx, cy, zodiacInnerRadius, zodiacOuterRadius, startAngle, endAngle),
        fill: "#ffffff",
        stroke: "#4b4b4b",
        "stroke-width": 0.9,
        "vector-effect": "non-scaling-stroke",
      }));

      const rotation = readableRotation(centerAngle);
      const symbolPos = polar(cx, cy, 925, centerAngle);
      const namePos = polar(cx, cy, 951, centerAngle);
      const elementPos = polar(cx, cy, 974, centerAngle);
      root.appendChild(svgEl("text", {
        x: symbolPos.x, y: symbolPos.y,
        fill: sign.color,
        "font-family": "Segoe UI Symbol, Arial, sans-serif",
        "font-size": 25,
        "font-weight": 500,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${rotation} ${symbolPos.x} ${symbolPos.y})`,
        class: "zodiac-label",
      }, sign.symbol));
      root.appendChild(svgEl("text", {
        x: namePos.x, y: namePos.y,
        fill: sign.color,
        "font-family": "Tahoma, Arial, sans-serif",
        "font-size": 13.5,
        "font-weight": 700,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${rotation} ${namePos.x} ${namePos.y})`,
        class: "zodiac-label",
        direction: "rtl",
      }, sign.name));
      root.appendChild(svgEl("text", {
        x: elementPos.x, y: elementPos.y,
        fill: sign.color,
        "font-family": "Tahoma, Arial, sans-serif",
        "font-size": 10,
        "font-weight": 500,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${rotation} ${elementPos.x} ${elementPos.y})`,
        class: "zodiac-label",
        direction: "rtl",
      }, sign.element));
    }

    // Outermost days ring, aligned with the zodiac sectors.
    for (let index = 0; index < 12; index += 1) {
      const centerAngle = index * 30;
      const startAngle = centerAngle - 15;
      const endAngle = centerAngle + 15;
      const day = DAY_NAMES[index];
      root.appendChild(svgEl("path", {
        d: annularPath(cx, cy, dayInnerRadius, dayOuterRadius, startAngle, endAngle),
        fill: "#ffffff",
        stroke: "#3f3f3f",
        "stroke-width": 1,
        "vector-effect": "non-scaling-stroke",
      }));
      const p = polar(cx, cy, 1015, centerAngle);
      root.appendChild(svgEl("text", {
        x: p.x, y: p.y,
        fill: day.color,
        "font-family": "Tahoma, Arial, sans-serif",
        "font-size": 15,
        "font-weight": 700,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(centerAngle)} ${p.x} ${p.y})`,
        class: "outer-day-label",
        direction: "rtl",
      }, day.name));
    }

    // Red direction marker remains inside the calendar circle.
    const markerAngle = Number(options && options.markerAngle) || 20;
    const tip = polar(cx, cy, greenCalendarRadius - 5, markerAngle);
    const left = polar(cx, cy, greenCalendarRadius - 20, markerAngle - 1.35);
    const right = polar(cx, cy, greenCalendarRadius - 20, markerAngle + 1.35);
    root.appendChild(svgEl("path", {
      d: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`,
      fill: "#d9211f",
    }));

    // Manual dragging rotates only the red protractor frame.
    let dragging = false;
    dragHandle.addEventListener("pointerdown", event => {
      dragging = true;
      dragHandle.setAttribute("cursor", "grabbing");
      dragHandle.setPointerCapture(event.pointerId);
      event.stopPropagation();
      event.preventDefault();
    });
    dragHandle.addEventListener("pointermove", event => {
      if (!dragging) return;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const local = point.matrixTransform(matrix.inverse());
      const dx = local.x - screenCx;
      const dy = local.y - screenCy;
      manualAngleOffset = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
      angleGroup.setAttribute("transform", `rotate(${manualAngleOffset} ${cx} ${cy})`);
      event.stopPropagation();
      event.preventDefault();
    });
    const stopDrag = event => {
      if (!dragging) return;
      dragging = false;
      dragHandle.setAttribute("cursor", "grab");
      if (dragHandle.hasPointerCapture(event.pointerId)) dragHandle.releasePointerCapture(event.pointerId);
      event.stopPropagation();
      event.preventDefault();
    };
    dragHandle.addEventListener("pointerup", stopDrag);
    dragHandle.addEventListener("pointercancel", stopDrag);
  };
})();