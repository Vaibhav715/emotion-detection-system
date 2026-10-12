import os
import re
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# Mapping numeric labels (if present in test.csv) to emotion text strings
LABEL_MAP = {
    0: 'sadness',
    1: 'joy',
    2: 'love',
    3: 'anger',
    4: 'fear',
    5: 'surprise',
    '0': 'sadness',
    '1': 'joy',
    '2': 'love',
    '3': 'anger',
    '4': 'fear',
    '5': 'surprise'
}

def clean_text(text: str) -> str:
    """Preprocess text: lowercasing, stripping URLs, and removing punctuation."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text, flags=re.MULTILINE)
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def normalize_emotion(val):
    """Ensure emotion label is a clean string name, mapping numeric codes if necessary."""
    if pd.isna(val):
        return None
    val_str = str(val).strip().lower()
    
    # Check numeric mapping
    if val in LABEL_MAP:
        return LABEL_MAP[val]
    if val_str in LABEL_MAP:
        return LABEL_MAP[val_str]
        
    return val_str

def load_data():
    dfs = []
    
    # 1. Load test2.txt
    txt_path = os.path.join("dataset", "test2.txt")
    if os.path.exists(txt_path):
        df_txt = pd.read_csv(txt_path, sep=';', header=None, names=['text', 'emotion'])
        dfs.append(df_txt)

    # 2. Load test.csv
    csv_path = os.path.join("dataset", "test.csv")
    if os.path.exists(csv_path):
        try:
            # Try reading with semicolon separator first
            df_csv = pd.read_csv(csv_path, sep=';', header=None, names=['text', 'emotion'])
            if df_csv['emotion'].isnull().all():
                df_csv = pd.read_csv(csv_path)
        except Exception:
            df_csv = pd.read_csv(csv_path)
        
        # Match columns dynamically
        col_map = {col: 'text' for col in df_csv.columns if any(k in col.lower() for k in ['text', 'sentence', 'comment', 'content'])}
        col_map.update({col: 'emotion' for col in df_csv.columns if any(k in col.lower() for k in ['emotion', 'label', 'sentiment'])} )
        df_csv = df_csv.rename(columns=col_map)
        
        if 'text' in df_csv.columns and 'emotion' in df_csv.columns:
            dfs.append(df_csv[['text', 'emotion']])

    if not dfs:
        raise FileNotFoundError("No dataset files found in 'dataset/' directory.")

    combined_df = pd.concat(dfs, ignore_index=True).dropna()

    # Normalize data types: Convert text to string and harmonize emotion labels
    combined_df['text'] = combined_df['text'].astype(str).apply(clean_text)
    combined_df['emotion'] = combined_df['emotion'].apply(normalize_emotion)
    
    # Remove empty texts or missing labels
    combined_df = combined_df[(combined_df['text'] != "") & (combined_df['emotion'].notnull())]
    combined_df = combined_df.drop_duplicates()

    return combined_df

def train():
    os.makedirs("models", exist_ok=True)
    df = load_data()
    print(f"Total dataset samples: {len(df)}")
    print("\nClass distribution:\n", df['emotion'].value_counts())

    X = df['text']
    y = df['emotion']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True)),
        ('nb', MultinomialNB(alpha=0.1))
    ])

    print("\nTraining model pipeline...")
    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)
    print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    model_path = os.path.join("models", "emotion_model.joblib")
    joblib.dump(model_pipeline, model_path)
    print(f"\nModel saved successfully to '{model_path}'")

if __name__ == "__main__":
    train()