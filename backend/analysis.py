import pandas as pd
import re

FILE = "elections.xlsx"

# -------------------------------
# Helpers
# -------------------------------
def safe_int(value):
    num = pd.to_numeric(value, errors="coerce")
    return 0 if pd.isna(num) else int(num)

def normalize_text(val):
    val = str(val).lower()
    return re.sub(r"[^a-z]", "", val)

# -------------------------------
# Main logic
# -------------------------------
def analyze_gp(gp_name):

    # Read raw Excel
    df_raw = pd.read_excel(FILE, header=None)

    # Normalized copy
    df = df_raw.apply(lambda col: col.astype(str).str.strip().str.lower())

    search_key = normalize_text(gp_name)

    # -------------------------------
    # 1️⃣ Detect Mandal column by DATA
    # -------------------------------
    mandal_col = None
    for col in df.columns:
        if "kothaguda" in df[col].values:
            mandal_col = col
            break

    # -------------------------------
    # 2️⃣ Detect GP column by DATA (NOT header)
    # -------------------------------
    gp_col = None
    for col in df.columns:
        if col == mandal_col:
            continue  # skip mandal column

        if search_key in df[col].apply(normalize_text).values:
            gp_col = col
            break

    if gp_col is None:
        return {"error": "Gram Panchayat not found"}

    # -------------------------------
    # 3️⃣ Filter GP rows
    # -------------------------------
    gp_df = df[df[gp_col].apply(normalize_text) == search_key]

    if gp_df.empty:
        return {"error": "Gram Panchayat not found"}

    # -------------------------------
    # 4️⃣ Column positions (from your sheet)
    # -------------------------------
    candidate_col = gp_col + 1
    total_voters_col = gp_col + 4
    votes_polled_col = gp_col + 5
    votes_col = gp_col + 6
    rejected_col = gp_col + 7
    nota_col = gp_col + 8

    # Mandal name
    mandal_name = (
        gp_df.iloc[0][mandal_col].title()
        if mandal_col is not None
        else "N/A"
    )

    # -------------------------------
    # 5️⃣ Candidate-wise votes
    # -------------------------------
    candidates = gp_df[[candidate_col, votes_col]].copy()
    candidates.columns = ["candidate", "votes"]
    candidates = candidates[candidates["candidate"] != ""]

    candidates["votes"] = pd.to_numeric(
        candidates["votes"], errors="coerce"
    ).fillna(0).astype(int)

    total_candidates = len(candidates)
    valid_votes = int(candidates["votes"].sum())

    # -------------------------------
    # 6️⃣ Totals
    # -------------------------------
    row0 = gp_df.iloc[0]

    total_voters   = safe_int(row0[total_voters_col])
    votes_polled   = safe_int(row0[votes_polled_col])
    rejected_votes = safe_int(row0[rejected_col])
    nota_votes     = safe_int(row0[nota_col])

    # -------------------------------
    # 7️⃣ Winner & Majority
    # -------------------------------
    candidates = candidates.sort_values("votes", ascending=False)

    winner = candidates.iloc[0]
    runner_up_votes = candidates.iloc[1]["votes"] if len(candidates) > 1 else 0
    majority = int(winner["votes"] - runner_up_votes)

    remarks = f"{winner['candidate']} won with majority of {majority} votes"

     # ✅ UNANIMOUS CHECK
    if total_candidates == 1:
        remarks = f"Unanimous winner: {winner['candidate']}"
    else:
        remarks = f"{winner['candidate']} won with majority of {majority} votes"

    return {
        "gp": gp_name.title(),
        "mandal": mandal_name,
        "winner": winner["candidate"],
        "majority": majority,
        "total_candidates": total_candidates,
        "total_voters": total_voters,
        "votes_polled": votes_polled,
        "nota_votes": nota_votes,
        "rejected_votes": rejected_votes,
        "remarks": remarks,
        "candidates": candidates.to_dict(orient="records"),
        "candidates_list": candidates["candidate"].tolist()
    }
def get_unique_gram_panchayats():
    import re
    df = pd.read_excel(FILE, header=None)

    gp_col = 2  # your GP column index

    gps = []

    for val in df[gp_col]:
        if pd.isna(val):
            continue

        val = str(val).strip()

        if len(val) < 3 or len(val) > 40:
            continue

        clean = val.lower()

        # ❌ REMOVE TOTAL / SUMMARY ROWS
        if clean in ["total", "grand total", "overall", "summary"]:
            continue

        if any(word in clean for word in [
            "election", "mandal", "sl", "sno", "gram panchayat"
        ]):
            continue

        val = re.sub(r"[^A-Za-z ]", "", val)
        gps.append(val.title())

    return sorted(set(gps))
