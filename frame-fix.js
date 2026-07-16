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

  // Approved monthly calendar sequence from the accepted reference image.
  const DATE_MARKS = [
    [0, "21 JUN"], [30, "21 JUL"], [60, "21 AUG"], [90, "21 SEP"],
    [120, "21 OCT"], [150, "21 NOV"], [180, "21 DEC"], [210, "20 JAN"],
    [240, "19 FEB"], [270, "21 MAR"], [300, "21 APR"], [330, "21 MAY"],
  ];

  const originalDrawWheel = wheelApi.drawWheel;

  wheelApi.drawWheel = function drawWheelWithApprovedFrame(svg, options) {
    originalDrawWheel(svg, options);

    // Remove every previous protractor/calendar implementation.
    const oldStrokes = [
      "#dcc0bc", "#d9a9a5", "#d95650", "#aaa9a5",
      "#b8cfc2", "#b6cfc0", "#d94a43", "#3c9b60",
      "#38965d", "#86b19a", "#e2c7c3", "#dcb7b2",
      "#73a287", "#c6c9c6", "#d0dfd7", "#b7cec1",
    ];
    oldStrokes.forEach(stroke => {
      svg.querySelectorAll(`[stroke="${stroke}"]`).forEach(node => node.remove());
    });
    svg.querySelectorAll(".degree-label, .calendar-label").forEach(node => node.remove());
    svg.querySelectorAll('path[fill="#d9211f"]').forEach(node => node.remove());

    const root = svg.querySelector("g") || svg;
    const cx = 900;
    const cy = 900;

    // Geometry copied from the approved frame image.
    const numberEdge = 763;
    const innerGuideRadius = 780;
    const tickBaselineRadius = 807;
    const angleLabelRadius = 829;
    const greenCalendarRadius = 852;
    const dateLabelRadius = 875;

    // Short radial continuation from the outer number ring to the scale.
    for (let angle = 0; angle < 360; angle += 10) {
      const p0 = polar(cx, cy, numberEdge, angle);
      const p1 = polar(cx, cy, innerGuideRadius, angle);
      root.appendChild(svgEl("line", {
        x1: p0.x, y1: p0.y,
        x2: p1.x, y2: p1.y,
        stroke: "#c7cac7",
        "stroke-width": 0.72,
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Two subtle neutral guides around the protractor scale.
    root.appendChild(svgEl("circle", {
      cx, cy, r: innerGuideRadius,
      fill: "none",
      stroke: "#d0d2d0",
      "stroke-width": 0.8,
      "vector-effect": "non-scaling-stroke",
    }));
    root.appendChild(svgEl("circle", {
      cx, cy, r: tickBaselineRadius,
      fill: "none",
      stroke: "#aeb1ae",
      "stroke-width": 0.9,
      "vector-effect": "non-scaling-stroke",
    }));

    // Dense one-degree protractor. Gray minor ticks, red 5°/10° ticks,
    // and strong red cardinal axes exactly as in the accepted image.
    for (let angle = 0; angle < 360; angle += 1) {
      const isCardinal = angle % 90 === 0;
      const isTen = angle % 10 === 0;
      const isFive = angle % 5 === 0;

      let tickLength = 5;
      let stroke = "#aeb0ae";
      let strokeWidth = 0.48;

      if (isFive) {
        tickLength = 11;
        stroke = "#ed8b8b";
        strokeWidth = 0.82;
      }
      if (isTen) {
        tickLength = 17;
        stroke = "#ef5555";
        strokeWidth = 1.2;
      }
      if (isCardinal) {
        tickLength = 27;
        stroke = "#ee1717";
        strokeWidth = 2.05;
      }

      const t0 = polar(cx, cy, tickBaselineRadius - tickLength, angle);
      const t1 = polar(cx, cy, tickBaselineRadius, angle);
      root.appendChild(svgEl("line", {
        x1: t0.x, y1: t0.y,
        x2: t1.x, y2: t1.y,
        stroke,
        "stroke-width": strokeWidth,
        "vector-effect": "non-scaling-stroke",
      }));
    }

    // Labels every 5°: gray half-steps, black tens, red cardinals.
    for (let angle = 0; angle < 360; angle += 5) {
      const isCardinal = angle % 90 === 0;
      const isTen = angle % 10 === 0;
      const p = polar(cx, cy, angleLabelRadius, angle);

      root.appendChild(svgEl("text", {
        x: p.x,
        y: p.y,
        fill: isCardinal ? "#ee1717" : (isTen ? "#111111" : "#858582"),
        "font-family": "Arial, sans-serif",
        "font-size": isCardinal ? 15 : (isTen ? 11.7 : 10.6),
        "font-weight": isCardinal || isTen ? 700 : 400,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, `${angle}°`));
    }

    // Approved single green calendar arc.
    root.appendChild(svgEl("circle", {
      cx, cy, r: greenCalendarRadius,
      fill: "none",
      stroke: "#07952e",
      "stroke-width": 1.85,
      "vector-effect": "non-scaling-stroke",
    }));

    // Monthly green ticks and labels outside the arc.
    for (const [angle, label] of DATE_MARKS) {
      const t0 = polar(cx, cy, greenCalendarRadius - 3, angle);
      const t1 = polar(cx, cy, greenCalendarRadius + 17, angle);
      root.appendChild(svgEl("line", {
        x1: t0.x, y1: t0.y,
        x2: t1.x, y2: t1.y,
        stroke: "#07952e",
        "stroke-width": 1.65,
        "vector-effect": "non-scaling-stroke",
      }));

      const p = polar(cx, cy, dateLabelRadius, angle);
      root.appendChild(svgEl("text", {
        x: p.x,
        y: p.y,
        fill: "#078a2b",
        "font-family": "Arial, sans-serif",
        "font-size": 11.5,
        "font-weight": 700,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, label));
    }

    // Red directional triangle between the angle scale and calendar arc.
    const markerAngle = Number(options && options.markerAngle) || 20;
    const tip = polar(cx, cy, greenCalendarRadius - 7, markerAngle);
    const left = polar(cx, cy, greenCalendarRadius - 27, markerAngle - 1.75);
    const right = polar(cx, cy, greenCalendarRadius - 27, markerAngle + 1.75);
    root.appendChild(svgEl("path", {
      d: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`,
      fill: "#df1717",
    }));
  };
})();