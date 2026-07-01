"""
Keyword-based agent fallback when no Gemini API key is configured.
Preserves the routing logic from the original prototype.
"""

import re

from app.services.tools import check_weather, get_flight_status, search_policy

FLIGHT_PATTERN = re.compile(r"\b([A-Z]{2}\d{2,4})\b")
AIRPORT_PATTERN = re.compile(r"\b([A-Z]{3})\b")
COMMON_WORDS = {"THE", "ARE", "FOR", "AND", "CAN", "NOT", "YOU", "WHY", "HOW", "ALL"}
WEATHER_KEYWORDS = {"weather", "rain", "storm", "delay", "delayed", "visibility", "snow"}
POLICY_KEYWORDS = {
    "policy", "bag", "baggage", "refund", "cancel", "cancellation", "rebook", 
    "compensation", "carry", "schedule", "change", "delay", "delayed", 
    "unplanned", "short-term", "luggage", "ticket", "allowance"
}


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
    citations = []

    if flight_match:
        flight_info = get_flight_status(flight_match.group(1))
        used_tools.append("get_flight_status")
        delay = flight_info.get("delay_minutes")
        delay_text = f", delayed {delay} minutes" if delay else ""
        parts.append(
            f"Flight {flight_info['flight']} is currently {flight_info['status']} "
            f"(departure {flight_info['departure']}, arrival {flight_info['arrival']}, "
            f"gate {flight_info.get('gate', 'N/A')}{delay_text})."
        )

        if any(word in q_lower for word in WEATHER_KEYWORDS) and flight_info["departure"] != "N/A":
            weather_info = check_weather(flight_info["departure"])
            used_tools.append("check_weather")
            parts.append(
                f"Weather at {weather_info['airport']}: {weather_info['temperature_c']}°C, "
                f"{'rain' if weather_info['rain'] else 'no rain'}, "
                f"visibility {weather_info['visibility_km']}km, storm risk {weather_info['storm_risk']}."
            )

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

    airline = "Air India"

    # Route to policy search if keyword matches OR if no other tools have matched yet
    if any(word in q_lower for word in POLICY_KEYWORDS) or not parts:
        results = search_policy(question, airline=airline)
        if results:
            used_tools.append("search_policy")
            for doc in results:
                cite = doc.get("citation", {})
                cite_str = ""
                if cite:
                    cite_str = f" (Source: {cite.get('document', 'Policy')}, p.{cite.get('page', 'N/A')})"
                parts.append(f"[{doc['title']}]{cite_str} {doc['text']}")
                if cite:
                    citations.append(cite)

    if not parts:
        parts.append(
            "I couldn't tell which tool to use. Try asking about a flight number "
            "(e.g. AI101), an airport's weather, or an airline policy."
        )

    return {"answer": " ".join(parts), "tools_used": used_tools, "citations": citations}
