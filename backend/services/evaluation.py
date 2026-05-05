import json
import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from backend.prompts.templates import EVALUATION_PROMPT

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1, api_key=os.getenv("GROQ_API_KEY"))

def evaluate_answer(question: str, answer: str) -> dict:
    prompt = PromptTemplate.from_template(EVALUATION_PROMPT)
    chain = prompt | llm
    response = chain.invoke({"question": question, "answer": answer})
    
    # Try to parse the output as JSON
    try:
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        result = json.loads(content)
        return result
    except Exception as e:
        return {
            "score": 5.0,
            "strengths": [],
            "weaknesses": ["Failed to parse evaluation"],
            "suggested_improvements": "Could not evaluate properly due to parsing error."
        }
