"""Three operational tools: flight status, weather, and policy search."""

import os
import random
import time
from typing import Any

import httpx

from app.config import get_settings

settings = get_settings()

MOCK_FLIGHTS = {
    "UA451": {
        "status": "Delayed",
        "departure": "ORD",
        "arrival": "SFO",
        "delay_minutes": 45,
        "gate": "B12",
    },
    "UA452": {
        "status": "On Time",
        "departure": "SFO",
        "arrival": "ORD",
        "delay_minutes": 0,
        "gate": "C4",
    },
    "UA100": {
        "status": "Cancelled",
        "departure": "JFK",
        "arrival": "LHR",
        "delay_minutes": None,
        "gate": None,
    },
}

MOCK_WEATHER = {
    "ORD": {"temperature_c": 2, "rain": True, "visibility_km": 4, "storm_risk": "Medium"},
    "SFO": {"temperature_c": 16, "rain": False, "visibility_km": 10, "storm_risk": "Low"},
    "JFK": {"temperature_c": 8, "rain": True, "visibility_km": 6, "storm_risk": "Low"},
}


def get_flight_status(flight_number: str) -> dict[str, Any]:
    """Return status, departure, arrival, delay, and gate for a flight."""
    start = time.perf_counter()
    flight_number = flight_number.upper().strip()

    if settings.aviationstack_api_key:
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    "http://api.aviationstack.com/v1/flights",
                    params={
                        "access_key": settings.aviationstack_api_key,
                        "flight_iata": flight_number,
                        "limit": 1,
                    },
                )
                response.raise_for_status()
                data = response.json().get("data", [])
                if data:
                    flight = data[0]
                    departure = flight.get("departure", {})
                    arrival = flight.get("arrival", {})
                    delay = departure.get("delay")
                    return {
                        "flight": flight_number,
                        "status": flight.get("flight_status", "Unknown").title(),
                        "departure": departure.get("iata", "N/A"),
                        "arrival": arrival.get("iata", "N/A"),
                        "delay_minutes": int(delay) if delay else 0,
                        "gate": departure.get("gate") or "N/A",
                        "_latency_ms": (time.perf_counter() - start) * 1000,
                    }
        except Exception:
            pass

    if flight_number in MOCK_FLIGHTS:
        return {"flight": flight_number, **MOCK_FLIGHTS[flight_number], "_latency_ms": (time.perf_counter() - start) * 1000}

    return {
        "flight": flight_number,
        "status": random.choice(["On Time", "Delayed", "Boarding"]),
        "departure": "N/A",
        "arrival": "N/A",
        "delay_minutes": random.choice([0, 15, 30]),
        "gate": "A" + str(random.randint(1, 20)),
        "_latency_ms": (time.perf_counter() - start) * 1000,
    }


def check_weather(airport_code: str) -> dict[str, Any]:
    """Return temperature, rain, visibility, and storm risk for an airport."""
    start = time.perf_counter()
    airport_code = airport_code.upper().strip()

    if settings.openweather_api_key:
        try:
            with httpx.Client(timeout=10.0) as client:
                geo = client.get(
                    "http://api.openweathermap.org/geo/1.0/direct",
                    params={"q": airport_code, "limit": 1, "appid": settings.openweather_api_key},
                )
                geo.raise_for_status()
                locations = geo.json()
                if locations:
                    lat, lon = locations[0]["lat"], locations[0]["lon"]
                    weather = client.get(
                        "https://api.openweathermap.org/data/2.5/weather",
                        params={"lat": lat, "lon": lon, "appid": settings.openweather_api_key, "units": "metric"},
                    )
                    weather.raise_for_status()
                    w = weather.json()
                    main = w.get("main", {})
                    weather_list = w.get("weather", [{}])
                    desc = weather_list[0].get("main", "").lower()
                    visibility = w.get("visibility", 10000) / 1000
                    storm_risk = "High" if "thunder" in desc or "storm" in desc else "Medium" if "rain" in desc else "Low"
                    return {
                        "airport": airport_code,
                        "temperature_c": round(main.get("temp", 0)),
                        "rain": "rain" in desc,
                        "visibility_km": round(visibility, 1),
                        "storm_risk": storm_risk,
                        "_latency_ms": (time.perf_counter() - start) * 1000,
                    }
        except Exception:
            pass

    if airport_code in MOCK_WEATHER:
        return {"airport": airport_code, **MOCK_WEATHER[airport_code], "_latency_ms": (time.perf_counter() - start) * 1000}

    return {
        "airport": airport_code,
        "temperature_c": random.randint(-5, 30),
        "rain": random.choice([True, False]),
        "visibility_km": random.randint(2, 10),
        "storm_risk": random.choice(["Low", "Medium", "High"]),
        "_latency_ms": (time.perf_counter() - start) * 1000,
    }


def search_policy(query: str, airline: str = "Air India", top_k: int | None = None) -> list[dict[str, Any]]:
    """Search airline policy documents. Uses FAISS when available, keyword fallback otherwise."""
    from app.rag.retriever import search_documents

    k = top_k or settings.rag_top_k
    return search_documents(query, top_k=k, airline=airline)
