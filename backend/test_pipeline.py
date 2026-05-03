"""
test_pipeline.py
-----------------
End-to-end test of the full project alert pipeline.
Uses the real _send_email_sendgrid and _send_sms_twilio functions from send_alert.py.
"""

import os, sys
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, ".")
from agent.tools.send_alert import _send_email_sendgrid, _send_sms_twilio

SEP = "=" * 60

print(SEP)
print("FULL PROJECT ALERT PIPELINE TEST")
print(SEP)

from_email = os.getenv("SENDGRID_FROM_EMAIL", "")
to_email   = os.getenv("DEFAULT_USER_EMAIL", "ishwarambare@gmail.com")
phone      = os.getenv("DEFAULT_USER_PHONE", "")

print(f"  FROM  : {from_email}")
print(f"  TO    : {to_email}")
print(f"  PHONE : {phone}")
print(SEP)

# ── Email via send_alert._send_email_sendgrid ─────────────────────────────────
html_body = """
<div style="font-family:Arial;max-width:600px;margin:0 auto">
  <div style="background:#dc2626;color:white;padding:16px;border-radius:8px 8px 0 0">
    <h1 style="margin:0">&#9888;&#65039; Portfolio Risk Alert &mdash; HIGH</h1>
    <p style="margin:4px 0 0">2026-05-03 04:45 UTC</p>
  </div>
  <div style="border:1px solid #e5e7eb;padding:20px;border-radius:0 0 8px 8px">
    <h2>Risk Score: 82%</h2>
    <p><strong>Portfolio:</strong> AAPL, TSLA, NVDA</p>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f3f4f6">
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Metric</th>
        <th style="padding:8px;border:1px solid #e5e7eb;text-align:right">Value</th>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb">Sharpe Ratio</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">-0.43</td>
      </tr>
      <tr style="background:#f9fafb">
        <td style="padding:8px;border:1px solid #e5e7eb">Annual Volatility</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">38.2%</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #e5e7eb">Max Drawdown</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">-24.1%</td>
      </tr>
    </table>
    <p style="color:#16a34a;margin-top:16px">
      Sent from <strong>noreply@ishwarambare.online</strong> via SendGrid Domain Auth
    </p>
  </div>
</div>
"""

ok, msg = _send_email_sendgrid(
    to_email=to_email,
    subject="[PROJECT TEST] Portfolio Risk Alert [HIGH] - Score: 82%",
    html_body=html_body,
)
status = "SUCCESS" if ok else "FAILED"
print(f"\nEmail  --> {status}: {msg}")

# ── SMS via send_alert._send_sms_twilio ───────────────────────────────────────
sms_body = (
    "PORTFOLIO ALERT [HIGH]\n"
    "Risk Score: 82%\n"
    "Portfolio: AAPL, TSLA, NVDA\n"
    "Sharpe: -0.43 | Vol: 38.2%\n"
    "Review your dashboard immediately."
)

ok2, msg2 = _send_sms_twilio(to_number=phone, body=sms_body)
status2 = "SUCCESS" if ok2 else "FAILED"
print(f"SMS    --> {status2}: {msg2}")

print(SEP)
