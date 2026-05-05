import os
import faiss
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

class VectorDB:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        # Using a simple in-memory FAISS store, can be persisted
        self.vector_store = FAISS.from_documents(
            [Document(page_content="Initial dummy document", metadata={"dummy": "dummy"})], 
            self.embeddings
        )
        
    def add_texts(self, texts: list[str], metadatas: list[dict] = None):
        docs = [Document(page_content=t, metadata=m or {}) for t, m in zip(texts, metadatas or [None]*len(texts))]
        self.vector_store.add_documents(docs)
        
    def search(self, query: str, k: int = 3):
        return self.vector_store.similarity_search(query, k=k)

vector_db_instance = VectorDB()

def get_vector_db():
    return vector_db_instance
