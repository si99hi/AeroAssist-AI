"""
MCP server exposing AeroAssist operational tools.
Run standalone: python -m app.mcp.server
"""

from mcp.server.fastmcp import FastMCP

from app.services import tools as tool_service

mcp = FastMCP("AeroAssist Tools")


@mcp.tool()
def get_flight_status(flight_number: str) -> dict:
    """Return flight status including departure, arrival, delay, and gate."""
    return tool_service.get_flight_status(flight_number)


@mcp.tool()
def check_weather(airport_code: str) -> dict:
    """Return weather at an airport: temperature, rain, visibility, storm risk."""
    return tool_service.check_weather(airport_code)


@mcp.tool()
def search_policy(query: str) -> list:
    """Search airline policy knowledge base for relevant document chunks."""
    return tool_service.search_policy(query)


if __name__ == "__main__":
    mcp.run()
