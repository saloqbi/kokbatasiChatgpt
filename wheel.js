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

    // Measurements derived directly from the 1249×1249 reference image.
    // Reference radii: center hole 106 px, 10 rings ≈42.4 px each,
    // numeric edge 530 px, angle edge 563 px, calendar edge 589 px.
    const cx = 900;
    const cy = 900;
    const innerRadius = 153;
    const ringWidth = 61;
    const outerRadius = innerRadius + cfg.levels * ringWidth;
    const protractorInner = outerRadius + 7;
    const protractorOuter = protractorInner + 42;
    const calendarInner = protractorOuter + 5;
    const calendarOuter = calendarInner + 33;
    const direction = cfg.clockwise ? 1 : -1;
    const step = 360 / cfg.divisions;
    const halfStep = step / 2;

    const root = svgEl("g");
    svg.appendChild(root);

    // Alternating bands copied from the reference palette.
    for (let ring = 0; ring < cfg.levels; ring++) {
      const r0 = innerRadius + ring * ringWidth;
      const r1 = r0 + ringWidth;
      const fill = cfg.fill === "levels"
        ? (ring % 2 === 0 ? "#d9dbd6" : "#ffffff")
        : "#ffffff";

      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: (r0 + r1) / 2,
        fill: "none",
        stroke: fill,
        "stroke-width": ringWidth,
      }));
    }

    // Every separator falls between adjacent numbers.
    for (let d = 0; d < cfg.divisions; d++) {
      const angle = direction * (d * step + halfStep);
      const a = polar(cx, cy, innerRadius, angle);
      const b = polar(cx, cy, outerRadius, angle);
      root.appendChild(svgEl("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        stroke: "#b7bab5",
        "stroke-width": 1,
        "stroke-opacity": 0.82,
        "shape-rendering": "geometricPrecision",
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Equal circular boundaries for all ten rings.
    for (let ring = 0; ring <= cfg.levels; ring++) {
      const edge = ring === 0 || ring === cfg.levels;
      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: innerRadius + ring * ringWidth,
        fill: "none",
        stroke: edge ? "#aeb2ad" : "#b9bcb7",
        "stroke-width": edge ? 1.25 : 0.95,
        "stroke-opacity": edge ? 0.92 : 0.82,
        "shape-rendering": "geometricPrecision",
        "vector-effect": "non-scaling-stroke",
      }));
    }

    if (cfg.showNumbers) {
      for (let ring = 0; ring < cfg.levels; ring++) {
        const textRadius = innerRadius + ring * ringWidth + ringWidth / 2;
        for (let local = 1; local <= cfg.divisions; local++) {
          const index = ring * cfg.divisions + (local - 1);
          const value = cfg.startValue + index * cfg.increment;
          const localAngle = direction * ((local % cfg.divisions) * step);
          const pos = polar(cx, cy, textRadius, localAngle);
          const rotation = readableRotation(localAngle);

          root.appendChild(svgEl("text", {
            x: pos.x,
            y: pos.y,
            class: "wheel-number",
            "font-size": 14,
            transform: `rotate(${rotation} ${pos.x} ${pos.y})`,
          }, String(value)));
        }
      }
    }

    if (cfg.showProtractor) {
      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: protractorInner,
        fill: "none",
        stroke: "#dcc0bc",
        "stroke-width": 1.05,
        "vector-effect": "non-scaling-stroke",
      }));
      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: protractorOuter,
        fill: "none",
        stroke: "#d9a9a5",
        "stroke-width": 1.2,
        "vector-effect": "non-scaling-stroke",
      }));

      for (let angle = 0; angle < 360; angle += 5) {
        const major = angle % 10 === 0;
        const drawAngle = cfg.protractorClockwise ? angle : -angle;
        const tickStart = polar(cx, cy, protractorOuter - (major ? 17 : 9), drawAngle);
        const tickEnd = polar(cx, cy, protractorOuter, drawAngle);
        root.appendChild(svgEl("line", {
          x1: tickStart.x,
          y1: tickStart.y,
          x2: tickEnd.x,
          y2: tickEnd.y,
          stroke: major ? "#d95650" : "#aaa9a5",
          "stroke-width": major ? 1.85 : 0.8,
          "vector-effect": "non-scaling-stroke",
        }));

        const labelR = protractorInner + 20;
        const p = polar(cx, cy, labelR, drawAngle);
        root.appendChild(svgEl("text", {
          x: p.x,
          y: p.y,
          class: `degree-label${major ? " major" : ""}`,
          transform: `rotate(${readableRotation(drawAngle)} ${p.x} ${p.y})`,
        }, `${angle}°`));
      }

      const markerAngle = Number(cfg.markerAngle) || 0;
      const tip = polar(cx, cy, calendarInner + 7, markerAngle);
      const left = polar(cx, cy, calendarInner - 6, markerAngle - 1.7);
      const right = polar(cx, cy, calendarInner - 6, markerAngle + 1.7);
      root.appendChild(svgEl("path", {
        d: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`,
        fill: "#d9211f",
      }));
    }

    if (cfg.showCalendar) {
      // Pale green guide as in the source application.
      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: calendarInner,
        fill: "none",
        stroke: "#b8cfc2",
        "stroke-width": 1.15,
        "vector-effect": "non-scaling-stroke",
      }));

      // Continuous green frame plus subtle alternating red/green marks.
      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: calendarOuter,
        fill: "none",
        stroke: "#b6cfc0",
        "stroke-width": 1.15,
        "vector-effect": "non-scaling-stroke",
      }));
      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: calendarOuter,
        fill: "none",
        stroke: "#d94a43",
        "stroke-width": 1.15,
        "stroke-dasharray": "14 14",
        "stroke-linecap": "butt",
        "vector-effect": "non-scaling-stroke",
      }));
      root.appendChild(svgEl("circle", {
        cx,
        cy,
        r: calendarOuter,
        fill: "none",
        stroke: "#3c9b60",
        "stroke-width": 1.15,
        "stroke-dasharray": "14 14",
        "stroke-dashoffset": "14",
        "stroke-linecap": "butt",
        "vector-effect": "non-scaling-stroke",
      }));

      for (const [angle, label] of CALENDAR_MARKS) {
        const drawAngle = cfg.calendarClockwise ? angle : -angle;
        const tick0 = polar(cx, cy, calendarInner, drawAngle);
        const tick1 = polar(cx, cy, calendarOuter - 4, drawAngle);
        const major = angle % 30 === 0;
        root.appendChild(svgEl("line", {
          x1: tick0.x,
          y1: tick0.y,
          x2: tick1.x,
          y2: tick1.y,
          stroke: major ? "#38965d" : "#86b19a",
          "stroke-width": major ? 1.7 : 1,
          "vector-effect": "non-scaling-stroke",
        }));

        const p = polar(cx, cy, calendarOuter + 9, drawAngle);
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
      stroke: "#b7bab5",
      "stroke-width": 1,
      "vector-effect": "non-scaling-stroke",
    }));
  }

  window.TasiGannWheel = { drawWheel };
})();