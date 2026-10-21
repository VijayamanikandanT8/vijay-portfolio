"""
Vijayamanikandan T. — portfolio backend.

A plain Flask JSON API. It knows nothing about React and serves no HTML or
static assets -- the frontend/ project (Vite + React) is a fully separate
app that fetches from here. In dev, Vite's proxy (frontend/vite.config.ts)
forwards /api requests to this server; CORS is enabled below as well, for
when the two are run against each other directly (no proxy) or deployed
to different hosts.

Run:
    pip install -r requirements.txt
    python app.py
Then start the frontend separately:
    cd ../frontend && npm install && npm run dev
"""

import html
import json
import os
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formataddr, parseaddr
from urllib.parse import quote

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

load_dotenv()

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
app = Flask(__name__, static_folder=None)
CORS(app)  # allow the frontend (different origin/port) to fetch this API

# ---------------------------------------------------------------------------
# Site content -- the single source of truth. Edit this and refresh the
# frontend; no frontend rebuild needed, since React fetches it at runtime.
# ---------------------------------------------------------------------------
SITE = {
    "siteName": "Vijayamanikandan T.",
    "name": "Vijayamanikandan T.",
    "nickname": "VIJAY",
    "heroTag": "Python Fullstack Developer | Django | FastAPI | AI/ML",
    "heroDescription": (
        "I build complete web apps, REST APIs, responsive frontends, "
        "and AI/ML pipelines."
    ),
    "subhead": (
        "A certified Python Fullstack Developer building production-ready "
        "web apps, REST APIs, and AI-powered tools \u2014 end to end, from "
        "Django and FastAPI to Pandas and Scikit-learn."
    ),
    "email": "tvijayamanikandan08@gmail.com",
    "location": "Theni, Tamil Nadu, India",
    "availability": "Available for hire",
    "heroWave": "\U0001F44B",
    "heroIntroLabel": "Hello, I'm",
    "roleHighlight": "AI/ML",
    "roleSuffix": "Engineer",
    "badgeStackLine": "Python \u2022 Web \u2022 AI/ML",
    "badgeRoleLine": "Fullstack Developer",
    "buildingNote": "Building the future",
    "taglineSmall": "LET'S BUILD SOMETHING",
    "taglineBig": "GREAT TOGETHER",
}

TECH_STACK = [
    {"label": "Python", "icon": "python"},
    {"label": "Django", "icon": "django"},
    {"label": "AI/ML", "icon": "ai"},
    {"label": "SQL", "icon": "postgres"},
    {"label": "Data Analysis", "icon": "data"},
    {"label": "FastAPI", "icon": "fastapi"},
]

NAVBAR = {
    "logoLeft": "[",
    "logoText": "VM",
    "logoRight": "]",
    "links": [
        {"label": "Home", "href": "#home"},
        {"label": "About", "href": "#about"},
        {"label": "Skills", "href": "#skills"},
        {"label": "Projects", "href": "#projects"},
        {"label": "Experience", "href": "#experience"},
        {"label": "Contact", "href": "#contact"},
    ],
    "statusText": "Available for hire",
}

FLOATING_CARDS = [
    "PYTHON \u2022 WEB \u2022 AI/ML",
    "FULLSTACK DEVELOPER",
    "BUILDING THE FUTURE",
    "AI / AUTOMATION",
]

BOOT_LINES = [
    "SYSTEM INITIALIZED",
    "VISUAL ENGINE READY",
    "IDENTITY LOADED",
    "PORTFOLIO READY",
]

# Edit this freely -- no photo is used, so wording carries the section.
ABOUT = {
    "eyebrow": "About Me",
    "headingLead": "Turning ideas into",
    "headingHighlight": "scalable software",
    "paragraphs": [
        "I'm Vijayamanikandan T., a Python fullstack developer who likes "
        "taking a project from a blank file to something people actually "
        "use. My time splits between backend APIs in Django and FastAPI, "
        "mobile apps in Flutter, and AI/ML pipelines that turn raw data "
        "into something useful.",
        "Outside client work, I build the unglamorous tools that save "
        "people hours -- PDF and Word automation, adaptive e-learning "
        "systems, and teaching material for AI/ML classes. I'd rather "
        "ship something small and working than something big and stuck "
        "in planning.",
    ],
    "highlights": [
        {"icon": "target", "label": "Certified Python Fullstack Developer"},
        {"icon": "layers", "label": "Django & FastAPI REST APIs"},
        {"icon": "sparkle", "label": "AI/ML pipelines with Scikit-learn"},
        {"icon": "code", "label": "Responsive React & Flutter builds"},
    ],
    "stats": [
        {"value": 3, "suffix": "+", "label": "Years writing production code"},
        {"value": 20, "suffix": "+", "label": "Projects shipped"},
        {"value": 6, "suffix": "+", "label": "Core technologies"},
        {"value": 100, "suffix": "%", "label": "Remote-friendly"},
    ],
    "monogram": "VM",
    "orbitLabels": ["python", "django", "fastapi", "react", "ai"],
    "quote": "Ship small, ship working, then make it better.",
}


@app.route("/api/site")
def api_site():
    """Everything the React app needs to render -- fetched once on load."""
    return jsonify(
        {
            "site": SITE,
            "techStack": TECH_STACK,
            "navbar": NAVBAR,
            "floatingCards": FLOATING_CARDS,
            "bootLines": BOOT_LINES,
            "about": ABOUT,
        }
    )


# ---------------------------------------------------------------------------
# contact form -> email (smtp)
# ---------------------------------------------------------------------------
brevo_key = os.getenv("BREVO_API_KEY", "").strip()
smtp_user = os.getenv("MAIL_FROM", "").strip()  # sender address verified in Brevo
mail_to = os.getenv("MAIL_TO", "").strip() or smtp_user
auto_reply = os.getenv("AUTO_REPLY", "true").strip().lower() == "true"
ist = timezone(timedelta(hours=5, minutes=30))

_hits = defaultdict(list)  # ip -> timestamps (simple in-memory rate limit)

type_meta = {
    "message": ("New message", "&#9993;", "#2563eb"),
    "call": ("Call request", "&#128222;", "#ea580c"),
    "project": ("Project brief", "&#128640;", "#7c3aed"),
}
_tint = {"message": "#eaf1ff", "call": "#fff1e6", "project": "#f1eafe"}
_SERIF = "Georgia,'Times New Roman',Times,serif"
_SANS = "'Segoe UI',Helvetica,Arial,sans-serif"
_WA = "https://wa.me/919789124264"


def _clean(value, limit=200):
    """single-line, trimmed text (also blocks email-header injection)."""
    return " ".join(str(value or "").split())[:limit]


def _esc(value):
    return html.escape(str(value or ""), quote=True)


def _rate_limited(ip, max_hits=5, window=600):
    now = time.time()
    _hits[ip] = [t for t in _hits[ip] if now - t < window]
    if len(_hits[ip]) >= max_hits:
        return True
    _hits[ip].append(now)
    return False


def _send(msg):
    """Send via Brevo's HTTPS API (Render free blocks SMTP ports)."""
    from_name, _ = parseaddr(msg["from"])
    to_name, to_addr = parseaddr(msg["to"])
    payload = {
        "sender": {"name": from_name or "Portfolio", "email": smtp_user},
        "to": [{"email": to_addr, **({"name": to_name} if to_name else {})}],
        "subject": str(msg["subject"]),
    }
    if msg["reply-to"]:
        rt_name, rt_addr = parseaddr(msg["reply-to"])
        payload["replyTo"] = {"email": rt_addr, **({"name": rt_name} if rt_name else {})}
    text_part = msg.get_body(preferencelist=("plain",))
    html_part = msg.get_body(preferencelist=("html",))
    if text_part is not None:
        payload["textContent"] = text_part.get_content()
    if html_part is not None:
        payload["htmlContent"] = html_part.get_content()

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": brevo_key,
            "user-agent": "portfolio-flask/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            resp.read()
    except urllib.error.HTTPError as err:
        raise RuntimeError(f"Brevo {err.code}: {err.read().decode('utf-8', 'replace')}") from err


def _row(label, value_html):
    return (
        "<tr>"
        f'<td width="120" valign="top" style="padding:13px 0;border-bottom:1px solid #eef0f5;font-family:{_SANS};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#94a3b8;">{label}</td>'
        f'<td valign="top" style="padding:13px 0;border-bottom:1px solid #eef0f5;font-family:{_SANS};font-size:15px;font-weight:600;color:#0f172a;">{value_html}</td>'
        "</tr>"
    )


def _btn(href, label, bg, fg, border=None):
    b = f"border:1.5px solid {border};" if border else ""
    return (
        f'<span style="display:inline-block;margin:0 10px 10px 0;">'
        f'<a href="{href}" style="display:inline-block;padding:13px 26px;border-radius:999px;background:{bg};{b}color:{fg};'
        f'font-family:{_SANS};font-size:14px;font-weight:700;text-decoration:none;letter-spacing:.2px;">{label}</a></span>'
    )


def _letterhead(right_label):
    return (
        '<tr><td style="padding:30px 44px 0 44px;">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
        '<td width="52" valign="middle"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'
        f'<td width="48" height="48" align="center" valign="middle" bgcolor="#0f172a" style="width:48px;height:48px;border-radius:24px;background:#0f172a;font-family:{_SERIF};font-size:18px;font-weight:700;color:#ffffff;letter-spacing:1px;">VM</td>'
        "</tr></table></td>"
        '<td valign="middle" style="padding-left:14px;">'
        f'<div style="font-family:{_SERIF};font-size:18px;font-weight:700;color:#0f172a;">Vijayamanikandan T.</div>'
        f'<div style="font-family:{_SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin-top:3px;">Python Fullstack &middot; AI/ML</div></td>'
        f'<td align="right" valign="middle" style="font-family:{_SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">{right_label}</td>'
        "</tr></table>"
        '<div style="height:1px;line-height:1px;font-size:1px;background:#e5e7eb;margin-top:26px;">&nbsp;</div>'
        "</td></tr>"
    )


def _shell(inner, footer_html, width=640):
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#eef1f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eef1f7" style="background:#eef1f7;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="{width}" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:{width}px;width:100%;background:#ffffff;border-radius:18px;border:1px solid #e3e7f0;font-family:{_SANS};">
<tr><td height="6" bgcolor="#6366f1" style="height:6px;line-height:6px;font-size:6px;border-radius:18px 18px 0 0;background-color:#6366f1;background-image:linear-gradient(90deg,#22d3ee,#6366f1 50%,#ec4899);">&nbsp;</td></tr>
{inner}
</table>
<div style="max-width:{width}px;font-family:{_SANS};font-size:12px;line-height:1.7;color:#8a94a8;text-align:center;padding:18px 12px 0;">{footer_html}</div>
</td></tr></table>
</body></html>"""


def owner_email_html(d, received):
    title, icon, accent = type_meta[d["type"]]
    tint = _tint[d["type"]]
    name = _esc(d["name"])
    first = _esc(d["name"].split(" ")[0])
    email = _esc(d["email"])
    re_subj = quote("Re: " + d["subject"])
    mailto = f"mailto:{quote(d['email'], safe='@')}?subject={re_subj}"
    gmail = f"https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to={quote(d['email'], safe='@')}&amp;su={re_subj}"

    headline = {
        "message": f"{first} sent you a message",
        "call": f"{first} wants to book a call",
        "project": f"{first} sent a project brief",
    }[d["type"]]

    rows = [
        _row("Name", name),
        _row("Email", f'<a href="mailto:{email}" style="color:{accent};text-decoration:none;">{email}</a>'),
    ]
    if d["type"] == "call":
        rows += [_row("When", _esc(d["slot"])), _row("Via", _esc(d["mode"]))]
    else:
        rows.append(_row("Topic", _esc(d["topic"])))
    if d["type"] == "project":
        rows += [_row("Budget", _esc(d["budget"])), _row("Timeline", _esc(d["timeline"]))]
        if d["features"]:
            chips = "".join(
                f'<span style="display:inline-block;margin:0 6px 6px 0;padding:5px 12px;border-radius:999px;background:{tint};color:{accent};font-size:12px;font-weight:600;">{_esc(f)}</span>'
                for f in d["features"]
            )
            rows.append(_row("Features", chips))
    rows.append(_row("Received", _esc(received)))

    msg_label = "Agenda" if d["type"] == "call" else "Message"
    msg_html = _esc(d["message"]).replace("\n", "<br>") or '<i style="color:#94a3b8;">(no message)</i>'

    inner = (
        _letterhead("Portfolio inbox")
        + f"""
<tr><td style="padding:30px 44px 6px 44px;">
  <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:{tint};color:{accent};font-family:{_SANS};font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">{icon}&nbsp; {title}</span>
  <div style="font-family:{_SERIF};font-size:29px;line-height:1.25;font-weight:700;color:#0f172a;margin-top:16px;">{headline}</div>
  <div style="font-family:{_SANS};font-size:13px;color:#94a3b8;margin-top:8px;">{_esc(received)}</div>
</td></tr>
<tr><td style="padding:14px 44px 0 44px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{''.join(rows)}</table>
</td></tr>
<tr><td style="padding:26px 44px 0 44px;">
  <div style="font-family:{_SANS};font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">{msg_label}</div>
  <div style="background:#f8fafc;border-left:4px solid {accent};border-radius:0 12px 12px 0;padding:20px 22px;font-family:{_SERIF};font-size:16px;line-height:1.8;color:#1e293b;">{msg_html}</div>
</td></tr>
<tr><td style="padding:30px 44px 36px 44px;">
  {_btn(mailto, "Reply to " + first + " &rarr;", "#0f172a", "#ffffff")}{_btn(gmail, "Open in Gmail", "#ffffff", "#0f172a", "#cbd5e1")}
</td></tr>"""
    )
    footer = "Sent from your portfolio contact form &middot; hit <b>Reply</b> to answer " + first + " directly"
    return _shell(inner, footer)


def owner_email_text(d, received):
    lines = [f"{type_meta[d['type']][0]} from {d['name']}", "", f"Email: {d['email']}"]
    if d["type"] == "call":
        lines += [f"When: {d['slot']}", f"Via: {d['mode']}"]
    else:
        lines.append(f"Topic: {d['topic']}")
    if d["type"] == "project":
        lines += [
            f"Budget: {d['budget']}",
            f"Timeline: {d['timeline']}",
            f"Features: {', '.join(d['features']) or 'not sure yet'}",
        ]
    lines += [f"Received: {received}", "", d["message"]]
    return "\n".join(lines)


def reply_email_html(d):
    kind = d["type"]
    _, _icon, accent = type_meta[kind]
    tint = _tint[kind]
    first = _esc(d["name"].split(" ")[0])
    now = datetime.now(ist)
    ref = now.strftime("VM-%y%m%d-%H%M")
    date_txt = now.strftime("%d %B %Y")
    my_email = SITE["email"]

    lead = {
        "message": "Thank you for reaching out. Your message has landed safely in my inbox, and I will read it carefully and reply personally, usually within 24 hours.",
        "call": f"Thank you for booking time with me. I have noted your request for <b>{_esc(d['slot'])}</b> and will confirm the slot by email shortly.",
        "project": "Thank you for sharing your project brief. I have received every detail and will review it carefully before replying with my thoughts, questions and a suggested way forward.",
    }[kind]

    steps = {
        "message": [
            ("I read your message", "Every enquiry is read by me personally."),
            ("You get a personal reply", "Usually within 24 hours."),
            ("We agree the next step", "A quick call, a plan, or a quote, whatever fits."),
        ],
        "call": [
            ("I confirm your time slot", "You will get a confirmation by email."),
            ("You receive the call details", "Meeting link or number, ahead of time."),
            ("We talk it through", "Relaxed, focused, and no pressure."),
        ],
        "project": [
            ("I review your brief", "Scope, features, budget and timeline."),
            ("I reply with questions and an approach", "A clear, practical suggested direction."),
            ("We align on scope and delivery", "Then we plan the build together."),
        ],
    }[kind]

    rows = []
    if kind == "call":
        rows += [_row("When", _esc(d["slot"])), _row("Via", _esc(d["mode"]))]
    else:
        rows.append(_row("Topic", _esc(d["topic"])))
    if kind == "project":
        rows += [_row("Budget", _esc(d["budget"])), _row("Timeline", _esc(d["timeline"]))]
        if d["features"]:
            rows.append(_row("Features", _esc(", ".join(d["features"]))))

    msg = " ".join(d["message"].split())
    quote_html = ""
    if msg:
        excerpt = _esc(msg[:260]) + ("&hellip;" if len(msg) > 260 else "")
        quote_html = (
            f'<div style="margin-top:16px;padding:16px 18px;background:#ffffff;border-left:4px solid {accent};border-radius:0 10px 10px 0;'
            f'font-family:{_SERIF};font-size:14.5px;line-height:1.75;font-style:italic;color:#475569;">&ldquo;{excerpt}&rdquo;</div>'
        )

    steps_html = "".join(
        "<tr>"
        '<td width="42" valign="top" style="padding:0 0 18px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'
        f'<td width="28" height="28" align="center" valign="middle" bgcolor="{accent}" style="width:28px;height:28px;border-radius:14px;background:{accent};color:#ffffff;font-family:{_SANS};font-size:13px;font-weight:700;">{i}</td>'
        "</tr></table></td>"
        f'<td valign="top" style="padding:0 0 18px 0;font-family:{_SANS};">'
        f'<div style="font-size:15px;font-weight:700;color:#0f172a;">{t}</div>'
        f'<div style="font-size:13.5px;line-height:1.6;color:#64748b;margin-top:2px;">{s}</div></td>'
        "</tr>"
        for i, (t, s) in enumerate(steps, 1)
    )

    inner = (
        _letterhead(date_txt)
        + f"""
<tr><td style="padding:30px 44px 0 44px;">
  <div style="font-family:{_SANS};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:{accent};">Request received &middot; Ref {ref}</div>
  <div style="font-family:{_SERIF};font-size:30px;line-height:1.25;font-weight:700;color:#0f172a;margin-top:14px;">Dear {first},</div>
  <div style="font-family:{_SERIF};font-size:16.5px;line-height:1.85;color:#334155;margin-top:14px;">{lead}</div>
</td></tr>
<tr><td style="padding:26px 44px 0 44px;">
  <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:8px 22px 22px 22px;">
    <div style="font-family:{_SANS};font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#94a3b8;padding:14px 0 2px 0;">Your request at a glance</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{''.join(rows)}</table>
    {quote_html}
  </div>
</td></tr>
<tr><td style="padding:30px 44px 0 44px;">
  <div style="font-family:{_SERIF};font-size:20px;font-weight:700;color:#0f172a;margin-bottom:18px;">What happens next</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{steps_html}</table>
</td></tr>
<tr><td style="padding:8px 44px 0 44px;">
  <div style="font-family:{_SERIF};font-size:15.5px;line-height:1.8;color:#334155;">If it is urgent, or you would simply prefer a quick chat, reach me directly:</div>
  <div style="margin-top:14px;">{_btn(_WA, "Message on WhatsApp", "#0f172a", "#ffffff")}{_btn("mailto:" + my_email, "Email me", "#ffffff", "#0f172a", "#cbd5e1")}</div>
</td></tr>
<tr><td style="padding:22px 44px 38px 44px;">
  <div style="font-family:{_SERIF};font-size:15.5px;color:#334155;">Warm regards,</div>
  <div style="font-family:{_SERIF};font-size:30px;font-style:italic;color:#0f172a;margin-top:10px;">Vijayamanikandan T.</div>
  <div style="font-family:{_SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin-top:6px;">Python Fullstack Developer &middot; AI/ML</div>
  <div style="font-family:{_SANS};font-size:13px;color:#64748b;margin-top:10px;">
    <a href="mailto:{my_email}" style="color:{accent};text-decoration:none;">{my_email}</a> &nbsp;&middot;&nbsp; Tamil Nadu, India
  </div>
</td></tr>"""
    )
    footer = "This is an automatic confirmation of your request. Your details are never shared with anyone."
    return _shell(inner, footer)


@app.route("/api/contact", methods=["POST"])
def api_contact():
    if not (brevo_key and smtp_user and mail_to):
        return jsonify({"ok": False, "error": "email is not configured on the server."}), 500

    ip = (request.headers.get("x-forwarded-for") or request.remote_addr or "?").split(",")[0].strip()
    if _rate_limited(ip):
        return jsonify({"ok": False, "error": "too many messages. please try again later."}), 429

    raw = request.get_json(silent=True) or {}
    kind = raw.get("type") if raw.get("type") in type_meta else "message"
    features = raw.get("features") if isinstance(raw.get("features"), list) else []

    d = {
        "type": kind,
        "name": _clean(raw.get("name"), 80),
        "email": _clean(raw.get("email"), 120),
        "topic": _clean(raw.get("topic"), 60) or "general",
        "message": str(raw.get("message") or "").strip()[:2000],
        "budget": _clean(raw.get("budget"), 40),
        "timeline": _clean(raw.get("timeline"), 40),
        "features": [_clean(f, 40) for f in features[:12]],
        "slot": _clean(raw.get("slot"), 60),
        "mode": _clean(raw.get("mode"), 40),
    }

    if len(d["name"]) < 2 or "@" not in d["email"] or "." not in d["email"].split("@")[-1]:
        return jsonify({"ok": False, "error": "please enter a valid name and email."}), 400
    if kind != "call" and len(d["message"]) < 10:
        return jsonify({"ok": False, "error": "message is too short."}), 400
    if kind == "call" and not d["slot"]:
        return jsonify({"ok": False, "error": "please pick a time slot."}), 400

    d["subject"] = {
        "call": f"call request: {d['slot']}",
        "project": f"project brief: {d['topic']} ({d['budget']})",
    }.get(kind, f"{d['topic']} enquiry from {d['name']}")

    received = datetime.now(ist).strftime("%a, %d %b %Y, %I:%M %p IST")

    try:
        mail = EmailMessage()
        mail["subject"] = f"{type_meta[kind][0]} | {d['subject']}"
        mail["from"] = formataddr((f"{d['name']} via portfolio", smtp_user))
        mail["to"] = mail_to
        mail["reply-to"] = formataddr((d["name"], d["email"]))
        mail.set_content(owner_email_text(d, received))
        mail.add_alternative(owner_email_html(d, received), subtype="html")
        _send(mail)
    except Exception as exc:  # noqa: BLE001
        app.logger.exception("contact email failed: %s", exc)
        return jsonify({"ok": False, "error": "could not send the email. please try again."}), 502

    if auto_reply:  # confirmation to the visitor; never fails the request
        try:
            ack = EmailMessage()
            ack["subject"] = f"Thank you for reaching out, {d['name'].split(' ')[0]} | Vijayamanikandan T."
            ack["from"] = formataddr(("vijayamanikandan t.", smtp_user))
            ack["to"] = d["email"]
            ack.set_content(
                f"Dear {d['name']},\n\n"
                "Thank you for reaching out. I have received your request and will reply personally, usually within 24 hours.\n\n"
                f"If it is urgent, message me on WhatsApp: {_WA}\n\n"
                "Warm regards,\nVijayamanikandan T.\nPython Fullstack Developer"
            )
            ack.add_alternative(reply_email_html(d), subtype="html")
            _send(ack)
        except Exception as exc:  # noqa: BLE001
            app.logger.warning("auto-reply failed: %s", exc)

    return jsonify({"ok": True})


@app.errorhandler(Exception)
def on_error(e):
    from werkzeug.exceptions import HTTPException

    if isinstance(e, HTTPException):
        return e
    app.logger.exception(e)
    return jsonify({"ok": False, "error": f"{type(e).__name__}: {e}"}), 500


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path):
    """Serve the built React app (frontend/dist) from the same server."""
    if path.startswith("api/"):
        return jsonify({"ok": False, "error": "not found"}), 404
    if path and os.path.isfile(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    app.run(debug=True)
