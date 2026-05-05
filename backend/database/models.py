from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    sessions = relationship("InterviewSession", back_populates="user")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_role = Column(String)
    experience_level = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"))
    role = Column(String) # "agent" or "user"
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Evaluation metrics for user messages
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    
    session = relationship("InterviewSession", back_populates="messages")
