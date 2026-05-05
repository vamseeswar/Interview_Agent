from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import shutil
import os

from backend.database.database import engine, Base, get_db
from backend.database import models
from backend.agents.workflow import interview_agent, AgentState
from backend.utils.resume_parser import parse_resume

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Interview Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartSessionRequest(BaseModel):
    username: str
    job_role: str
    experience_level: str

class ChatRequest(BaseModel):
    session_id: int
    user_message: str

class SignupRequest(BaseModel):
    username: str
    email: str

class LoginRequest(BaseModel):
    username: str

@app.post("/auth/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = models.User(username=req.username, email=req.email)
    db.add(user)
    db.commit()
    return {"message": "User created", "username": user.username}

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please sign up.")
    return {"message": "Login successful", "username": user.username}

@app.get("/users/{username}/stats")
def user_stats(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate streak (total completed sessions)
    sessions_count = db.query(models.InterviewSession).filter(models.InterviewSession.user_id == user.id).count()
    return {"username": user.username, "total_interviews": sessions_count}

@app.post("/sessions/start")
def start_session(req: StartSessionRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user:
        user = models.User(username=req.username, email=f"{req.username}@example.com")
        db.add(user)
        db.commit()
        db.refresh(user)
    
    session = models.InterviewSession(
        user_id=user.id,
        job_role=req.job_role,
        experience_level=req.experience_level
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Initialize the agent state to generate the first question
    state: AgentState = {
        "session_id": session.id,
        "job_role": req.job_role,
        "experience_level": req.experience_level,
        "resume_content": "",
        "messages": [],
        "current_question": "",
        "latest_evaluation": {}
    }
    
    # Generate first question
    # result = interview_agent.invoke(state, {"configurable": {"thread_id": str(session.id)}})
    # The agent might not execute nodes properly without a sequence. 
    # For a direct call to generate question:
    from backend.services.generation import generate_question
    first_question = generate_question(req.job_role, req.experience_level, "", "")
    
    msg = models.Message(session_id=session.id, role="agent", content=first_question)
    db.add(msg)
    db.commit()
    
    return {"session_id": session.id, "first_question": first_question}

@app.post("/sessions/chat")
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    user_msg = models.Message(session_id=req.session_id, role="user", content=req.user_message)
    db.add(user_msg)
    db.commit()
    
    # Get last agent question
    last_agent_msg = db.query(models.Message).filter(
        models.Message.session_id == req.session_id, 
        models.Message.role == "agent"
    ).order_by(models.Message.id.desc()).first()
    
    # Evaluate
    from backend.services.evaluation import evaluate_answer
    from backend.services.generation import generate_question
    
    evaluation = evaluate_answer(last_agent_msg.content if last_agent_msg else "", req.user_message)
    
    user_msg.score = evaluation.get("score")
    user_msg.feedback = str(evaluation)
    db.commit()
    
    # Generate next question based on weak areas
    weaknesses = ", ".join(evaluation.get("weaknesses", []))
    context = f"Weaknesses: {weaknesses}"
    next_question = generate_question(session.job_role, session.experience_level, "", context)
    
    agent_msg = models.Message(session_id=req.session_id, role="agent", content=next_question)
    db.add(agent_msg)
    db.commit()
    
    return {
        "evaluation": evaluation,
        "next_question": next_question
    }

@app.post("/upload/resume")
async def upload_resume(file: UploadFile = File(...)):
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    text = parse_resume(file_location)
    os.remove(file_location)
    return {"parsed_text": text}

@app.get("/sessions/{session_id}/history")
def get_history(session_id: int, db: Session = Depends(get_db)):
    messages = db.query(models.Message).filter(models.Message.session_id == session_id).order_by(models.Message.created_at.asc()).all()
    return {"messages": messages}

@app.get("/sessions/{session_id}/summary")
def get_summary(session_id: int, db: Session = Depends(get_db)):
    messages = db.query(models.Message).filter(
        models.Message.session_id == session_id,
        models.Message.role == "user"
    ).all()
    
    if not messages:
        return {"overall_score": 0, "weaknesses": [], "improvements": []}
        
    total_score = 0
    evaluated_count = 0
    all_weaknesses = set()
    all_improvements = []
    
    import ast
    for msg in messages:
        if msg.score is not None:
            total_score += msg.score
            evaluated_count += 1
        if msg.feedback:
            try:
                # feedback is stored as str(dict)
                feedback_dict = ast.literal_eval(msg.feedback)
                for w in feedback_dict.get("weaknesses", []):
                    all_weaknesses.add(w)
                imp = feedback_dict.get("suggested_improvements", "")
                if imp:
                    all_improvements.append(imp)
            except Exception:
                pass
                
    overall_score = round(total_score / evaluated_count, 1) if evaluated_count > 0 else 0
    
    return {
        "overall_score": overall_score,
        "weaknesses": list(all_weaknesses),
        "improvements": all_improvements
    }

import os
from fastapi.responses import FileResponse
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend_html"))

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(static_dir, "index.html"))

app.mount("/", StaticFiles(directory=static_dir), name="static")
