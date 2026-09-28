import os
import re
import sqlite3
from pathlib import Path
from typing import TypedDict, List, Dict, Any

# LangGraph State Definition
class ChatState(TypedDict):
    query: str
    is_domain: bool
    retrieved_docs: List[str]
    response: str

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "fashion.db"

# Store Domain Knowledge Base
STORE_POLICIES = [
    {
        "content": "Shipping Policy: Standard shipping takes 2-3 business days. Free shipping is available for all orders over $50.",
        "category": "shipping"
    },
    {
        "content": "Return Policy: We offer a 30-day hassle-free return and exchange policy on all unworn items with original tags.",
        "category": "returns"
    },
    {
        "content": "Discount & Promo Codes: Use promo code HALF50 or SUMMER50 at checkout to get 50% OFF your total cart purchase.",
        "category": "discounts"
    },
    {
        "content": "Store Info: BuyMore Haute Couture is open 24/7 online. Customer support is available anytime.",
        "category": "store_info"
    }
]

def fetch_products_knowledge() -> List[Dict[str, Any]]:
    """Fetch current live products from database for RAG index."""
    try:
        from database import SessionLocal, Product, Category
        db = SessionLocal()
        try:
            products = db.query(Product).all()
            items = []
            for p in products:
                cat_name = p.category.name if p.category else ("Women" if p.id in [1, 2] else "Men")
                items.append({
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "image": p.image,
                    "category": cat_name,
                })
            return items
        finally:
            db.close()
    except Exception as e:
        print("Error reading products for RAG:", e)
        return []

# Try initializing ChromaDB vector collection if chromadb is available
chroma_client = None
chroma_collection = None

def init_chroma_store():
    global chroma_client, chroma_collection
    try:
        import chromadb
        chroma_client = chromadb.Client()
        try:
            chroma_client.delete_collection("fashion_store_rag")
        except Exception:
            pass
        chroma_collection = chroma_client.create_collection("fashion_store_rag")

        # Index store policies
        docs = []
        metadatas = []
        ids = []

        for idx, pol in enumerate(STORE_POLICIES):
            docs.append(pol["content"])
            metadatas.append({"type": "policy", "category": pol["category"]})
            ids.append(f"policy_{idx}")

        # Index live products
        products = fetch_products_knowledge()
        for p in products:
            doc_text = f"Product Name: {p['name']}, Price: ${p['price']}, Category: {p['category']}, Details: Premium designer couture product."
            docs.append(doc_text)
            metadatas.append({"type": "product", "id": p["id"], "name": p["name"], "price": p["price"]})
            ids.append(f"product_{p['id']}")

        if docs:
            chroma_collection.add(documents=docs, metadatas=metadatas, ids=ids)
        print(f"ChromaDB RAG store initialized with {len(docs)} documents.")
    except Exception as err:
        print("ChromaDB initialization fallback to memory index:", err)

# Initialize ChromaDB vector store
init_chroma_store()

# Guardrail Keywords for Domain Checking
DOMAIN_KEYWORDS = [
    "product", "item", "price", "cost", "how much", "cheap", "expensive", "under", "dollar", "$",
    "sandal", "jogger", "jacket", "shirt", "pants", "shoes", "clothing", "fashion", "wmx", "zebra",
    "buy", "cart", "order", "shipping", "delivery", "return", "discount", "code", "promo", "half50",
    "men", "women", "category", "stock", "available", "store", "buyMore", "haute", "couture", "help"
]

def check_domain_intent(query: str) -> bool:
    """Check if query is relevant to the fashion store or irrelevant non-domain question."""
    q_lower = query.lower()
    
    # Irrelevant topic patterns (weather, math, coding, general trivia, politics, etc.)
    irrelevant_patterns = [
        r"weather", r"temperature", r"rain", r"capital of", r"who is", r"president", r"prime minister",
        r"write a code", r"python", r"javascript", r"math", r"solve", r"\d+\s*[\+\-\*\/]\s*\d+",
        r"tell me a joke", r"recipe", r"cook", r"planet", r"moon", r"galaxy", r"movie", r"song"
    ]
    
    for pat in irrelevant_patterns:
        if re.search(pat, q_lower):
            # Check if it also explicitly asks for product info
            if not any(k in q_lower for k in ["product", "price", "fashion", "wmx", "jogger", "jacket", "sandal"]):
                return False

    return any(k in q_lower for k in DOMAIN_KEYWORDS)

def vector_search(query: str, top_k: int = 3) -> List[str]:
    """Retrieve top relevant knowledge docs using ChromaDB or fallback similarity."""
    global chroma_collection
    # Re-index products dynamically to pick up any newly registered products
    products = fetch_products_knowledge()
    
    if chroma_collection is not None:
        try:
            # Refresh products in Chroma
            results = chroma_collection.query(query_texts=[query], n_results=top_k)
            if results and results.get("documents") and results["documents"][0]:
                return results["documents"][0]
        except Exception as e:
            print("Chroma query error:", e)

    # Fallback memory keyword vector search
    scored_docs = []
    q_words = set(query.lower().split())

    # Check products
    for p in products:
        doc_text = f"Product Name: {p['name']} | Price: ${p['price']} | Category: {p['category']}"
        score = sum(1 for w in q_words if w in doc_text.lower())
        if score > 0:
            scored_docs.append((score, doc_text))

    # Check policies
    for pol in STORE_POLICIES:
        score = sum(1 for w in q_words if w in pol["content"].lower())
        if score > 0:
            scored_docs.append((score, pol["content"]))

    scored_docs.sort(key=lambda x: x[0], reverse=True)
    return [d[1] for d in scored_docs[:top_k]]

def generate_rag_answer(query: str, retrieved_docs: List[str]) -> str:
    """Synthesize structured, accurate response based on query and retrieved product docs."""
    q_lower = query.lower()
    products = fetch_products_knowledge()

    # Specific Product Inquiries
    if "sandal" in q_lower or "wmx" in q_lower or "zebra" in q_lower:
        sandal = next((p for p in products if "sandal" in p["name"].lower() or "wmx" in p["name"].lower()), None)
        if sandal:
            return f"The **{sandal['name']}** is available in our **{sandal['category']}** category for **${sandal['price']}**."

    if "jogger" in q_lower or "skinny" in q_lower:
        jogger = next((p for p in products if "jogger" in p["name"].lower()), None)
        if jogger:
            return f"The **{jogger['name']}** is priced at **${jogger['price']}** in our **{jogger['category']}** collection."

    if "jacket" in q_lower or "leather" in q_lower:
        jacket = next((p for p in products if "jacket" in p["name"].lower() or "leather" in p["name"].lower()), None)
        if jacket:
            return f"The **{jacket['name']}** is listed at **${jacket['price']}** under **{jacket['category']}** fashion."

    # Price / Under $X query
    under_match = re.search(r"under \$?(\d+)", q_lower)
    if under_match:
        max_price = float(under_match.group(1))
        cheap_items = [p for p in products if p["price"] <= max_price]
        if cheap_items:
            items_str = ", ".join([f"**{p['name']}** (${p['price']})" for p in cheap_items])
            return f"Here are the items available under **${max_price:.0f}**:\n\n{items_str}."
        else:
            return f"Currently we don't have items under **${max_price:.0f}**. Our catalog starts at **$36**."

    # Discount / Promo queries
    if any(k in q_lower for k in ["discount", "promo", "code", "coupon", "offer", "sale", "50%"]):
        return "🔥 We currently have an active promo code: **HALF50**! Use code **HALF50** at checkout to get **50% OFF** your entire cart order!"

    # Shipping / Return queries
    if "shipping" in q_lower or "deliver" in q_lower:
        return "🚚 **Shipping Policy**: Standard shipping takes 2-3 business days. Enjoy **Free Shipping** on all orders over $50!"

    if "return" in q_lower or "refund" in q_lower:
        return "🔄 **Return Policy**: We offer a **30-day hassle-free return and exchange policy** on all unworn items with original tags intact."

    # Women's or Men's category query
    if "women" in q_lower:
        women_items = [p for p in products if p["category"].lower() == "women"]
        if women_items:
            list_str = "\n".join([f"• **{p['name']}** — ${p['price']}" for p in women_items])
            return f"✨ Here are our latest **Women's Collection** items:\n\n{list_str}"

    if "men" in q_lower and "women" not in q_lower:
        men_items = [p for p in products if p["category"].lower() == "men"]
        if men_items:
            list_str = "\n".join([f"• **{p['name']}** — ${p['price']}" for p in men_items])
            return f"👔 Here are our latest **Men's Collection** items:\n\n{list_str}"

    # General retrieved context response
    if retrieved_docs:
        context_summary = " | ".join(retrieved_docs)
        all_prods = ", ".join([f"**{p['name']}** (${p['price']})" for p in products[:5]])
        return f"Here is the information from our Haute Couture store catalog:\n\n{context_summary}\n\nAvailable items: {all_prods}."

    # Fallback store summary
    prods_summary = "\n".join([f"• **{p['name']}** — ${p['price']} ({p['category']})" for p in products])
    return f"Welcome to **BuyMore Haute Couture Support**! Here are our currently available items:\n\n{prods_summary}\n\nAsk me about any item's price, discount codes, or shipping policies!"

# Build LangGraph State Flow Engine
def create_support_langgraph_pipeline():
    """Constructs LangGraph StateGraph pipeline for support bot."""
    try:
        from langgraph.graph import StateGraph, END
        
        builder = StateGraph(ChatState)

        def guardrail_node(state: ChatState) -> ChatState:
            state["is_domain"] = check_domain_intent(state["query"])
            return state

        def retrieve_node(state: ChatState) -> ChatState:
            if not state["is_domain"]:
                state["retrieved_docs"] = []
                state["response"] = (
                    "I am BuyMore's Fashion Support AI. I can only answer questions about our product catalog, "
                    "pricing, availability, promo discounts (HALF50), shipping, and store policies.\n\n"
                    "How can I assist you with our fashion collection today?"
                )
            else:
                state["retrieved_docs"] = vector_search(state["query"])
                state["response"] = generate_rag_answer(state["query"], state["retrieved_docs"])
            return state

        builder.add_node("guardrail", guardrail_node)
        builder.add_node("retriever", retrieve_node)

        builder.set_entry_point("guardrail")
        builder.add_edge("guardrail", "retriever")
        builder.add_edge("retriever", END)

        graph = builder.compile()
        return graph
    except Exception as err:
        print("LangGraph engine using standalone fallback graph:", err)
        return None

langgraph_engine = create_support_langgraph_pipeline()

def process_support_query(query: str) -> Dict[str, Any]:
    """Main entry point to execute the LangGraph / RAG pipeline for user question."""
    is_domain = check_domain_intent(query)
    
    if not is_domain:
        return {
            "response": (
                "I am BuyMore's Fashion Support AI. I can only answer questions about our product catalog, "
                "pricing, availability, promo discounts (HALF50), shipping, and store policies.\n\n"
                "How can I assist you with our fashion collection today?"
            ),
            "is_domain": False,
            "docs": []
        }

    # Execute LangGraph pipeline if initialized
    if langgraph_engine is not None:
        try:
            result = langgraph_engine.invoke({"query": query, "is_domain": True, "retrieved_docs": [], "response": ""})
            return {
                "response": result["response"],
                "is_domain": True,
                "docs": result.get("retrieved_docs", [])
            }
        except Exception as e:
            print("Error invoking LangGraph pipeline:", e)

    # Executing RAG retrieval engine
    docs = vector_search(query)
    response = generate_rag_answer(query, docs)
    return {
        "response": response,
        "is_domain": True,
        "docs": docs
    }
