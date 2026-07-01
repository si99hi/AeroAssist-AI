"""
LangGraph agent that selects tools via Gemini when GEMINI_API_KEY is set.
Falls back to keyword routing otherwise.
"""

import json
import time
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from app.agents.fallback_agent import answer_question as fallback_answer
from app.config import get_settings
from app.services.tools import check_weather, get_flight_status, search_policy

settings = get_settings()

SYSTEM_PROMPT = """You are AeroAssist AI, an airline operations assistant for United Airlines.
You have three tools:
1. get_flight_status - for flight numbers like UA451
2. check_weather - for airport codes like ORD, SFO
3. search_policy - for baggage, cancellation, rebooking, compensation questions

Choose only the tools needed. For delay questions, check flight status AND weather at departure airport.
For policy questions, use search_policy only. Always cite policy sources when using search_policy.
Be concise and helpful."""


@tool
def get_flight_status_tool(flight_number: str) -> str:
    """Get status, departure, arrival, delay, and gate for a flight number like UA451."""
    result = get_flight_status(flight_number)
    return json.dumps(result)


@tool
def check_weather_tool(airport_code: str) -> str:
    """Get temperature, rain, visibility, and storm risk for an airport code like ORD or SFO."""
    result = check_weather(airport_code)
    return json.dumps(result)


@tool
def search_policy_tool(query: str) -> str:
    """Search United Airlines policy documents for baggage, cancellation, rebooking, compensation."""
    results = search_policy(query)
    return json.dumps(results)


TOOLS = [get_flight_status_tool, check_weather_tool, search_policy_tool]


def _extract_citations_from_tool_output(tool_name: str, output: str) -> list[dict]:
    if tool_name != "search_policy_tool":
        return []
    try:
        data = json.loads(output)
        if isinstance(data, list):
            return [item.get("citation", {}) for item in data if item.get("citation")]
    except json.JSONDecodeError:
        pass
    return []


def run_llm_agent(question: str) -> dict[str, Any]:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.gemini_api_key,
        temperature=0.2,
    )
    agent = create_react_agent(llm, TOOLS)

    start = time.perf_counter()
    result = agent.invoke({"messages": [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=question)]})
    latency = (time.perf_counter() - start) * 1000

    messages = result.get("messages", [])
    answer = ""
    tools_used: list[str] = []
    citations: list[dict] = []

    tool_name_map = {
        "get_flight_status_tool": "get_flight_status",
        "check_weather_tool": "check_weather",
        "search_policy_tool": "search_policy",
    }

    for msg in messages:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                name = tool_name_map.get(tc.get("name", ""), tc.get("name", ""))
                if name and name not in tools_used:
                    tools_used.append(name)
        if hasattr(msg, "name") and msg.name:
            name = tool_name_map.get(msg.name, msg.name.replace("_tool", ""))
            citations.extend(_extract_citations_from_tool_output(msg.name, msg.content or ""))
        if msg.type == "ai" and msg.content and not getattr(msg, "tool_calls", None):
            answer = msg.content

    if not answer and messages:
        last = messages[-1]
        answer = last.content if hasattr(last, "content") else str(last)

    return {
        "answer": answer,
        "tools_used": tools_used,
        "citations": citations,
        "latency_ms": latency,
        "tokens": 0,
    }


def answer_question(question: str) -> dict[str, Any]:
    if settings.use_llm_agent:
        try:
            return run_llm_agent(question)
        except Exception:
            pass
    result = fallback_answer(question)
    result.setdefault("citations", [])
    result.setdefault("latency_ms", 0)
    result.setdefault("tokens", 0)
    return result
