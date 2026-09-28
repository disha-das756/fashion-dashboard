from fastapi import APIRouter
from pydantic import BaseModel

from chatbot import process_support_query

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatQueryRequest(BaseModel):
    query: str

@router.post("")
def chat_endpoint(payload: ChatQueryRequest):
    return process_support_query(payload.query)
