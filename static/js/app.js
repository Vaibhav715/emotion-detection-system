document.addEventListener("DOMContentLoaded", () => {
  // DOM Cache
  const textInput = document.getElementById("text-input");
  const charCounter = document.getElementById("char-count");
  const analyzeBtn = document.getElementById("analyze-btn");
  const clearBtn = document.getElementById("clear-btn");
  const copyBtn = document.getElementById("copy-btn");
  const exportBtn = document.getElementById("export-json-btn");
  const latencyTag = document.getElementById("latency-tag");
  const idleState = document.getElementById("idle-placeholder");
  const loader = document.getElementById("loader");
  const resultBox = document.getElementById("result-box");
  const verdictCard = document.getElementById("verdict-card");
  const emotionEmoji = document.getElementById("emotion-emoji");
  const emotionLabel = document.getElementById("emotion-label");
  const polarityTag = document.getElementById("polarity-tag");
  const confidenceLabel = document.getElementById("confidence-label");
  const distributionBars = document.getElementById("distribution-bars");
  const radarChart = document.getElementById("radar-chart");
  const presetChips = document.querySelectorAll(".chip");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // History Drawer
  const toggleHistoryBtn = document.getElementById("toggle-history-btn");
  const closeHistoryBtn = document.getElementById("close-history-btn");
  const historyDrawer = document.getElementById("history-drawer");
  const historyList = document.getElementById("history-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const historyCounter = document.getElementById("history-counter");

  let latestData = null;
  let historyData = [];

  try {
    historyData = JSON.parse(localStorage.getItem("sentix_history") || "[]");
  } catch {
    historyData = [];
  }

  const emotionTheme = Object.freeze({
    joy: { color: "#22c55e", emoji: "😊", polarity: "Positive" },
    sadness: { color: "#3b82f6", emoji: "😔", polarity: "Negative" },
    anger: { color: "#ef4444", emoji: "😠", polarity: "Negative" },
    fear: { color: "#a855f7", emoji: "😨", polarity: "Negative" },
    love: { color: "#ec4899", emoji: "❤️", polarity: "Positive" },
    surprise: { color: "#f59e0b", emoji: "😲", polarity: "Neutral" },
    disgust: { color: "#10b981", emoji: "🤢", polarity: "Negative" },
    neutral: { color: "#94a3b8", emoji: "😐", polarity: "Neutral" },
    relief: { color: "#06b6d4", emoji: "😌", polarity: "Positive" }
  });

  updateHistoryUI();

  // Optimized Counter
  textInput.addEventListener("input", () => {
    charCounter.textContent = `${textInput.value.length} / 500`;
  });

  // Hotkey: Ctrl + Enter / Cmd + Enter
  textInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      executeAnalysis();
    }
  });

  // Benchmark Chips
  presetChips.forEach(chip => {
    chip.addEventListener("click", () => {
      textInput.value = chip.dataset.sample;
      charCounter.textContent = `${textInput.value.length} / 500`;
      executeAnalysis();
    });
  });

  // Clear
  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    charCounter.textContent = "0 / 500";
    resetToIdle();
  });

  // Tab Switching
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });

  // History Drawer Controls
  toggleHistoryBtn.addEventListener("click", () => historyDrawer.classList.toggle("hidden"));
  closeHistoryBtn.addEventListener("click", () => historyDrawer.classList.add("hidden"));
  clearHistoryBtn.addEventListener("click", () => {
    historyData = [];
    localStorage.removeItem("sentix_history");
    updateHistoryUI();
  });

  // Copy Results
  copyBtn.addEventListener("click", () => {
    if (!latestData) return;
    const txt = `Statement: "${latestData.input_text}"\nEmotion: ${latestData.predicted_emotion} (${latestData.confidence}%)\nLatency: ${latestData.latency_ms}ms\nBreakdown:\n` +
      Object.entries(latestData.scores).map(([k, v]) => ` - ${k}: ${v}%`).join("\n");
    navigator.clipboard.writeText(txt).then(() => {
      copyBtn.textContent = "✓";
      setTimeout(() => {
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      }, 1500);
    });
  });

  // Export JSON
  exportBtn.addEventListener("click", () => {
    if (!latestData) return;
    const blob = new Blob([JSON.stringify(latestData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentix_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Execute Analysis
  analyzeBtn.addEventListener("click", executeAnalysis);

  async function executeAnalysis() {
    const text = textInput.value.trim();
    if (!text) {
      textInput.focus();
      return;
    }

    idleState.classList.add("hidden");
    resultBox.classList.add("hidden");
    copyBtn.classList.add("hidden");
    exportBtn.classList.add("hidden");
    latencyTag.classList.add("hidden");
    loader.classList.remove("hidden");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error("Inference error.");

      const data = await response.json();
      latestData = data;
      saveToHistory(data);
      renderUI(data);
    } catch (err) {
      console.error(err);
      alert("Inference connection failed. Make sure app.py is running.");
      resetToIdle();
    } finally {
      loader.classList.add("hidden");
    }
  }

  function renderUI(data) {
    const emo = data.predicted_emotion.toLowerCase();
    const meta = emotionTheme[emo] || { color: "#38bdf8", emoji: "✨", polarity: "Neutral" };

    emotionEmoji.textContent = meta.emoji;
    emotionLabel.textContent = emo;
    emotionLabel.style.color = meta.color;
    polarityTag.textContent = `${meta.polarity} Polarity`;
    polarityTag.style.color = meta.color;
    confidenceLabel.textContent = `${data.confidence}%`;
    verdictCard.style.borderColor = `${meta.color}45`;

    latencyTag.textContent = `⚡ ${data.latency_ms || 8}ms`;
    latencyTag.classList.remove("hidden");
    copyBtn.classList.remove("hidden");
    exportBtn.classList.remove("hidden");

    // Batched Fragment Rendering for Bars (avoids DOM thrashing)
    const sorted = Object.entries(data.scores).sort((a, b) => b[1] - a[1]);
    const fragment = document.createDocumentFragment();

    sorted.forEach(([k, score]) => {
      const row = document.createElement("div");
      row.className = "spectrum-row";
      const itemMeta = emotionTheme[k] || { color: "#38bdf8" };

      row.innerHTML = `
        <span class="spectrum-name">${k}</span>
        <div class="spectrum-track">
          <div class="spectrum-fill" style="background-color: ${itemMeta.color}; width: 0%;" data-val="${score}%"></div>
        </div>
        <span class="spectrum-score">${score}%</span>
      `;
      fragment.appendChild(row);
    });

    distributionBars.replaceChildren(fragment);
    renderRadarChart(data.scores);
    resultBox.classList.remove("hidden");

    // Animate bars on next animation frame
    requestAnimationFrame(() => {
      distributionBars.querySelectorAll(".spectrum-fill").forEach(fill => {
        fill.style.width = fill.getAttribute("data-val");
      });
    });
  }

  function renderRadarChart(scores) {
    const keys = Object.keys(scores);
    const totalPoints = keys.length;
    const center = 150;
    const radius = 95;

    let svgHtml = `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    svgHtml += `<circle cx="${center}" cy="${center}" r="${radius * 0.5}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;

    const points = [];
    keys.forEach((key, idx) => {
      const angle = (Math.PI * 2 / totalPoints) * idx - Math.PI / 2;
      const scoreRatio = (scores[key] || 0) / 100;
      const currentRadius = Math.max(radius * scoreRatio, 10);

      const x = center + Math.cos(angle) * currentRadius;
      const y = center + Math.sin(angle) * currentRadius;
      points.push(`${x},${y}`);

      const axisX = center + Math.cos(angle) * (radius + 20);
      const axisY = center + Math.sin(angle) * (radius + 20);
      svgHtml += `<line x1="${center}" y1="${center}" x2="${center + Math.cos(angle) * radius}" y2="${center + Math.sin(angle) * radius}" stroke="rgba(255,255,255,0.08)"/>`;
      svgHtml += `<text x="${axisX}" y="${axisY + 4}" fill="#94a3b8" font-size="9" text-anchor="middle" font-family="'JetBrains Mono', monospace">${key}</text>`;
    });

    svgHtml += `<polygon points="${points.join(" ")}" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="2"/>`;
    radarChart.innerHTML = svgHtml;
  }

  function saveToHistory(item) {
    const entry = {
      text: item.input_text,
      emotion: item.predicted_emotion,
      confidence: item.confidence,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      payload: item
    };
    historyData.unshift(entry);
    if (historyData.length > 20) historyData.pop();
    try {
      localStorage.setItem("sentix_history", JSON.stringify(historyData));
    } catch {
      // Ignore quota errors if storage is full
    }
    updateHistoryUI();
  }

  function updateHistoryUI() {
    historyCounter.textContent = historyData.length;
    historyList.replaceChildren();

    if (historyData.length === 0) {
      historyList.innerHTML = `<div style="color: #64748b; font-size: 0.8rem; text-align: center; margin-top: 20px;">No historical sessions recorded.</div>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    historyData.forEach(item => {
      const card = document.createElement("div");
      card.className = "history-card";
      const meta = emotionTheme[item.emotion.toLowerCase()] || { color: "#38bdf8" };

      card.innerHTML = `
        <div class="history-meta">
          <span class="history-label" style="color: ${meta.color};">${item.emotion} (${item.confidence}%)</span>
          <span class="history-time">${item.time}</span>
        </div>
        <div class="history-snippet">${item.text}</div>
      `;

      card.addEventListener("click", () => {
        textInput.value = item.text;
        charCounter.textContent = `${item.text.length} / 500`;
        latestData = item.payload;
        idleState.classList.add("hidden");
        renderUI(item.payload);
        historyDrawer.classList.add("hidden");
      });

      fragment.appendChild(card);
    });

    historyList.appendChild(fragment);
  }

  function resetToIdle() {
    resultBox.classList.add("hidden");
    copyBtn.classList.add("hidden");
    exportBtn.classList.add("hidden");
    latencyTag.classList.add("hidden");
    idleState.classList.remove("hidden");
    latestData = null;
  }
});