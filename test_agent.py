"""
Simple tests, no pytest fixtures or mocking needed since everything is
plain functions with mock data. Run with:

    python -m pytest test_agent.py

or just:

    python test_agent.py
"""

from tools import get_flight_status, check_weather, search_policy
from agent import answer_question, find_airport_code


def test_get_flight_status_known_flight():
    result = get_flight_status("ua451")  # lowercase on purpose, should be normalized
    assert result["flight"] == "UA451"
    assert result["status"] == "Delayed"


def test_get_flight_status_unknown_flight_does_not_crash():
    result = get_flight_status("XX999")
    assert result["flight"] == "XX999"
    assert "status" in result


def test_check_weather_known_airport():
    result = check_weather("ord")
    assert result["airport"] == "ORD"
    assert result["rain"] is True


def test_search_policy_finds_baggage_doc():
    results = search_policy("Can I carry two bags?")
    assert results[0]["title"] == "Baggage Policy"


def test_search_policy_no_match_does_not_crash():
    results = search_policy("asdfghjkl")
    assert results[0]["title"] == "No match"


def test_find_airport_code_skips_common_words():
    # "THE" should be skipped in favor of the real airport code "SFO"
    assert find_airport_code("WHAT IS THE WEATHER AT SFO") == "SFO"


def test_answer_question_routes_to_flight_and_weather():
    result = answer_question("Why is UA451 delayed?")
    assert "get_flight_status" in result["tools_used"]
    assert "check_weather" in result["tools_used"]


def test_answer_question_routes_to_policy_only():
    result = answer_question("Can I carry two bags?")
    assert result["tools_used"] == ["search_policy"]


def test_answer_question_handles_no_match():
    result = answer_question("hello there")
    assert result["tools_used"] == []
    assert "couldn't tell" in result["answer"].lower()


if __name__ == "__main__":
    # Allow running without pytest installed: just call every test function.
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
    print(f"\n{passed} passed, {failed} failed")
