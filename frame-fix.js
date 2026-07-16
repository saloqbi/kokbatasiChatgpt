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

  const DATE_MARKS = [
    [0, "21 JUN"], [30, "21 JUL"], [60, "21 AUG"], [90, "21 SEP"],
    [120, "21 OCT"], [150, "21 NOV"], [180, "21 DEC"], [210, "20 JAN"],
    [240, "19 FEB"], [270, "21 MAR"], [300, "21 APR"], [330, "21 MAY"],
  ];

  const originalDrawWheel = wheelApi.drawWheel;

  wheelApi.drawWheel = function drawWheelWithExactReferenceFrame(svg, options) {
    originalDrawWheel(svg, options);

    // Remove the previous protractor/calendar implementation completely.
    const removableStrokes = [
      "#dcc0bc", "#d9a9a5", "#d95650", "#aaa9a5",
      "#b8cfc2", "#b6cfc0", "#d94a43", "#3c9b60",
      "#38965d", "#86b19a", "#c5d8cd", "#b9cfc2",
      "#d1dfd7", "#3f9762", "#8db49d",
    ];

    removableStrokes.forEach(stroke => {
      svg.querySelectorAll(`[stroke="${stroke}"]`).forEach(node => node.remove());
    });
    svg.querySelectorAll(".degree-label, .calendar-label").forEach(node => node.remove());
    svg.querySelectorAll('path[fill="#d9211f"]').forEach(node => node.remove());

    const root = svg.querySelector("g") || svg;
    const cx = 900;
    const cy = 900;

    // Exact frame geometry based on the latest reference image.
    const numberEdge = 763;
    const innerScaleRadius = 782;
    const tickOuterRadius = 814;
    const outerCalendarRadius = 852;
    const dateLabelRadius = 875;

    // Fine neutral baseline immediately outside the numbered wheel.
    root.appendChild(svgEl("circle", {
      cx, cy, r: innerScaleRadius,
      fill: "none",
      stroke: "#d5d7d5",
      "stroke-width": 0.85,
      "vector-effect": "non-scaling-stroke",
    }));

    // Red protractor frame.
    root.appendChild(svgEl("circle", {
      cx, cy, r: tickOuterRadius,
      fill: "none",
      stroke: "#ef8d8d",
      "stroke-width": 1.15,
      "vector-effect": "non-scaling-stroke",
    }));

    // One-degree scale with stronger 5° and 10° marks.
    for (let angle = 0; angle < 360; angle += 1) {
      const isCardinal = angle % 90 === 0;
      const isTen = angle % 10 === 0;
      const isFive = angle % 5 === 0;

      let tickLength = 5;
      let stroke = "#c8c9c7";
      let strokeWidth = 0.55;

      if (isFive) {
        tickLength = 10;
        stroke = "#e9a0a0";
        strokeWidth = 0.85;
      }
      if (isTen) {
        tickLength = 17;
        stroke = "#ef5d5d";
        strokeWidth = 1.3;
      }
      if (isCardinal) {
        tickLength = 25;
        stroke = "#ef2020";
        strokeWidth = 2.15;
      }

      const p0 = polar(cx, cy, tickOuterRadius - tickLength, angle);
      const p1 = polar(cx, cy, tickOuterRadius, angle);
      root.appendChild(svgEl("line", {
        x1: p0.x, y1: p0.y,
        x2: p1.x, y2: p1.y,
        stroke,
        "stroke-width": strokeWidth,
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Angle labels: gray at 5°, black at 10°, red at the four axes.
    for (let angle = 0; angle < 360; angle += 5) {
      const cardinal = angle % 90 === 0;
      const ten = angle % 10 === 0;
      const labelRadius = cardinal ? 768 : 772;
      const p = polar(cx, cy, labelRadius, angle);

      root.appendChild(svgEl("text", {
        x: p.x,
        y: p.y,
        class: "reference-angle-label",
        fill: cardinal ? "#ef2020" : (ten ? "#171717" : "#8b8b88"),
        "font-family": "Arial, sans-serif",
        "font-size": cardinal ? 15 : (ten ? 11.5 : 10.5),
        "font-weight": cardinal || ten ? 700 : 400,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, `${angle}°`));
    }

    // Single clean green calendar arc.
    root.appendChild(svgEl("circle", {
      cx, cy, r: outerCalendarRadius,
      fill: "none",
      stroke: "#19a344",
      "stroke-width": 1.55,
      "vector-effect": "non-scaling-stroke",
    }));

    // Monthly green ticks and labels outside the arc.
    for (const [angle, label] of DATE_MARKS) {
      const t0 = polar(cx, cy, outerCalendarRadius - 3, angle);
      const t1 = polar(cx, cy, outerCalendarRadius + 16, angle);
      root.appendChild(svgEl("line", {
        x1: t0.x, y1: t0.y,
        x2: t1.x, y2: t1.y,
        stroke: "#16983e",
        "stroke-width": 1.65,
        "vector-effect": "non-scaling-stroke",
      }));

      const p = polar(cx, cy, dateLabelRadius, angle);
      root.appendChild(svgEl("text", {
        x: p.x,
        y: p.y,
        class: "reference-date-label",
        fill: "#15963d",
        "font-family": "Arial, sans-serif",
        "font-size": 11.5,
        "font-weight": 700,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, label));
    }

    // Red directional triangle at the selected angle.
    const markerAngle = Number(options && options.markerAngle) || 20;
    const tip = polar(cx, cy, outerCalendarRadius - 7, markerAngle);
    const left = polar(cx, cy, outerCalendarRadius - 25, markerAngle - 1.8);
    const right = polar(cx, cy, outerCalendarRadius - 25, markerAngle + 1.8);
    root.appendChild(svgEl("path", {
      d: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`,
      fill: "#e31515",
    }));

    // A subtle radial continuation from the outer number ring to the scale.
    for (let angle = 0; angle < 360; angle += 10) {
      const p0 = polar(cx, cy, numberEdge, angle);
      const p1 = polar(cx, cy, innerScaleRadius, angle);
      root.appendChild(svgEl("line", {
        x1: p0.x, y1: p0.y,
        x2: p1.x, y2: p1.y,
        stroke: "#c2c5c2",
        "stroke-width": 0.75,
        "vector-effect": "non-scaling-stroke",
      }));
    }
  };
})();