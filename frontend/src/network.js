// frontend/src/network.js
import * as d3 from "d3";

export function drawNetwork(svgEl, data, width, height) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove(); // wipe anything from a previous render

  const tooltip = d3.select("#tooltip");

  const g = svg.append("g"); // zoom/pan transforms this group, not the svg itself

  const simulation = d3
    .forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id((d) => d.id))
    .force("charge", d3.forceManyBody().strength(-40))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.03))
    .force("y", d3.forceY(height / 2).strength(0.03))
    .force("collide", d3.forceCollide(9));

  const link = g
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke-width", (d) => Math.sqrt(d.value));

  const node = g
    .append("g")
    .attr("stroke", "#fff")
    .selectAll("circle")
    .data(data.nodes)
    .join("circle")
    .attr("r", 7)
    .attr("fill", "#782F40") // FSU red
    .call(drag(simulation));

  // tooltip, same mouseover / mousemove / mouseout pattern as the click-to-highlight lab
  node
    .on("mouseover", (event, d) => {
      // cut long titles so one paper can't cover the canvas
      const title = d.title.length > 90 ? d.title.slice(0, 90) + "..." : d.title;
      // .text() with newlines instead of .html(), since titles can contain < and >
      tooltip
        .text(`${title}\n${d.year} | ${d.venue}\n${d.authors}`)
        .style("opacity", 1);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 14 + "px")
        .style("top", event.pageY - 36 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 8])
    .on("zoom", (event) => g.attr("transform", event.transform));

  svg.call(zoom);

  // once the sim settles, fit everything into the visible area
  simulation.on("end", () => {
    const bounds = g.node().getBBox();
    if (bounds.width === 0 || bounds.height === 0) return;

    const rawScale = 0.9 / Math.max(bounds.width / width, bounds.height / height);
    const scale = Math.min(Math.max(rawScale, 0.4), 1.5);

    const tx = width / 2 - scale * (bounds.x + bounds.width / 2);
    const ty = height / 2 - scale * (bounds.y + bounds.height / 2);

    svg
      .transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  });

  function drag(sim) {
    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d3.select(this).raise().attr("r", 11).attr("stroke", "#333");
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d3.select(this).attr("r", 7).attr("stroke", "#fff");
      d.fx = null;
      d.fy = null;
    }
    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
  }
}