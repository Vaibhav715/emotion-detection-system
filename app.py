import os
import re
import time
from functools import lru_cache
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import torch
from transformers import pipeline

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "true"

# Optimize PyTorch CPU core utilization
if not torch.cuda.is_available():
    torch.set_num_threads(os.cpu_count() or 4)

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# Auto-detect optimal compute device (CUDA / MPS / CPU)
if torch.cuda.is_available():
    device = 0
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = "mps"
else:
    device = -1

print(f"Loading DistilRoBERTa pipeline (Hardware Target: {device})...")
classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None,
    device=device,
    truncation=True,
    max_length=256
)
print("Pipeline initialized and ready for production inference.")

# Pre-compile regex rules once at module load
COMPILED_RULES = [
    (re.compile(r"\bcan'?t say (?:i am|i'm) (?:disappointed|unhappy|sad|upset)\b", re.IGNORECASE), "i am secretly relieved and glad"),
    (re.compile(r"\bhardly (?:disappointed|upset|sad)\b", re.IGNORECASE), "feeling quite pleased and relieved"),
    (re.compile(r"\bnot (?:disappointed|unhappy|upset)\b", re.IGNORECASE), "relieved and happy"),
    (re.compile(r"\bnot (?:half bad|bad at all|bad)\b", re.IGNORECASE), "actually good and pleasant"),
    (re.compile(r"\bcan'?t complain\b", re.IGNORECASE), "feeling content and satisfied"),
    (re.compile(r"\bno complaints\b", re.IGNORECASE), "completely satisfied and content"),
    (re.compile(r"\bnot (?:thrilled|excited|happy|amused)\b", re.IGNORECASE), "feeling annoyed and disappointed"),
    (re.compile(r"\bhardly (?:a success|impressed)\b", re.IGNORECASE), "feeling unimpressed and disappointed"),
    (re.compile(r"\boh,?\s+fantastic[!\.]?\s+another\b", re.IGNORECASE), "i am furious and irritated with another"),
    (re.compile(r"\bjust what (?:i|my morning|my day) needed[!\.]?\b", re.IGNORECASE), "which makes me extremely angry and frustrated")
]

WHITESPACE_RE = re.compile(r"\s+")

def resolve_pragmatics(text: str) -> str:
    transformed = text
    for pattern, replacement in COMPILED_RULES:
        transformed = pattern.sub(replacement, transformed)
    return WHITESPACE_RE.sub(" ", transformed).strip()

@lru_cache(maxsize=2048)
def cached_inference(clean_input: str):
    """Zero-overhead inference lookup for previously evaluated normalized text."""
    with torch.inference_mode():
        predictions = classifier(clean_input)[0]
    return tuple((item["label"].lower(), float(item["score"])) for item in predictions)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/predict", methods=["POST"])
def predict():
    start_time = time.perf_counter()
    data = request.get_json(silent=True)
    if not data or "text" not in data or not data["text"].strip():
        return jsonify({"error": "Valid 'text' field is required."}), 400

    raw_text = data["text"].strip()
    normalized_text = resolve_pragmatics(raw_text)
    cache_lookup_key = normalized_text.lower()

    # Inference execution (cached or direct forward pass)
    raw_predictions = cached_inference(cache_lookup_key)
    sorted_preds = sorted(raw_predictions, key=lambda x: x[1], reverse=True)
    
    top_label, top_score = sorted_preds[0]
    scores = {label: round(score * 100, 2) for label, score in sorted_preds}
    latency_ms = round((time.perf_counter() - start_time) * 1000, 1)

    return jsonify({
        "input_text": raw_text,
        "predicted_emotion": top_label,
        "confidence": round(top_score * 100, 2),
        "scores": scores,
        "latency_ms": latency_ms
    })

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)