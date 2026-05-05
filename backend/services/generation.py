import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from backend.prompts.templates import QUESTION_GENERATION_PROMPT

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7, api_key=os.getenv("GROQ_API_KEY"))

def generate_question(job_role: str, experience_level: str, resume_content: str, context: str) -> str:
    prompt = PromptTemplate.from_template(QUESTION_GENERATION_PROMPT)
    chain = prompt | llm
    response = chain.invoke({
        "job_role": job_role,
        "experience_level": experience_level,
        "resume_content": resume_content,
        "context": context
    })
    return response.content.strip()
