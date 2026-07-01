"""
Three simple tools the assistant can call. No external APIs, no ML libraries.
Flight and weather data are mocked so you can run this offline. Swap the mock
data for real API calls (AviationStack, OpenWeather) once this works end to end.
"""

import random

# ---------------------------------------------------------------------------
# Tool 1: Flight status
# ---------------------------------------------------------------------------

MOCK_FLIGHTS = {
    "UA451": {"status": "Delayed", "departure": "ORD", "arrival": "SFO", "delay_minutes": 45, "gate": "B12"},
    "UA452": {"status": "On Time", "departure": "SFO", "arrival": "ORD", "delay_minutes": 0, "gate": "C4"},
    "UA100": {"status": "Cancelled", "departure": "JFK", "arrival": "LHR", "delay_minutes": None, "gate": None},
}


def get_flight_status(flight_number: str) -> dict:
    flight_number = flight_number.upper().strip()
    if flight_number in MOCK_FLIGHTS:
        return {"flight": flight_number, **MOCK_FLIGHTS[flight_number]}
    # Unknown flight: generate a plausible-looking mock response instead of failing
    return {
        "flight": flight_number,
        "status": random.choice(["On Time", "Delayed", "Boarding"]),
        "departure": "N/A",
        "arrival": "N/A",
        "delay_minutes": random.choice([0, 15, 30]),
        "gate": "A" + str(random.randint(1, 20)),
    }


# ---------------------------------------------------------------------------
# Tool 2: Weather
# ---------------------------------------------------------------------------

MOCK_WEATHER = {
    "ORD": {"temperature_c": 2, "rain": True, "visibility_km": 4, "storm_risk": "Medium"},
    "SFO": {"temperature_c": 16, "rain": False, "visibility_km": 10, "storm_risk": "Low"},
    "JFK": {"temperature_c": 8, "rain": True, "visibility_km": 6, "storm_risk": "Low"},
}


def check_weather(airport_code: str) -> dict:
    airport_code = airport_code.upper().strip()
    if airport_code in MOCK_WEATHER:
        return {"airport": airport_code, **MOCK_WEATHER[airport_code]}
    return {
        "airport": airport_code,
        "temperature_c": random.randint(-5, 30),
        "rain": random.choice([True, False]),
        "visibility_km": random.randint(2, 10),
        "storm_risk": random.choice(["Low", "Medium", "High"]),
    }


# ---------------------------------------------------------------------------
# Tool 3: Policy search (simple keyword matching, no embeddings/vector DB yet)
# ---------------------------------------------------------------------------

POLICY_DOCS = [
    {
        "id": 1,
        "title": "Baggage Policy",
        "text": "Passengers may carry one personal item and one carry-on bag free of charge. "
                "Checked bags over 23kg incur an overweight fee. Two checked bags are allowed "
                "in economy for an additional fee per bag.",
    },
    {
        "id": 2,
        "title": "Cancellation & Rebooking",
        "text": "If your flight is cancelled by the airline, you may rebook on the next available "
                "flight at no extra cost, or request a full refund. Rebooking after a voluntary "
                "cancellation may incur a change fee depending on fare type.",
    },
    {
        "id": 3,
        "title": "Delay Compensation",
        "text": "Passengers delayed more than 3 hours due to circumstances within the airline's "
                "control may be eligible for meal vouchers and, in some cases, hotel accommodation.",
    },
]


def search_policy(query: str, top_k: int = 1) -> list[dict]:
    """
    Very simple keyword-overlap search: counts how many query words appear in
    each document and returns the best matches. This is a stand-in for a real
    embedding + FAISS retriever, which you can add later without changing the
    function's interface.
    """
    query_words = set(query.lower().split())
    scored = []
    for doc in POLICY_DOCS:
        doc_words = set(doc["text"].lower().split())
        overlap = len(query_words & doc_words)
        if overlap > 0:
            scored.append((overlap, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [doc for _, doc in scored[:top_k]]
    if not results:
        results = [{"id": None, "title": "No match", "text": "No relevant policy found."}]
    return results
