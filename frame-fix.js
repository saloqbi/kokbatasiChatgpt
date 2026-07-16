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

  // Exact 15-degree calendar sequence visible in the reference application.
  const DATE_MARKS = [
    [0, "21 JUN"], [15, "6 JUL"], [30, "22 JUL"], [45, "6 AUG"],
    [60, "22 AUG"], [75, "6 SEP"], [90, "22 SEP"], [105, "7 OCT"],
    [120, "22 OCT"], [135, "6 NOV"], [150, "21 NOV"], [165, "6 DEC"],
    [180, "21 DEC"], [195, "5 JAN"], [210, "20 JAN"], [225, "4 FEB"],
    [240, "19 FEB"], [255, "6 MAR"], [270, "21 MAR"], [285, "5 APR"],
    [300, "21 APR"], [315, "6 MAY"], [330, "21 MAY"], [345, "6 JUN"],
  ];

  const originalDrawWheel = wheelApi.drawWheel;

  wheelApi.drawWheel = function drawWheelWithReferenceFrame(svg, options) {
    originalDrawWheel(svg, options);

    // Remove the previous angle/calendar frame completely.
    const oldStrokes = [
      "#dcc0bc", "#d9a9a5", "#d95650", "#aaa9a5",
      "#b8cfc2", "#b6cfc0", "#d94a43", "#3c9b60",
      "#38965d", "#86b19a",
    ];
    oldStrokes.forEach(stroke => {
      svg.querySelectorAll(`[stroke="${stroke}"]`).forEach(node => node.remove());
    });
    svg.querySelectorAll(".degree-label, .calendar-label").forEach(node => node.remove());
    svg.querySelectorAll('path[fill="#d9211f"]').forEach(node => node.remove());

    const root = svg.querySelector("g") || svg;
    const cx = 900;
    const cy = 900;

    // Reference proportions: numbered wheel, rose angle band, then pale-green calendar band.
    const numberEdge = 763;
    const angleInnerRadius = 779;
    const angleOuterRadius = 813;
    const angleLabelRadius = 791;
    const calendarInnerRadius = 841;
    const calendarOuterRadius = 846;
    const dateLabelRadius = 866;

    // Subtle continuation from the number cells into the angle band every 10 degrees.
    for (let angle = 0; angle < 360; angle += 10) {
      const p0 = polar(cx, cy, numberEdge, angle);
      const p1 = polar(cx, cy, angleInnerRadius, angle);
      root.appendChild(svgEl("line", {
        x1: p0.x, y1: p0.y,
        x2: p1.x, y2: p1.y,
        stroke: "#c6c9c6",
        "stroke-width": 0.75,
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Two thin pale-rose circles, matching the original Gannzilla protractor frame.
    root.appendChild(svgEl("circle", {
      cx, cy, r: angleInnerRadius,
      fill: "none",
      stroke: "#e2c7c3",
      "stroke-width": 0.9,
      "vector-effect": "non-scaling-stroke",
    }));
    root.appendChild(svgEl("circle", {
      cx, cy, r: angleOuterRadius,
      fill: "none",
      stroke: "#dcb7b2",
      "stroke-width": 1.05,
      "vector-effect": "non-scaling-stroke",
    }));

    // Reference scale: labels/ticks every 5 degrees, red major ticks every 10 degrees.
    for (let angle = 0; angle < 360; angle += 5) {
      const isCardinal = angle % 90 === 0;
      const isMajor = angle % 10 === 0;
      const tickLength = isCardinal ? 22 : (isMajor ? 15 : 8);
      const tickColor = isCardinal ? "#df3c37" : (isMajor ? "#d96862" : "#b9b9b5");
      const tickWidth = isCardinal ? 1.9 : (isMajor ? 1.25 : 0.65);

      const t0 = polar(cx, cy, angleOuterRadius - tickLength, angle);
      const t1 = polar(cx, cy, angleOuterRadius, angle);
      root.appendChild(svgEl("line", {
        x1: t0.x, y1: t0.y,
        x2: t1.x, y2: t1.y,
        stroke: tickColor,
        "stroke-width": tickWidth,
        "vector-effect": "non-scaling-stroke",
      }));

      const p = polar(cx, cy, angleLabelRadius, angle);
      root.appendChild(svgEl("text", {
        x: p.x,
        y: p.y,
        fill: isMajor ? "#181818" : "#878783",
        "font-family": "Arial, sans-serif",
        "font-size": isMajor ? 10.8 : 9.8,
        "font-weight": isMajor ? 700 : 400,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, `${angle}°`));
    }

    // Small red center marker at 0°, as shown in the reference.
    const zeroDot = polar(cx, cy, angleLabelRadius + 6, 0);
    root.appendChild(svgEl("circle", {
      cx: zeroDot.x,
      cy: zeroDot.y,
      r: 3.1,
      fill: "#df3c37",
      stroke: "#ffffff",
      "stroke-width": 0.7,
    }));

    // Two close, continuous, pale-green calendar arcs — no red/green dashes.
    root.appendChild(svgEl("circle", {
      cx, cy, r: calendarInnerRadius,
      fill: "none",
      stroke: "#d0dfd7",
      "stroke-width": 0.85,
      "vector-effect": "non-scaling-stroke",
    }));
    root.appendChild(svgEl("circle", {
      cx, cy, r: calendarOuterRadius,
      fill: "none",
      stroke: "#b7cec1",
      "stroke-width": 1.05,
      "vector-effect": "non-scaling-stroke",
    }));

    // Calendar ticks and all 24 date labels at 15-degree intervals.
    for (const [angle, label] of DATE_MARKS) {
      const t0 = polar(cx, cy, calendarInnerRadius - 1, angle);
      const t1 = polar(cx, cy, calendarOuterRadius + 11, angle);
      root.appendChild(svgEl("line", {
        x1: t0.x, y1: t0.y,
        x2: t1.x, y2: t1.y,
        stroke: "#73a287",
        "stroke-width": angle % 30 === 0 ? 1.35 : 0.95,
        "vector-effect": "non-scaling-stroke",
      }));

      const p = polar(cx, cy, dateLabelRadius, angle);
      root.appendChild(svgEl("text", {
        x: p.x,
        y: p.y,
        fill: "#60776a",
        "font-family": "Arial, sans-serif",
        "font-size": 10.2,
        "font-weight": 500,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, label));
    }

    // Smaller red marker positioned inside the calendar band at the selected angle.
    const markerAngle = Number(options && options.markerAngle) || 20;
    const tip = polar(cx, cy, calendarInnerRadius + 1, markerAngle);
    const left = polar(cx, cy, calendarInnerRadius - 15, markerAngle - 1.35);
    const right = polar(cx, cy, calendarInnerRadius - 15, markerAngle + 1.35);
    root.appendChild(svgEl("path", {
      d: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`,
      fill: "#d9211f",
    }));
  };
})();