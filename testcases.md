## Benchmark Test Cases & Edge Case Evaluation

| Category | Input Sentence | Expected Emotion | What a Basic Model Predicts | Why It Matters |
| :--- | :--- | :--- | :--- | :--- |
| **Litotes / Indirect Negation** | *"I can't say I'm disappointed that they cancelled the trip."* | **Joy / Relief** | Sadness | Proves the preprocessor overrides isolated negative tokens (*"disappointed"*, *"cancelled"*). |
| **Sarcasm / Situational Irony** | *"Oh, fantastic! Another flat tire on the way to an interview. Just what my morning needed."* | **Anger / Frustration** | Joy | Demonstrates detection of sarcastic tonal markers (*"Oh, fantastic!"*, *"Just what my morning needed"*). |
| **Mixed Emotions / Relief** | *"The exam was brutal, but thank goodness it's finally over."* | **Joy / Relief** | Fear or Sadness | Shows that final clause resolution captures emotional shift from stress to relief. |
| **Nuanced Negation** | *"The food wasn't half bad, actually."* | **Joy / Contentment** | Disgust or Sadness | Verifies understated positive approval (*"not half bad"*). |
| **Direct High-Intensity** | *"I hear suspicious footsteps coming from upstairs right now."* | **Fear** | Fear | Confirms baseline transformer accuracy on unambiguous emotional text remains high. |