from flask import Flask, request, jsonify
from flask_cors import CORS
from analysis import analyze_gp, get_unique_gram_panchayats

app = Flask(__name__)
CORS(app)

@app.route("/search", methods=["GET"])
def search_gp():
    gp = request.args.get("gp")
    if not gp:
        return jsonify({"error": "GP name required"}), 400
    return jsonify(analyze_gp(gp))

@app.route("/gplist", methods=["GET"])
def gplist():
    return jsonify(get_unique_gram_panchayats())

# ❌ DO NOT add app.run() on Render
# ❌ DO NOT redefine app again
