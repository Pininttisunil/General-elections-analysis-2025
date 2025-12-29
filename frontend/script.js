let barChart, pieChart, donutChart, topChart;

/* ==============================
   LOAD GRAM PANCHAYAT LIST
================================ */
window.onload = loadGPList;

function loadGPList() {
   const API = "https://gp-election-backend.onrender.com";

         fetch(`${API}/gplist`)
         fetch(`${API}/search?gp=${gp}`)

        .then(res => res.json())
        .then(gps => {
            const list = document.getElementById("gpList");
            list.innerHTML = "";

            gps.forEach(gp => {
                if (!gp || gp.toLowerCase() === "total") return;

                const li = document.createElement("li");
                li.textContent = gp;

                li.onclick = () => {
                    document
                        .querySelectorAll(".sidebar li")
                        .forEach(el => el.classList.remove("active"));

                    li.classList.add("active");
                    document.getElementById("gpInput").value = gp;
                    searchGP();
                };

                list.appendChild(li);
            });
        })
        .catch(() => alert("Failed to load Gram Panchayats"));
}

/* ==============================
   NAV ACTIONS
================================ */
function goHome() {
    window.location.reload();
}

function showElections() {
    document.querySelector(".container").scrollIntoView({
        behavior: "smooth"
    });
}

/* ==============================
   SEARCH GP & LOAD DATA
================================ */
function searchGP() {
    const gp = document.getElementById("gpInput").value.trim();

    if (!gp) {
        alert("Please select a Gram Panchayat");
        return;
    }

    fetch(`http://localhost:5000/search?gp=${gp}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            document.getElementById("result").classList.remove("hidden");

            document.getElementById("gpName").innerText = data.gp;
            document.getElementById("winner").innerText = data.winner;
            document.getElementById("majority").innerText = data.majority;
            document.getElementById("mandalName").innerText = data.mandal;
            document.getElementById("totalCandidates").innerText = data.total_candidates;
            document.getElementById("totalVoters").innerText = data.total_voters;
            document.getElementById("votesPolled").innerText = data.votes_polled;
            document.getElementById("notaVotes").innerText = data.nota_votes;
            document.getElementById("rejectedVotes").innerText = data.rejected_votes;
            document.getElementById("remarks").innerText = data.remarks;

            /* =====================
               PARTY WIN LOGIC
            ===================== */
            const panel = document.getElementById("partyPanel");
            const logo = document.getElementById("partyLogo");
            const text = document.getElementById("partyText");

            panel.classList.remove("hidden", "brs", "congress");

            if (data.gp.toLowerCase() === "durgaram") {
                logo.src = "images/brs.png";
                text.innerHTML = "BRS Supported Candidate<br>🏆 WON";
                panel.classList.add("brs");
            } else {
                logo.src = "images/congress.png";
                text.innerHTML = "Congress Supported Candidate<br>🏆 WON";
                panel.classList.add("congress");
            }

            renderCandidateList(data);
            renderCharts(data);
        })
        .catch(() => alert("Server error. Check backend."));
}

/* ==============================
   CANDIDATE LIST
================================ */
function renderCandidateList(data) {
    const list = document.getElementById("candidateList");
    list.innerHTML = "";

    data.candidates.forEach(c => {
        const li = document.createElement("li");
        li.innerHTML = `<b>${c.candidate}</b> – ${c.votes} votes`;
        list.appendChild(li);
    });
}

/* ==============================
   VALUE POPUP (ANIMATION)
================================ */
function showAnimatedValue(chart, label, value) {
    document.querySelectorAll(".value-popup").forEach(e => e.remove());

    const popup = document.createElement("div");
    popup.className = "value-popup";
    popup.innerHTML = `<b>${label}</b><br>${value} votes`;

    document.body.appendChild(popup);

    const rect = chart.canvas.getBoundingClientRect();
    popup.style.left = rect.left + rect.width / 2 + "px";
    popup.style.top = rect.top + 30 + "px";

    setTimeout(() => popup.remove(), 2500);
}

/* ==============================
   GRADIENT HELPER
================================ */
function gradient(ctx, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
}

/* ==============================
   RENDER CHARTS
================================ */
function renderCharts(data) {
    const names = data.candidates.map(c => c.candidate);
    const votes = data.candidates.map(c => c.votes);

    const validVotes = data.valid_votes ?? votes.reduce((a, b) => a + b, 0);

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();
    if (donutChart) donutChart.destroy();
    if (topChart) topChart.destroy();

    /* ===== BAR CHART ===== */
    barChart = new Chart(barChart?.ctx || document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: names,
            datasets: [{
                data: votes,
                backgroundColor: gradient(
                    document.getElementById("barChart").getContext("2d"),
                    "#60a5fa",
                    "#1d4ed8"
                ),
                borderRadius: 12
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            animation: { duration: 1200 }
        }
    });

    /* ===== PIE CHART (LEGEND CLICK ENABLED) ===== */
    pieChart = new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
            labels: ["Valid Votes", "NOTA", "Rejected"],
            datasets: [{
                data: [validVotes, data.nota_votes, data.rejected_votes],
                backgroundColor: ["#3b82f6", "#f43f5e", "#fb923c"]
            }]
        },
        options: {
            plugins: {
                legend: {
                    onClick: (e, item, legend) => {
                        const index = item.index;
                        const value = legend.chart.data.datasets[0].data[index];
                        showAnimatedValue(legend.chart, item.text, value);
                    }
                }
            },
            animation: { duration: 1200 }
        }
    });

    /* ===== DOUGHNUT CHART (LEGEND CLICK ENABLED) ===== */
    donutChart = new Chart(document.getElementById("donutChart"), {
        type: "doughnut",
        data: {
            labels: names,
            datasets: [{
                data: votes,
                backgroundColor: ["#2563eb", "#ec4899", "#22c55e", "#f59e0b"]
            }]
        },
        options: {
            cutout: "65%",
            plugins: {
                legend: {
                    onClick: (e, item, legend) => {
                        const index = item.index;
                        const value = legend.chart.data.datasets[0].data[index];
                        showAnimatedValue(legend.chart, item.text, value);
                    }
                }
            },
            animation: { duration: 1400 }
        }
    });

    /* ===== TOP 3 ===== */
    topChart = new Chart(document.getElementById("topChart"), {
        type: "bar",
        data: {
            labels: names.slice(0, 3),
            datasets: [{
                data: votes.slice(0, 3),
                backgroundColor: gradient(
                    document.getElementById("topChart").getContext("2d"),
                    "#93c5fd",
                    "#1e40af"
                ),
                borderRadius: 10
            }]
        },
        options: {
            indexAxis: "y",
            plugins: { legend: { display: false } },
            animation: { duration: 1400 }
        }
    });
}
