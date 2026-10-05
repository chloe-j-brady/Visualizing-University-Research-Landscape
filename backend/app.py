from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

edges = pd.read_csv("data/paper_citation_links_within_fsu.csv")
edges["paper_id_1"] = edges["paper_id_1"].astype(str)
edges["paper_id_2"] = edges["paper_id_2"].astype(str)

# only load the columns the tooltip needs
works = pd.read_csv(
    "data/fsu_works_2021_2026.csv",
    usecols=["openalex_id", "title", "publication_year", "venue", "authors"],
)
works = works.drop_duplicates("openalex_id").set_index("openalex_id")

# collapse repeated edges, the repeat count becomes "value"
grouped = edges.groupby(["paper_id_1", "paper_id_2"]).size().reset_index(name="value")

def paper_info(pid):
    # look up one paper's metadata, with fallbacks so nothing is NaN in the JSON
    if pid not in works.index:
        return {"title": "Unknown title", "year": "", "venue": "Unknown venue", "authors": ""}
    r = works.loc[pid]

    # authors are separated by semicolons, keep the first 3 and add "et al."
    authors = ""
    if pd.notna(r["authors"]):
        names = [a.strip() for a in str(r["authors"]).split(";")]
        authors = "; ".join(names[:3])
        if len(names) > 3:
            authors += " et al."

    return {
        "title": r["title"] if pd.notna(r["title"]) else "Untitled",
        "year": int(r["publication_year"]),
        "venue": r["venue"] if pd.notna(r["venue"]) else "Unknown venue",
        "authors": authors,
    }

# every id on either side of an edge is a node, now with its metadata attached
all_ids = pd.unique(edges[["paper_id_1", "paper_id_2"]].values.ravel())
nodes = [{"id": pid, "group": 1, **paper_info(pid)} for pid in all_ids]

links = [
    {"source": row.paper_id_1, "target": row.paper_id_2, "value": int(row.value)}
    for row in grouped.itertuples()
]

@app.route("/api/network")
def network():
    return jsonify({"nodes": nodes, "links": links})

if __name__ == "__main__":
    app.run(port=5001, debug=True)