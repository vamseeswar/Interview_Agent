from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END
from backend.services.evaluation import evaluate_answer
from backend.services.generation import generate_question

class AgentState(TypedDict):
    session_id: int
    job_role: str
    experience_level: str
    resume_content: str
    messages: List[dict] # list of {"role": "...", "content": "..."}
    current_question: str
    latest_evaluation: dict

def generate_next_question_node(state: AgentState):
    # Retrieve past weaknesses or context
    context = ""
    if state["latest_evaluation"]:
        weaknesses = ", ".join(state["latest_evaluation"].get("weaknesses", []))
        context = f"Candidate showed weakness in: {weaknesses}"
    
    question = generate_question(
        job_role=state["job_role"],
        experience_level=state["experience_level"],
        resume_content=state["resume_content"],
        context=context
    )
    return {"current_question": question, "messages": state["messages"] + [{"role": "agent", "content": question}]}

def evaluate_answer_node(state: AgentState):
    # Find the last agent question and user answer
    user_answer = ""
    agent_question = state["current_question"]
    if state["messages"] and state["messages"][-1]["role"] == "user":
        user_answer = state["messages"][-1]["content"]
    
    evaluation = evaluate_answer(agent_question, user_answer)
    return {"latest_evaluation": evaluation}

def build_workflow():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("generate_question", generate_next_question_node)
    workflow.add_node("evaluate_answer", evaluate_answer_node)
    
    workflow.add_edge(START, "generate_question")
    workflow.add_edge("generate_question", "evaluate_answer")
    workflow.add_edge("evaluate_answer", END)
    
    return workflow.compile()

interview_agent = build_workflow()
