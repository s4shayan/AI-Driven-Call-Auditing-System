# 🎙️ AI-DRIVEN Call Auditing System

A sophisticated, AI-powered platform designed to automate the auditing of corporate agent calls. By leveraging state-of-the-art Natural Language Processing (NLP) and Speech-to-Text technologies, this system provides deep insights into agent performance, customer satisfaction, and compliance.

---

## ✨ Key Features

*   **🎧 Automated Transcription**: High-accuracy speech-to-text conversion using OpenAI's **Whisper** model.
*   **👥 Speaker Diarization**: Intelligently identifies and separates speakers in conversation.
*   **⚖️ Intelligent Call Auditing**: Automatically evaluates calls based on predefined **Knowledge Base** rules using vector embeddings.
*   **❤️ Advanced Scoring (GSM/CSM)**: 
    *   **Greeting Score Model (GSM)**: Evaluates the professionalism and completeness of call openings.
    *   **Closing Score Model (CSM)**: Assesses the quality of call resolutions and closings.
    *   **EmpathyScorer**: NLP-driven assessment of emotional intelligence and customer rapport.
*   **📈 Performance Insights**: Detailed metrics on politeness, clarity, context, and completeness.
*   **📊 Performance Dashboard**: Detailed reports and trend visualizations for agent performance over time.
*   **🧠 Knowledge Management**: Vector-based ingestion and management of auditing rules and reference materials.
*   **🕸️ Knowledge Graph**: Visualizes relationships between different auditing entities and rules.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+)
- **Models**: 
    - **Whisper**: For robust transcription.
    - **SentenceTransformers (`all-MiniLM-L6-v2`)**: For knowledge embedding and retrieval.
    - **Custom Scikit-learn/PyTorch Models**: For GSM and CSM scoring.
- **Database**: MSSQL (with SQLAlchemy) for robust enterprise data management.
- **Task Processing**: Asynchronous processing pipeline for handling large audio files.

### Frontend
- **Framework**: [React Native](https://reactnative.dev/) (Native UI Experience)
- **State Management**: React Hooks & Navigation State.
- **Visualization**: React Native Chart Kit & Progress bars for score breakdowns.
- **Tools**: Expo-compatible, React Navigation, FontAwesome.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or higher.
- **Python**: 3.12 or higher.
- **FFmpeg**: Required on the system path for audio processing and conversion.

### Backend Setup
1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. **Knowledge Ingestion**: Initialize the knowledge base by running the ingestion script:
   ```bash
   python -m App.Knowledge.knowledge_ingestion 
   ```
5. Start the server:
   ```bash
   uvicorn App.main:app --reload
   ```

### Frontend Setup
1. Navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npx react-native start
   # In another terminal:
   npx react-native run-android # or run-ios
   ```

---

## 📂 Project Structure

```text
├── Backend/                 # FastAPI Enterprise API
│   ├── App/
│   │   ├── routes/          # API Endpoints (Calls, Agents, Knowledge)
│   │   ├── crud/            # Database Operations
│   │   ├── model/           # ML Models (Empathy, Scoring, Whisper)
│   │   ├── CSM/GSM/         # Specialized Scoring Components
│   │   └── Knowledge/       # Ingestion and Vector Search Logic
│   └── input_audio_files/   # Audio storage and processing
├── Frontend/                # Cross-platform Mobile App
│   ├── App/
│   │   ├── (tabs)/          # Main Bottom Tabs Navigation
│   │   └── components/      # Reusable UI Elements
│   └── android/ios/         # Platform Build Assets
└── calls/                   # Sample Audio & Documentation
```

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

> [!IMPORTANT]
> Ensure you have an active MSSQL instance configured in `App/db.py` before running the backend.
