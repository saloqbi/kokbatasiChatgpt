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
    [0, "21 JUN"], [15, "6 JUL"], [30, "22 JUL"], [45, "6 AUG"],
    [60, "22 AUG"], [75, "6 SEP"], [90, "22 SEP"], [105, "7 OCT"],
    [120, "22 OCT"], [135, "6 NOV"], [150, "21 NOV"], [165, "6 DEC"],
    [180, "21 DEC"], [195, "5 JAN"], [210, "20 JAN"], [225, "4 FEB"],
    [240, "19 FEB"], [255, "6 MAR"], [270, "21 MAR"], [285, "5 APR"],
    [300, "21 APR"], [315, "6 MAY"], [330, "21 MAY"], [345, "6 JUN"],
  ];

  const originalDrawWheel = wheelApi.drawWheel;

  wheelApi.drawWheel = function drawWheelWithTwoCircleFrame(svg, options) {
    originalDrawWheel(svg, options);

    const root = svg.querySelector("g") || svg;
    const cx = 900;
    const cy = 900;
    const numberEdge = 763;
    const redAngleRadius = 807;
    const greenCalendarRadius = 852;
    const angleLabelRadius = 785;
    const dateLabelRadius = 874;

    // Remove every old outer circle. The numbered wheel ends at radius 763.
    svg.querySelectorAll("circle").forEach(circle => {
      const radius = Number(circle.getAttribute("r"));
      if (Number.isFinite(radius) && radius > numberEdge) circle.remove();
    });

    // Remove all old protractor/calendar ticks, labels and marker.
    const oldOuterStrokes = new Set([
      "#dcc0bc", "#d9a9a5", "#d95650", "#aaa9a5",
      "#b8cfc2", "#b6cfc0", "#d94a43", "#3c9b60",
      "#38965d", "#86b19a", "#e2c7c3", "#dcb7b2",
      "#73a287", "#c6c9c6", "#d0dfd7", "#b7cec1",
      "#d0d2d0", "#aeb1ae", "#aeb0ae", "#ed8b8b",
      "#ef5555", "#ee1717", "#07952e",
    ]);

    svg.querySelectorAll("line").forEach(line => {
      if (oldOuterStrokes.has(line.getAttribute("stroke"))) line.remove();
    });
    svg.querySelectorAll(".degree-label, .calendar-label").forEach(node => node.remove());
    svg.querySelectorAll('path[fill="#d9211f"], path[fill="#df1717"]').forEach(node => node.remove());

    // 1) The only red circle: angle frame.
    root.appendChild(svgEl("circle", {
      cx,
      cy,
      r: redAngleRadius,
      fill: "none",
      stroke: "#d99a95",
      "stroke-width": 1.25,
      "vector-effect": "non-scaling-stroke",
    }));

    // Angle ticks every 5 degrees. No extra circular guide is drawn.
    for (let angle = 0; angle < 360; angle += 5) {
      const cardinal = angle % 90 === 0;
      const major = angle % 10 === 0;
      const tickLength = cardinal ? 24 : (major ? 16 : 8);
      const tickColor = cardinal ? "#df2e29" : (major ? "#d8615b" : "#aaa9a5");
      const tickWidth = cardinal ? 2 : (major ? 1.25 : 0.7);
      const t0 = polar(cx, cy, redAngleRadius - tickLength, angle);
      const t1 = polar(cx, cy, redAngleRadius, angle);

      root.appendChild(svgEl("line", {
        x1: t0.x,
        y1: t0.y,
        x2: t1.x,
        y2: t1.y,
        stroke: tickColor,
        "stroke-width": tickWidth,
        "vector-effect": "non-scaling-stroke",
      }));

      const p = polar(cx, cy, angleLabelRadius, angle);
      root.appendChild(svgEl("text", {
        x: p.x,
        y: p.y,
        fill: cardinal ? "#df2e29" : (major ? "#171717" : "#858582"),
        "font-family": "Arial, sans-serif",
        "font-size": cardinal ? 13 : (major ? 10.8 : 9.8),
        "font-weight": cardinal || major ? 700 : 400,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, `${angle}°`));
    }

    // 2) The only green circle: calendar frame.
    root.appendChild(svgEl("circle", {
      cx,
      cy,
      r: greenCalendarRadius,
      fill: "none",
      stroke: "#6fa88a",
      "stroke-width": 1.25,
      "vector-effect": "non-scaling-stroke",
    }));

    // Date ticks and labels. These are lines/text, not additional circles.
    for (const [angle, label] of DATE_MARKS) {
      const t0 = polar(cx, cy, greenCalendarRadius - 2, angle);
      const t1 = polar(cx, cy, greenCalendarRadius + 12, angle);
      root.appendChild(svgEl("line", {
        x1: t0.x,
        y1: t0.y,
        x2: t1.x,
        y2: t1.y,
        stroke: "#6fa88a",
        "stroke-width": angle % 30 === 0 ? 1.35 : 0.9,
        "vector-effect": "non-scaling-stroke",
      }));

      const p = polar(cx, cy, dateLabelRadius, angle);
      root.appendChild(svgEl("text", {
        x: p.x,
        y: p.y,
        fill: "#5e7769",
        "font-family": "Arial, sans-serif",
        "font-size": 10.2,
        "font-weight": 500,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        transform: `rotate(${readableRotation(angle)} ${p.x} ${p.y})`,
      }, label));
    }

    const markerAngle = Number(options && options.markerAngle) || 20;
    const tip = polar(cx, cy, greenCalendarRadius - 5, markerAngle);
    const left = polar(cx, cy, greenCalendarRadius - 20, markerAngle - 1.35);
    const right = polar(cx, cy, greenCalendarRadius - 20, markerAngle + 1.35);
    root.appendChild(svgEl("path", {
      d: `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`,
      fill: "#d9211f",
    }));
  };
})();