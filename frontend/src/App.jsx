// frontend/src/App.jsx
import { useEffect, useRef, useState } from "react";
import { drawNetwork } from "./network";
import "./App.css";

function App() {
  const svgRef = useRef(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5001/api/network")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("backend fetch failed:", err));
  }, []);

  useEffect(() => {
    if (data && svgRef.current) {
      drawNetwork(svgRef.current, data, 1400, 900);
    }
  }, [data]);

  return (
    <div className="App">
      <h1>Citation Network Visualization in FSU (CJB23F, Chloe Brady)</h1>

      <button disabled={!data} onClick={() => drawNetwork(svgRef.current, data, 960, 700)}>
        Reset view
      </button>

      <svg ref={svgRef} width={1400} height={900}></svg>
      <div id="tooltip" className="tooltip"></div>
    </div>
  );
}

export default App;