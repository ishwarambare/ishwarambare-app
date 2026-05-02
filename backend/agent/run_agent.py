"""
agent/run_agent.py
-------------------
Standalone script to run the portfolio agent and print every reasoning step.
Run from the backend/ directory:

    cd backend
    python -m agent.run_agent

No API keys required — runs in mock mode automatically.
"""

import asyncio
import sys
import os

# Make sure backend/ is on the path when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agent.graph import portfolio_agent, make_initial_state


# ── Sample portfolios ─────────────────────────────────────────────────────────
PORTFOLIOS = {
    "conservative": {
        "SPY": 0.50,   # S&P 500 ETF
        "BND": 0.30,   # Bond ETF
        "GLD": 0.20,   # Gold ETF
    },
    "aggressive": {
        "AAPL": 0.30,
        "MSFT": 0.25,
        "NVDA": 0.25,
        "TSLA": 0.20,
    },
    "balanced": {
        "AAPL": 0.20,
        "MSFT": 0.20,
        "SPY":  0.30,
        "BND":  0.20,
        "GLD":  0.10,
    },
}


async def run(portfolio_name: str = "aggressive") -> None:
    portfolio = PORTFOLIOS.get(portfolio_name, PORTFOLIOS["aggressive"])
    print(f"\n{'═' * 60}")
    print(f"  💼 Portfolio Agent — Running '{portfolio_name}' portfolio")
    print(f"  Holdings: {portfolio}")
    print(f"{'═' * 60}\n")

    initial_state = make_initial_state(
        portfolio=portfolio,
        user_email="",     # leave empty for mock alert
        user_phone="",
    )

    # astream() yields {node_name: partial_state_update} after each node runs
    step_count = 0
    async for event in portfolio_agent.astream(initial_state):
        for node_name, state_update in event.items():
            step_count += 1
            print(f"\n[Step {step_count}] Node: {node_name.upper()}")
            print("─" * 50)

            # Print new reasoning steps added by this node
            new_steps = state_update.get("reasoning_steps", [])
            for line in new_steps:
                print(f"  {line}")

            # Print any errors
            for err in state_update.get("errors", []):
                print(f"  ❌ ERROR: {err}", file=sys.stderr)

            # Print risk result summary when available
            if "risk_score" in state_update:
                print(f"\n  ┌──────────────────────────────────────")
                print(f"  │  RISK SCORE  : {state_update['risk_score']:.3f}")
                print(f"  │  RISK LEVEL  : {state_update.get('risk_level', '—')}")
                print(f"  │  ALERT?      : {state_update.get('should_alert', False)}")
                print(f"  └──────────────────────────────────────")

    print(f"\n{'═' * 60}")
    print(f"  Agent run complete — {step_count} nodes executed")
    print(f"{'═' * 60}\n")


if __name__ == "__main__":
    # Pass portfolio name as CLI arg: python -m agent.run_agent conservative
    name = sys.argv[1] if len(sys.argv) > 1 else "aggressive"
    asyncio.run(run(name))
