import os
import sys
from dotenv import load_dotenv

# Fix Windows terminal Unicode issues (emojis, special chars)
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

# Load environment variables from .env file — MUST run before any imports that read env vars
load_dotenv()

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


# ── Config ────────────────────────────────────────────────────────────────────
TO_EMAIL   = os.environ.get("DEFAULT_USER_EMAIL", "ishwarambare@gmail.com")
FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL", "ishwarambare@gmail.com")
API_KEY    = os.environ.get("SENDGRID_API_KEY", "")


def test_sendgrid_raw():
    """
    Raw SendGrid SDK test — mirrors the official quickstart snippet exactly.
    Prints status_code, body, and headers so you can debug any error precisely.
    """
    print("=" * 60)
    print("RAW SENDGRID TEST")
    print(f"  API Key  : {API_KEY[:20]}..." if API_KEY else "  API Key  : *** MISSING ***")
    print(f"  To       : {TO_EMAIL}")
    print("=" * 60)

    if not API_KEY:
        print("[ERROR] SENDGRID_API_KEY is not set in .env")
        return

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=["ishwarambare@gmail.com", "ishuambare@gmail.com"],
        subject="🚨 Portfolio Alert Test — Raw SendGrid SDK",
        html_content=(
            "<h2>Test Email from Portfolio Agent</h2>"
            "<p>This is a <strong>raw SendGrid SDK test</strong> to verify "
            "sender identity and API key permissions are correctly configured.</p>"
            "<p>If you received this, email alerts are working! ✅</p>"
        ),
    )

    try:
        sg = SendGridAPIClient(API_KEY)
        # sg.set_sendgrid_data_residency("eu")  # uncomment for EU subuser
        response = sg.send(message)
        print("\n[SUCCESS]")
        print(f"  Status Code : {response.status_code}")
        print(f"  Body        : {response.body}")
        print(f"  X-Message-Id: {response.headers.get('X-Message-Id', 'N/A')}")

    except Exception as e:
        print(f"Reason: {e.reason}")


def test_twilio_sms():
    """Test Twilio SMS sending."""
    from twilio.rest import Client as TwilioClient

    sid        = os.environ.get("TWILIO_ACCOUNT_SID", "")
    token      = os.environ.get("TWILIO_AUTH_TOKEN", "")
    from_num   = os.environ.get("TWILIO_FROM_NUMBER", "")
    to_num     = os.environ.get("DEFAULT_USER_PHONE", "+919096827781")

    print("\n" + "=" * 60)
    print("TWILIO SMS TEST")
    print(f"  From : {from_num}")
    print(f"  To   : {to_num}")
    print("=" * 60)

    if not all([sid, token, from_num]):
        print("[ERROR] Twilio credentials missing in .env")
        return

    try:
        client = TwilioClient(sid, token)
        msg = client.messages.create(
            body="Portfolio Agent Test SMS — Twilio is working",
            from_=from_num,
            to=to_num,
        )
        print(f"\n[SUCCESS] SID: {msg.sid}")
    except Exception as e:
        print(f"\n[FAILED] {e}")


if __name__ == "__main__":
    test_sendgrid_raw()
    # test_twilio_sms()



# import mailtrap as mt

# mail = mt.Mail(
#     sender=mt.Address(email="hello@demomailtrap.co", name="Mailtrap Test"),
#     to=[mt.Address(email="ishwarambare@gmail.com")],
#     subject="You are awesome!",
#     text="Congrats for sending test email with Mailtrap!",
#     category="Integration Test",
# )

# client = mt.MailtrapClient(token="SK9MwXVQd2Lllf4dookulVLP1NTQR6DEI")
# response = client.send(mail)

# print(response)