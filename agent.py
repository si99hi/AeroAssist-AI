"""
A deliberately simple "agent": it looks at keywords in the question and
decides which tool(s) to call. This replaces LangGraph for now. The function
signature (question in, answer out) stays the same, so you can swap the body
for a real LLM-based router later without touching main.py.
"""

import re
from tools import get_flight_status, check_weather, search_policy

FLIGHT_PATTERN = re.compile(r"\b([A-Z]{2}\d{2,4})\b")
AIRPORT_PATTERN = re.compile(r"\b([A-Z]{3})\b")

# Common 3-letter English words that would otherwise be mistaken for airport codes
# (e.g. "THE", "ARE") once the question is upper-cased for matching.
COMMON_WORDS = {"THE", "ARE", "FOR", "AND", "CAN", "NOT", "YOU", "WHY", "HOW", "ALL"}

WEATHER_KEYWORDS = {"weather", "rain", "storm", "delay", "delayed", "visibility", "snow"}
POLICY_KEYWORDS = {"policy", "bag", "baggage", "refund", "cancel", "cancellation", "rebook", "compensation"}


def find_airport_code(text_upper: str) -> str | None:
    for match in AIRPORT_PATTERN.finditer(text_upper):
        code = match.group(1)
        if code not in COMMON_WORDS:
            return code
    return None


def answer_question(question: str) -> dict:
    q_upper = question.upper()
    q_lower = question.lower()

    flight_match = FLIGHT_PATTERN.search(q_upper)
    used_tools = []
    parts = []

    # Flight status: only call if a flight-number-shaped token is present
    if flight_match:
        flight_info = get_flight_status(flight_match.group(1))
        used_tools.append("get_flight_status")
        parts.append(
            f"Flight {flight_info['flight']} is currently {flight_info['status']} "
            f"(departure {flight_info['departure']}, arrival {flight_info['arrival']}, "
            f"gate {flight_info['gate']})."
        )

        # If the question also mentions weather-ish words, check weather at the departure airport
        if any(word in q_lower for word in WEATHER_KEYWORDS) and flight_info["departure"] != "N/A":
            weather_info = check_weather(flight_info["departure"])
            used_tools.append("check_weather")
            parts.append(
                f"Weather at {weather_info['airport']}: {weather_info['temperature_c']}°C, "
                f"{'rain' if weather_info['rain'] else 'no rain'}, "
                f"visibility {weather_info['visibility_km']}km, storm risk {weather_info['storm_risk']}."
            )

    # Standalone weather question with an airport code, no flight number
    elif any(word in q_lower for word in WEATHER_KEYWORDS):
        airport_code = find_airport_code(q_upper)
        if airport_code:
            weather_info = check_weather(airport_code)
            used_tools.append("check_weather")
            parts.append(
                f"Weather at {weather_info['airport']}: {weather_info['temperature_c']}°C, "
                f"{'rain' if weather_info['rain'] else 'no rain'}, "
                f"visibility {weather_info['visibility_km']}km, storm risk {weather_info['storm_risk']}."
            )

    # Policy question
    if any(word in q_lower for word in POLICY_KEYWORDS):
        results = search_policy(question)
        used_tools.append("search_policy")
        for doc in results:
            parts.append(f"[{doc['title']}] {doc['text']}")

    if not parts:
        parts.append(
            "I couldn't tell which tool to use. Try asking about a flight number "
            "(e.g. UA451), an airport's weather, or an airline policy."
        )

    return {"answer": " ".join(parts), "tools_used": used_tools}
