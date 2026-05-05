# AI Interview Preparation Agent

A production-ready full-stack AI system that conducts mock interviews, evaluates answers using LLMs, tracks performance, and dynamically generates tailored questions.

## 🏗️ System Architecture

### 1. Frontend (Vanilla HTML, CSS, JS)
- **UI Components**: Single Page Application with dynamic views via Vanilla JS.
- **Styling**: Pure CSS with modern glassmorphism design.
- **Serving**: Directly served by FastAPI using `StaticFiles`.

### 2. Backend (FastAPI + Python)
- **API Layer**: REST endpoints to manage sessions, handle chat inputs, and upload resumes.
- **Database**: PostgreSQL (via SQLAlchemy) to store users, sessions, and messages/evaluations.
- **Vector DB**: FAISS (local) or Pinecone for semantic memory and historical answer retrieval.
- **AI Agent Framework**: LangGraph is used to define the interview loop (Question Generation -> Answer -> Evaluation -> Question Generation).
- **LLM Integration**: LangChain with Groq's `llama-3.3-70b-versatile` model for high-performance inference.

## 📁 Project Structure

```
c:\Interview_Agent\
├── backend/
│   ├── agents/
│   ├── database/
│   ├── prompts/
│   ├── services/
│   ├── utils/
│   ├── main.py              # FastAPI application (also serves frontend)
│   └── requirements.txt
├── frontend_html/           # Vanilla Web App
│   ├── index.html
│   ├── style.css
│   └── script.js
├── docker-compose.yml
└── Dockerfile
```

## 🚀 Deployment Guide

### Prerequisites
- Python 3.10+
- Docker Desktop (Must be installed and **currently running**)
- Groq API Key

### How to Run Locally

**Step 1: Set up your Environment Variables**
Ensure you have a `.env` file in the **root directory** (`C:\Interview_Agent`) with the following contents:
```env
DATABASE_URL=postgresql://user:password@localhost:5433/interview_db
GROQ_API_KEY=your-actual-api-key-here
```

**Step 2: Start the PostgreSQL Database**
Open Docker Desktop and wait for it to load completely. Then, open your terminal in the root directory (`C:\Interview_Agent`) and run:
```powershell
docker-compose up db -d
```
*(This will start the database on port 5433 to avoid conflicts).*

**Step 3: Install Python Dependencies**
Open your terminal in the root directory (`C:\Interview_Agent`), navigate to the backend, install the packages, and go back to the root:
```powershell
cd backend
pip install -r requirements.txt
cd ..
```

**Step 4: Start the FastAPI Server**
From the **root directory** (`C:\Interview_Agent`), run the server on port 8765:
```powershell
uvicorn backend.main:app --port 8765 --reload
```

**Step 5: Access the Application**
Open your web browser and navigate to:
**[http://localhost:8765/](http://localhost:8765/)**

The beautiful frontend interface is automatically served by the backend!

### Docker Deployment

To spin up the entire stack using Docker:

1. Create an `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your-api-key-here
   ```
2. Run Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
The API will be available at `http://localhost:8000`.

## 🔥 Advanced Features Implemented
- **Agentic Workflow**: Uses LangGraph to control the sequence of evaluation and generation.
- **Explainable AI Feedback**: Provides JSON structured feedback with a Score (1-10), Strengths, Weaknesses, and Improvements.
- **Dynamic Adaptability**: Incorporates past weaknesses into the `context` to adapt the next question.
- **Database Modularity**: Clean separation of Vector DB and Relational DB.
