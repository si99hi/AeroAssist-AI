"""Tests for tools and agent routing."""

import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ["DATABASE_URL"] = "sqlite:///aeroassist.db"

from app.agents.fallback_agent import answer_question, find_airport_code
from app.services.tools import check_weather, get_flight_status, search_policy


def test_get_flight_status_known_flight():
    result = get_flight_status("ai101")
    assert result["flight"] == "AI101"
    assert "status" in result


def test_get_flight_status_unknown_flight_does_not_crash():
    result = get_flight_status("XX999")
    assert result["flight"] == "XX999"
    assert "status" in result


def test_check_weather_known_airport():
    result = check_weather("del")
    assert result["airport"] == "DEL"
    assert result["rain"] is False


def test_search_policy_finds_baggage_doc():
    results = search_policy("Can I carry pets in cabin on Air India?")
    assert len(results) > 0
    assert any("pet" in doc["text"].lower() or "pet" in doc["title"].lower() for doc in results)


def test_search_policy_no_match_does_not_crash():
    results = search_policy("asdfghjkl zzzqqq")
    assert len(results) > 0


def test_find_airport_code_skips_common_words():
    assert find_airport_code("WHAT IS THE WEATHER AT DEL") == "DEL"


def test_answer_question_routes_to_flight_and_weather():
    result = answer_question("Why is AI101 delayed?")
    assert "get_flight_status" in result["tools_used"]
    assert "check_weather" in result["tools_used"]


def test_answer_question_routes_to_policy_only():
    result = answer_question("Can I carry pets in cabin on Air India?")
    assert result["tools_used"] == ["search_policy"]


def test_answer_question_handles_no_match():
    result = answer_question("hello there")
    assert result["tools_used"] == []
    assert "couldn't tell" in result["answer"].lower()


if __name__ == "__main__":
    tests = [obj for name, obj in list(globals().items()) if name.startswith("test_")]
    passed, failed = 0, 0
    for test in tests:
        try:
            test()
            print(f"PASS: {test.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"FAIL: {test.__name__} — {e}")
            failed += 1
        except Exception as e:
            print(f"FAIL: {test.__name__} (Error) — {e}")
            failed += 1
    print(f"\n{passed} passed, {failed} failed")
