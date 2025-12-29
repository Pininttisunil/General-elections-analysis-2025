from flask import Flask, request, jsonify
from flask_cors import CORS
from analysis import analyze_gp
from analysis import analyze_gp, get_unique_gram_panchayats


app = Flask(__name__)
CORS(app)
@app.route("/")
def home():
    return {
        "message": "Backend is running successfully",
        "available_endpoints": [
            "/gplist",
            "/search?gp=Durgaram"
        ]
    }

@app.route("/search", methods=["GET"])
def search_gp():
    gp = request.args.get("gp")
    if not gp:
        return jsonify({"error": "GP name required"})
    return jsonify(analyze_gp(gp))

@app.route("/gplist")
def gplist():
    return jsonify(get_unique_gram_panchayats())
if __name__ == "__main__":
    app.run(debug=True)
