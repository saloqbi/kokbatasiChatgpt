(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

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

  function annularPath(cx, cy, innerR, outerR, startAngle, endAngle) {
    const p1 = polar(cx, cy, outerR, startAngle);
    const p2 = polar(cx, cy, outerR, endAngle);
    const p3 = polar(cx, cy, innerR, endAngle);
    const p4 = polar(cx, cy, innerR, startAngle);
    const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y}`,
      "Z",
    ].join(" ");
  }

  const CALENDAR_MARKS = [
    [0, "21 JUN"], [15, "6 JUL"], [30, "22 JUL"], [45, "6 AUG"],
    [60, "22 AUG"], [75, "6 SEP"], [90, "22 SEP"], [105, "7 OCT"],
    [120, "22 OCT"], [135, "6 NOV"], [150, "21 NOV"], [165, "6 DEC"],
    [180, "21 DEC"], [195, "5 JAN"], [210, "20 JAN"], [225, "4 FEB"],
    [240, "19 FEB"], [255, "6 MAR"], [270, "21 MAR"], [285, "5 APR"],
    [300, "21 APR"], [315, "6 MAY"], [330, "21 MAY"], [345, "6 JUN"],
  ];

  function readableRotation(angle) {
    let normalized = ((angle % 360) + 360) % 360;
    let rotation = normalized;
    if (normalized > 90 && normalized < 270) rotation += 180;
    return rotation;
  }

  function drawWheel(svg, options) {
    const cfg = {
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
      ...options,
    };

    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 1700 1700");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    if (!cfg.visible) return;

    const cx = 850;
    const cy = 850;
    const innerRadius = 180;
    const ringWidth = 54;
    const outerRadius = innerRadius + cfg.levels * ringWidth;
    const protractorInner = outerRadius + 14;
    const protractorOuter = protractorInner + 58;
    const calendarInner = protractorOuter + 10;
    const calendarOuter = calendarInner + 54;
    const direction = cfg.clockwise ? 1 : -1;
    const step = 360 / cfg.divisions;

    const root = svgEl("g");
    svg.appendChild(root);

    // Ring backgrounds.
    for (let ring = 0; ring < cfg.levels; ring++) {
      const r0 = innerRadius + ring * ringWidth;
      const r1 = r0 + ringWidth;
      const fill = cfg.fill === "levels"
        ? (ring % 2 === 0 ? "#d9dbd6" : "#fafaf8")
        : "#ffffff";

      root.appendChild(svgEl("circle", {
        cx, cy,
        r: (r0 + r1) / 2,
        fill: "none",
        stroke: fill,
        "stroke-width": ringWidth,
      }));
    }

    // Radial grid.
    for (let d = 0; d < cfg.divisions; d++) {
      const angle = direction * d * step;
      const a = polar(cx, cy, innerRadius, angle);
      const b = polar(cx, cy, outerRadius, angle);
      root.appendChild(svgEl("line", {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: "#a9aca8",
        "stroke-width": (d % 9 === 0 ? 1.55 : 1.18),
        "stroke-opacity": (d % 9 === 0 ? 0.90 : 0.78),
        "shape-rendering": "geometricPrecision",
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Circular grid boundaries.
    for (let ring = 0; ring <= cfg.levels; ring++) {
      root.appendChild(svgEl("circle", {
        cx, cy,
        r: innerRadius + ring * ringWidth,
        fill: "none",
        stroke: "#afb2ae",
        "stroke-width": ring === 0 || ring === cfg.levels ? 1.55 : 1.12,
        "stroke-opacity": ring === 0 || ring === cfg.levels ? 0.92 : 0.80,
        "shape-rendering": "geometricPrecision",
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Numbers. Local 36 is centered at 0°, 9 at 90°, 18 at 180°, 27 at 270°.
    if (cfg.showNumbers) {
      for (let ring = 0; ring < cfg.levels; ring++) {
        const textRadius = innerRadius + ring * ringWidth + ringWidth / 2;
        for (let local = 1; local <= cfg.divisions; local++) {
          const index = ring * cfg.divisions + (local - 1);
          const value = cfg.startValue + index * cfg.increment;
          const localAngle = direction * ((local % cfg.divisions) * step);
          const pos = polar(cx, cy, textRadius, localAngle);
          const rotation = readableRotation(localAngle);
          const fontSize = Math.max(12, Math.min(18, ringWidth * 0.27));

          root.appendChild(svgEl("text", {
            x: pos.x,
            y: pos.y,
            class: "wheel-number",
            "font-size": fontSize,
            transform: `rotate(${rotation} ${pos.x} ${pos.y})`,
          }, String(value)));
        }
      }
    }

    // Protractor.
    if (cfg.showProtractor) {
      // Clean red angle frame.
      root.appendChild(svgEl("circle", {
        cx, cy, r: protractorInner,
        fill: "none", stroke: "#e15454", "stroke-width": 1.6,
      }));
      root.appendChild(svgEl("circle", {
        cx, cy, r: protractorOuter,
        fill: "none", stroke: "#e15454", "stroke-width": 1.8,
      }));

      for (let angle = 0; angle < 360; angle += 5) {
        const major = angle % 10 === 0;
        const drawAngle = cfg.protractorClockwise ? angle : -angle;
        const tickStart = polar(cx, cy, protractorOuter - (major ? 20 : 11), drawAngle);
        const tickEnd = polar(cx, cy, protractorOuter, drawAngle);
        root.appendChild(svgEl("line", {
          x1: tickStart.x, y1: tickStart.y,
          x2: tickEnd.x, y2: tickEnd.y,
          stroke: major ? "#d86d69" : "#b5b4b0",
          "stroke-width": major ? 2.5 : 1,
        }));

        const labelR = protractorInner + (major ? 22 : 18);
        const p = polar(cx, cy, labelR, drawAngle);
        root.appendChild(svgEl("text", {
          x: p.x, y: p.y,
          class: `degree-label${major ? " major" : ""}`,
          transform: `rotate(${readableRotation(drawAngle)} ${p.x} ${p.y})`,
        }, `${angle}°`));
      }

      // Marker triangle.
      const markerAngle = cfg.markerAngle || 0;
      const tip = polar(cx, cy, calendarInner + 10, markerAngle);
      const left = polar(cx, cy, calendarInner - 5, markerAngle - 1.8);
      const right = polar(cx, cy, calendarInner - 5, markerAngle + 1.8);
      root.appendChild(svgEl("path", {
        d: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`,
        fill: "#d72020",
      }));
    }

    // Calendar / chronometer ring as the outermost band.
    if (cfg.showCalendar) {
      // Green inner calendar guide.
      root.appendChild(svgEl("circle", {
        cx, cy, r: calendarInner,
        fill: "none", stroke: "#2c9b56", "stroke-width": 1.5,
      }));

      // Outermost frame: alternating red and green dashed strokes
      // drawn on the same exact circle.
      root.appendChild(svgEl("circle", {
        cx, cy, r: calendarOuter,
        fill: "none",
        stroke: "#e53935",
        "stroke-width": 2.3,
        "stroke-dasharray": "20 20",
        "stroke-linecap": "round",
      }));
      root.appendChild(svgEl("circle", {
        cx, cy, r: calendarOuter,
        fill: "none",
        stroke: "#168f43",
        "stroke-width": 2.3,
        "stroke-dasharray": "20 20",
        "stroke-dashoffset": "20",
        "stroke-linecap": "round",
      }));

      for (const [angle, label] of CALENDAR_MARKS) {
        const drawAngle = cfg.calendarClockwise ? angle : -angle;
        const tick0 = polar(cx, cy, calendarInner, drawAngle);
        const tick1 = polar(cx, cy, calendarOuter - 10, drawAngle);
        root.appendChild(svgEl("line", {
          x1: tick0.x, y1: tick0.y,
          x2: tick1.x, y2: tick1.y,
          stroke: (angle % 30 === 0 ? "#168f43" : "#49a96e"),
          "stroke-width": angle % 30 === 0 ? 2.1 : 1.4,
        }));

        const p = polar(cx, cy, calendarOuter - 5, drawAngle);
        root.appendChild(svgEl("text", {
          x: p.x, y: p.y,
          class: "calendar-label",
          transform: `rotate(${readableRotation(drawAngle)} ${p.x} ${p.y})`,
        }, label));
      }
    }

    // Center opening.
    root.appendChild(svgEl("circle", {
      cx, cy, r: innerRadius - 1,
      fill: "#ffffff",
      stroke: "#b8bbb7",
      "stroke-width": 1.3,
    }));
  }

  window.TasiGannWheel = { drawWheel };
})();
