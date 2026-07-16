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

  const CALENDAR_MARKS = [
    [0, "21 JUN"], [15, "6 JUL"], [30, "22 JUL"], [45, "6 AUG"],
    [60, "22 AUG"], [75, "6 SEP"], [90, "22 SEP"], [105, "7 OCT"],
    [120, "22 OCT"], [135, "6 NOV"], [150, "21 NOV"], [165, "6 DEC"],
    [180, "21 DEC"], [195, "5 JAN"], [210, "20 JAN"], [225, "4 FEB"],
    [240, "19 FEB"], [255, "6 MAR"], [270, "21 MAR"], [285, "5 APR"],
    [300, "21 APR"], [315, "6 MAY"], [330, "21 MAY"], [345, "6 JUN"],
  ];

  function readableRotation(angle) {
    const normalized = ((angle % 360) + 360) % 360;
    return normalized > 90 && normalized < 270 ? normalized + 180 : normalized;
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
    svg.setAttribute("viewBox", "0 0 1800 1800");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    if (!cfg.visible) return;

    const cx = 900;
    const cy = 900;
    const innerRadius = 190;
    const ringWidth = 58;
    const outerRadius = innerRadius + cfg.levels * ringWidth;
    const protractorInner = outerRadius + 16;
    const protractorOuter = protractorInner + 64;
    const calendarInner = protractorOuter + 12;
    const calendarOuter = calendarInner + 56;
    const direction = cfg.clockwise ? 1 : -1;
    const step = 360 / cfg.divisions;
    const halfStep = step / 2;

    const root = svgEl("g");
    svg.appendChild(root);

    // Alternating ring backgrounds matching the reference.
    for (let ring = 0; ring < cfg.levels; ring++) {
      const r0 = innerRadius + ring * ringWidth;
      const r1 = r0 + ringWidth;
      const fill = cfg.fill === "levels"
        ? (ring % 2 === 0 ? "#d8dad5" : "#fbfbf9")
        : "#ffffff";

      root.appendChild(svgEl("circle", {
        cx, cy,
        r: (r0 + r1) / 2,
        fill: "none",
        stroke: fill,
        "stroke-width": ringWidth,
      }));
    }

    // Cell separators are shifted by half a division so every line falls BETWEEN numbers.
    for (let d = 0; d < cfg.divisions; d++) {
      const angle = direction * (d * step + halfStep);
      const a = polar(cx, cy, innerRadius, angle);
      const b = polar(cx, cy, outerRadius, angle);
      const major = d % 9 === 0;
      root.appendChild(svgEl("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        stroke: major ? "#9ea39e" : "#b2b6b1",
        "stroke-width": major ? 1.45 : 1.08,
        "stroke-opacity": major ? 0.88 : 0.76,
        "shape-rendering": "geometricPrecision",
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Circular cell boundaries.
    for (let ring = 0; ring <= cfg.levels; ring++) {
      const edge = ring === 0 || ring === cfg.levels;
      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: innerRadius + ring * ringWidth,
        fill: "none",
        stroke: edge ? "#a2a6a1" : "#b7bab5",
        "stroke-width": edge ? 1.45 : 1.02,
        "stroke-opacity": edge ? 0.9 : 0.78,
        "shape-rendering": "geometricPrecision",
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Values are centered on their rays: 36 at 0°, 9 at 90°, 18 at 180°, 27 at 270°.
    if (cfg.showNumbers) {
      for (let ring = 0; ring < cfg.levels; ring++) {
        const textRadius = innerRadius + ring * ringWidth + ringWidth / 2;
        for (let local = 1; local <= cfg.divisions; local++) {
          const index = ring * cfg.divisions + (local - 1);
          const value = cfg.startValue + index * cfg.increment;
          const localAngle = direction * ((local % cfg.divisions) * step);
          const pos = polar(cx, cy, textRadius, localAngle);
          const rotation = readableRotation(localAngle);
          const fontSize = Math.max(13, Math.min(18, ringWidth * 0.285));

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

    // Red protractor frame and five-degree scale.
    if (cfg.showProtractor) {
      root.appendChild(svgEl("circle", {
        cx, cy, r: protractorInner,
        fill: "none",
        stroke: "#d8a9a5",
        "stroke-width": 1.25,
        "vector-effect": "non-scaling-stroke",
      }));
      root.appendChild(svgEl("circle", {
        cx, cy, r: protractorOuter,
        fill: "none",
        stroke: "#d96c67",
        "stroke-width": 1.65,
        "vector-effect": "non-scaling-stroke",
      }));

      for (let angle = 0; angle < 360; angle += 5) {
        const major = angle % 10 === 0;
        const drawAngle = cfg.protractorClockwise ? angle : -angle;
        const tickStart = polar(cx, cy, protractorOuter - (major ? 20 : 11), drawAngle);
        const tickEnd = polar(cx, cy, protractorOuter, drawAngle);
        root.appendChild(svgEl("line", {
          x1: tickStart.x,
          y1: tickStart.y,
          x2: tickEnd.x,
          y2: tickEnd.y,
          stroke: major ? "#d9544f" : "#aaa9a5",
          "stroke-width": major ? 2.25 : 0.9,
          "vector-effect": "non-scaling-stroke",
        }));

        const labelR = protractorInner + (major ? 23 : 19);
        const p = polar(cx, cy, labelR, drawAngle);
        root.appendChild(svgEl("text", {
          x: p.x,
          y: p.y,
          class: `degree-label${major ? " major" : ""}`,
          transform: `rotate(${readableRotation(drawAngle)} ${p.x} ${p.y})`,
        }, `${angle}°`));
      }

      const markerAngle = Number(cfg.markerAngle) || 0;
      const tip = polar(cx, cy, calendarInner + 11, markerAngle);
      const left = polar(cx, cy, calendarInner - 6, markerAngle - 2);
      const right = polar(cx, cy, calendarInner - 6, markerAngle + 2);
      root.appendChild(svgEl("path", {
        d: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`,
        fill: "#d71f1f",
      }));
    }

    // Green calendar guide plus alternating red/green dashed outermost frame.
    if (cfg.showCalendar) {
      root.appendChild(svgEl("circle", {
        cx, cy, r: calendarInner,
        fill: "none",
        stroke: "#a9c5b6",
        "stroke-width": 1.45,
        "vector-effect": "non-scaling-stroke",
      }));

      root.appendChild(svgEl("circle", {
        cx, cy, r: calendarOuter,
        fill: "none",
        stroke: "#d93631",
        "stroke-width": 2,
        "stroke-dasharray": "18 18",
        "stroke-linecap": "butt",
        "vector-effect": "non-scaling-stroke",
      }));
      root.appendChild(svgEl("circle", {
        cx, cy, r: calendarOuter,
        fill: "none",
        stroke: "#2d9a55",
        "stroke-width": 2,
        "stroke-dasharray": "18 18",
        "stroke-dashoffset": "18",
        "stroke-linecap": "butt",
        "vector-effect": "non-scaling-stroke",
      }));

      for (const [angle, label] of CALENDAR_MARKS) {
        const drawAngle = cfg.calendarClockwise ? angle : -angle;
        const tick0 = polar(cx, cy, calendarInner, drawAngle);
        const tick1 = polar(cx, cy, calendarOuter - 8, drawAngle);
        const major = angle % 30 === 0;
        root.appendChild(svgEl("line", {
          x1: tick0.x,
          y1: tick0.y,
          x2: tick1.x,
          y2: tick1.y,
          stroke: major ? "#299254" : "#79ad90",
          "stroke-width": major ? 2 : 1.25,
          "vector-effect": "non-scaling-stroke",
        }));

        const p = polar(cx, cy, calendarOuter - 5, drawAngle);
        root.appendChild(svgEl("text", {
          x: p.x,
          y: p.y,
          class: "calendar-label",
          transform: `rotate(${readableRotation(drawAngle)} ${p.x} ${p.y})`,
        }, label));
      }
    }

    root.appendChild(svgEl("circle", {
      cx,
      cy,
      r: innerRadius - 1,
      fill: "#ffffff",
      stroke: "#aeb2ad",
      "stroke-width": 1.2,
      "vector-effect": "non-scaling-stroke",
    }));
  }

  window.TasiGannWheel = { drawWheel };
})();