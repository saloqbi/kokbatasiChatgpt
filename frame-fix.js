(function () {
  const wheelApi = window.TasiGannWheel;
  if (!wheelApi || typeof wheelApi.drawWheel !== "function") return;

  const originalDrawWheel = wheelApi.drawWheel;

  wheelApi.drawWheel = function drawWheelWithReferenceFrame(svg, options) {
    originalDrawWheel(svg, options);

    // Remove the thick alternating red/green dashed frame.
    svg.querySelectorAll('circle[stroke="#d94a43"], circle[stroke="#3c9b60"]').forEach(node => node.remove());

    const outerGuide = svg.querySelector('circle[stroke="#b6cfc0"]');
    const innerGuide = svg.querySelector('circle[stroke="#b8cfc2"]');

    if (innerGuide) {
      innerGuide.setAttribute("stroke", "#c5d8cd");
      innerGuide.setAttribute("stroke-width", "0.95");
      innerGuide.setAttribute("stroke-opacity", "0.95");
    }

    if (outerGuide) {
      outerGuide.setAttribute("stroke", "#b9cfc2");
      outerGuide.setAttribute("stroke-width", "1.15");
      outerGuide.setAttribute("stroke-opacity", "1");

      // Add the second pale-green line close to the outer line, as in the reference.
      const secondOuterGuide = outerGuide.cloneNode(false);
      const radius = Number(outerGuide.getAttribute("r"));
      secondOuterGuide.setAttribute("r", String(radius - 4));
      secondOuterGuide.setAttribute("stroke", "#d1dfd7");
      secondOuterGuide.setAttribute("stroke-width", "0.85");
      secondOuterGuide.setAttribute("stroke-opacity", "1");
      outerGuide.parentNode.insertBefore(secondOuterGuide, outerGuide);
    }

    // Refine the calendar ticks to match the thinner reference frame.
    svg.querySelectorAll('line[stroke="#38965d"], line[stroke="#86b19a"]').forEach(line => {
      const major = line.getAttribute("stroke") === "#38965d";
      line.setAttribute("stroke", major ? "#3f9762" : "#8db49d");
      line.setAttribute("stroke-width", major ? "1.45" : "0.8");
    });

    // Keep the date labels just outside the green double frame.
    svg.querySelectorAll(".calendar-label").forEach(label => {
      label.setAttribute("font-size", "10.5");
      label.setAttribute("font-weight", "500");
    });
  };
})();