from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

edges = pd.read_csv("data/paper_citation_links_within_fsu.csv")
edges["paper_id_1"] = edges["paper_id_1"].astype(str)
edges["paper_id_2"] = edges["paper_id_2"].astype(str)

grouped = edges.groupby(["paper_id_1", "paper_id_2"]).size().reset_index(name="value")

all_ids = pd.unique(edges[["paper_id_1", "paper_id_2"]].values.ravel())
nodes = [{"id": pid, "group": 1} for pid in all_ids]

links = [
    {"source": row.paper_id_1, "target": row.paper_id_2, "value": int(row.value)}
    for row in grouped.itertuples()
]

@app.route('/api/network')
def network():
    return jsonify({"nodes": nodes, "links": links})

if __name__ == '__main__':
    app.run(port=5001, debug=True)