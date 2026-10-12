# Sentix AI — Context-Aware Emotion Detection & Telemetry System

A high-performance, context-aware Natural Language Processing (NLP) system designed to identify granular emotional dimensions from text. The system specifically resolves complex linguistic edge cases—such as sarcasm, irony, double negation, and litotes—that commonly cause traditional classification heads to fail.

---

## 📌 Project Overview

Traditional sentiment and emotion analysis tools often rely on isolated word frequencies, leading to incorrect classifications on sarcastic or understated remarks. **Sentix AI** couples a transformer-based backbone (**DistilRoBERTa**) with an inference-time pragmatic preprocessor, sub-millisecond memory caching, and a responsive web dashboard with live radar telemetry.

### Key Capabilities
- **Pragmatic & Litotes Resolution:** Detects indirect negative constructions (e.g., *"I can't say I'm disappointed"*) and situational sarcasm (e.g., *"Oh, fantastic! Another flat tire"*), mapping them to their true underlying emotional sentiment.
- **Sub-Millisecond Neural Caching:** In-memory LRU caching (`@lru_cache`) paired with PyTorch inference mode drops roundtrip latency on recurring inputs to $<5\text{ ms}$.
- **Hardware-Adaptive Acceleration:** Automatically leverages CUDA GPUs, Apple Silicon MPS, or dynamically allocated multi-threaded CPU cores.
- **Enterprise UI / UX:** Dark-themed glassmorphic interface featuring linear confidence bars, multi-dimensional SVG radar charts, session history persistence via `localStorage`, and JSON/text report export.

---

## 🏗️ Architecture & Evolution

```
[User Input Stream]
         │
         ▼
[Regex Pragmatic & Litotes Preprocessor]
  ├── Detects sarcasm markers & understated double negatives
  └── Normalizes indirect syntax into canonical semantic tokens
         │
         ▼
[In-Memory LRU Cache Lookup]
  ├── Hit  ──> Return cached telemetry (< 5ms)
  └── Miss ──> Forward to neural pipeline
         │
         ▼
[DistilRoBERTa Multi-Class Classifier]
  └── Bidirectional self-attention over candidate emotion labels
         │
         ▼
[Flask REST API Engine] ──> [Glassmorphic Web Dashboard & Radar Chart]
```

### Model Evolution Summary

| Iteration | Architecture | Accuracy | Primary Limitations |
| :--- | :--- | :--- | :--- |
| **V1 (Baseline)** | TF-IDF + Multinomial Naive Bayes | ~62.5% | Bag-of-words assumption failed completely on sarcasm and negation inversion. |
| **V2 (Contextual)** | DistilRoBERTa (`j-hartmann`) | ~80.0% | Lexical overlap bias: high-weight tokens (*"disappointed"*) overwhelmed indirect context. |
| **V3 (Production)** | DistilRoBERTa + Pragmatic Resolver + LRU Cache | **~85%+** | Accurately resolves edge cases while maintaining sub-10ms response times. |

---

## 🧪 Benchmark Test Cases

| Category | Input Sentence | Expected Emotion | Baseline Model Prediction | Sentix AI Prediction |
| :--- | :--- | :--- | :--- | :--- |
| **Litotes / Indirect Negation** | *"I can't say I'm disappointed that they cancelled the trip."* | **Joy / Relief** | Sadness (93.57%) | **Joy / Relief** |
| **Sarcasm / Situational Irony** | *"Oh, fantastic! Another flat tire on the way to an interview. Just what my morning needed."* | **Anger / Frustration** | Joy (53.65%) | **Anger** |
| **Mixed Emotions / Relief** | *"The exam was brutal, but thank goodness it's finally over."* | **Joy / Relief** | Sadness / Fear | **Joy / Relief** |
| **Nuanced Negation** | *"The food wasn't half bad, actually."* | **Joy / Contentment** | Disgust / Sadness | **Joy** |
| **Direct High-Intensity** | *"I hear suspicious footsteps coming from upstairs right now."* | **Fear** | Fear | **Fear** |

---

## 📂 Project Directory Structure

```text
Emotion Detection System/
│
├── app.py                  # Flask backend with caching, resolver, & pipeline
├── requirements.txt        # Python dependency manifest
├── README.md               # Complete project documentation
├── templates/
│   └── index.html          # HTML5 layout with SVG radar & telemetry elements
└── static/
    ├── css/
    │   └── style.css       # Hardware-accelerated glassmorphic styling
    └── js/
        └── app.js          # Asynchronous telemetry, tab routing, & session storage
```

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10 to 3.12 installed
- Windows PowerShell or Command Prompt

### Step 1: Clone or Navigate to the Repository
```powershell
cd "D:\Emotion Detection System"
```

### Step 2: Create and Activate a Virtual Environment

**In VS Code (PowerShell):**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**In Windows Command Prompt (CMD):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

### Step 3: Install Required Dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## 💻 Running the Application

1. Suppress Hugging Face Windows symlink warnings and start the server:
   ```powershell
   $env:HF_HUB_DISABLE_SYMLINKS_WARNING="1"
   python app.py
   ```
2. Open your web browser and navigate to:
   ```text
   http://127.0.0.1:5000
   ```
3. **Usage Tips:**
   - Type or paste your text in the input box, or select a preset benchmark chip.
   - Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to execute instant inference.
   - Switch between **Linear Spectrum** and **Radar Distribution** to inspect probability geometry.
   - Open the **History** drawer to view and re-inspect past queries.

---

## 🔌 API Reference

### Emotion Inference Endpoint

- **Endpoint:** `POST /api/predict`
- **Content-Type:** `application/json`

#### Request Body
```json
{
  "text": "I can't say I'm disappointed that they cancelled the trip."
}
```

#### Response Payload
```json
{
  "input_text": "I can't say I'm disappointed that they cancelled the trip.",
  "predicted_emotion": "joy",
  "confidence": 88.42,
  "latency_ms": 3.8,
  "scores": {
    "joy": 88.42,
    "surprise": 5.12,
    "neutral": 3.85,
    "sadness": 1.24,
    "anger": 0.72,
    "fear": 0.45,
    "disgust": 0.20
  }
}
```

---

## 🔮 ## 8. Future Roadmap: Evolution to Multimodal Emotion AI 🚀

While the current system provides robust textual and pragmatic analysis, human emotional communication is inherently multimodal. The planned architectural extensions include:

1. 🎙️ **Speech Emotion Recognition (Audio Modality)**:
   * Ingest spoken audio streams to extract acoustic features (pitch variance, energy, MFCCs) using models such as **Wav2Vec 2.0**.
   * Resolve acoustic sarcasm where literal text directly contradicts vocal intonation and inflection.

2. 📷 **Facial Expression & Landmark Detection (Visual Modality)**:
   * Utilize **OpenCV** and **MediaPipe** for real-time 468-point 3D facial mesh tracking.
   * Classify micro-expressions (e.g., subtle smirks, brow furrowing, squinting) using lightweight convolutional neural networks (MobileNetV3).

3. 🧠 **Late / Cross-Attention Multimodal Fusion**:
   * Fuse probability distributions across Text, Audio, and Video using a learned attention gating layer:
     $$\text{Emotion}_{\text{final}} = \alpha \cdot P_{\text{text}} + \beta \cdot P_{\text{audio}} + \gamma \cdot P_{\text{visual}}$$

4. 🎭 **Dynamic Emoji & Avatar Feedback**:
   * Map continuous Valence-Arousal values to interactive, reactive 3D avatar and emoji animations in the web dashboard in real time.

5. ⚡ **Edge Quantization & ONNX Runtime**:
   * Quantize model weights to INT8 precision to minimize memory overhead and ensure seamless execution on resource-constrained consumer devices.