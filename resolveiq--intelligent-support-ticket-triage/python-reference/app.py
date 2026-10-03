"""
Dual-Dashboard AI Customer Support Ticket Triage System
Streamlit Architecture Baseline & Starter Application
"""

import streamlit as st
import pandas as pd
import numpy as np
import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Page Configuration
st.set_page_config(
    page_title="OmniTriage AI · Dual-Dashboard Triage",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -------------------------------------------------------------
# SAMPLE SEED DATA & HISTORICAL RESOLUTIONS
# -------------------------------------------------------------
SAMPLE_TICKETS = [
    {
        "id": "TICK-101",
        "title": "Payment gateway socket hangup 502 error",
        "description": "All customer checkout API calls are failing with code 502 across US-East-1. Urgent revenue impact!",
        "category": "technical",
        "priority": "urgent",
        "sentiment": "frustrated",
        "frustration_index": 92,
        "company": "Aura Retail Global",
        "sla_tier": "Enterprise",
        "assigned_officer": "Specialist Sarah K.",
        "status": "open",
        "confidence": 0.96,
        "draft_reply": "Hi Aura Retail team,\n\nWe have identified an ALB socket timeout on the US-East-1 connection pool and provisioned additional ingress replicas. Traffic is recovering now.\n\nBest regards,\nTriage Engineering"
    },
    {
        "id": "TICK-102",
        "title": "August PDF invoice discrepancy $38,500 vs $42,000 in ledger",
        "description": "Our dashboard revenue shows $42k for August, but the PDF invoice receipt says $38,500. Please rectify before quarterly audit.",
        "category": "billing",
        "priority": "high",
        "sentiment": "negative",
        "frustration_index": 48,
        "company": "Vanguard Capital",
        "sla_tier": "Enterprise",
        "assigned_officer": "Officer Alex Chen",
        "status": "in_review",
        "confidence": 0.62,
        "draft_reply": "Hi Vanguard Capital team,\n\nOur billing operations unit is currently cross-referencing your Stripe ledger with the data warehouse to issue an adjusted reconciliation credit.\n\nBest regards,\nFinancial Support Ops"
    },
    {
        "id": "TICK-103",
        "title": "Cannot invite external contractor to workspace",
        "description": "Attempting to invite contractor@thirdparty.com throws error 400. Need to invite before Sprint starts.",
        "category": "account",
        "priority": "medium",
        "sentiment": "neutral",
        "frustration_index": 28,
        "company": "Apex Retailers",
        "sla_tier": "Pro",
        "assigned_officer": "Specialist Sarah K.",
        "status": "open",
        "confidence": 0.88,
        "draft_reply": "Hi Apex Retailers team,\n\nYour workspace seat tier limit was reached. We have released 2 inactive floating licenses so you can immediately invite your contractor.\n\nBest regards,\nAccount Services"
    }
]

# Initialize Session State
if "tickets" not in st.session_state:
    st.session_state.tickets = SAMPLE_TICKETS

if "user_role" not in st.session_state:
    st.session_state.user_role = "Officer"

if "officer_name" not in st.session_state:
    st.session_state.officer_name = "Specialist Sarah K."

# -------------------------------------------------------------
# SIDEBAR AUTHENTICATION & NAVIGATION
# -------------------------------------------------------------
with st.sidebar:
    st.title("⚡ OmniTriage AI")
    st.caption("Dual-Dashboard Support Triage System")
    st.divider()

    st.subheader("Authentication & Role")
    role_choice = st.selectbox(
        "Active Role",
        ["Officer (Execution)", "Admin (Supervision & Governance)"],
        index=0 if st.session_state.user_role == "Officer" else 1
    )
    st.session_state.user_role = "Officer" if "Officer" in role_choice else "Admin"

    if st.session_state.user_role == "Officer":
        st.session_state.officer_name = st.selectbox(
            "Officer Identity",
            ["Specialist Sarah K.", "Officer Alex Chen", "Lead Engineer Marcus C."]
        )
        st.badge = "Officer Queue"
    else:
        st.success("🔒 Authenticated as ROOT ADMIN")

    st.divider()
    st.caption("System Status: Online · Latency: 18ms")

# -------------------------------------------------------------
# 1. THE OFFICER DASHBOARD (EXECUTION)
# -------------------------------------------------------------
if st.session_state.user_role == "Officer":
    st.header(f"📋 Officer Triage Queue · {st.session_state.officer_name}")
    st.info("Execution View: Process assigned inbound requests, review AI predictions, edit drafts, and dispatch replies.")

    # Filter controls for the officer
    col1, col2 = st.columns([2, 2])
    with col1:
        category_filter = st.selectbox(
            "Queue Filter (Category)",
            ["All Assigned", "technical", "billing", "account", "product"]
        )
    with col2:
        company_filter = st.selectbox(
            "Denoted Company Portfolio",
            ["All Denoted Companies", "Aura Retail Global", "Vanguard Capital", "Apex Retailers"]
        )

    # Filter tickets
    filtered = [
        t for t in st.session_state.tickets
        if (category_filter == "All Assigned" or t["category"] == category_filter) and
           (company_filter == "All Denoted Companies" or t["company"] == company_filter)
    ]

    st.subheader(f"Assigned Inbound Tickets ({len(filtered)})")

    for idx, t in enumerate(filtered):
        with st.expander(f"[{t['priority'].upper()}] {t['title']} · {t['company']} ({t['sla_tier']} SLA)", expanded=(idx == 0)):
            col_l, col_r = st.columns([3, 2])

            with col_l:
                st.markdown("**Original Ticket Payload:**")
                st.code(t["description"], language="text")

                st.markdown(f"**Customer Frustration Index:** `{t['frustration_index']}/100` ({t['sentiment']})")
                st.markdown(f"**Multiclass AI Confidence:** `{(t['confidence']*100):.1f}%` → `{t['category']}`")

            with col_r:
                st.markdown("**AI Synthesized Response Draft:**")
                draft_text = st.text_area(
                    "Draft Reply (Editable)",
                    value=t["draft_reply"],
                    height=130,
                    key=f"draft_{t['id']}"
                )

                b_col1, b_col2, b_col3 = st.columns(3)
                with b_col1:
                    if st.button("🚀 Send Reply", key=f"send_{t['id']}", use_container_width=True):
                        t["status"] = "resolved"
                        t["draft_reply"] = draft_text
                        st.success(f"Dispatched reply for {t['id']}!")
                with b_col2:
                    if st.button("✏️ Edit Reply", key=f"edit_{t['id']}", use_container_width=True):
                        st.info("Reply updated in draft workspace.")
                with b_col3:
                    if st.button("⚠️ Escalate to Admin", key=f"esc_{t['id']}", use_container_width=True):
                        t["priority"] = "urgent"
                        t["status"] = "in_review"
                        st.warning(f"Ticket {t['id']} escalated to Admin Supervision Queue!")

# -------------------------------------------------------------
# 2. THE ADMIN DASHBOARD (SUPERVISION & GOVERNANCE)
# -------------------------------------------------------------
else:
    st.header("🛡️ Executive Admin Supervision & Governance Console")
    st.info("Supervisory View: Oversee officer duty, triage overrides (HITL), category sentiment heatmaps, and autonomous AI rules.")

    tab1, tab2, tab3 = st.tabs(["🔥 Sentiment & Outage Heatmap", "🛡️ Triage Override Queue (HITL)", "⚙️ AI Governance & Rules"])

    # TAB 1: SENTIMENT HEATMAP
    with tab1:
        st.subheader("Category Frustration & Outage Heatmap")
        st.write("Tracking volume and frustration levels across categories to detect sudden service outages.")

        heatmap_df = pd.DataFrame([
            {"Category": "Technical", "Volume": 42, "Avg Frustration": 78, "Outage Risk": "CRITICAL"},
            {"Category": "Billing", "Volume": 28, "Avg Frustration": 42, "Outage Risk": "STABLE"},
            {"Category": "Account", "Volume": 19, "Avg Frustration": 31, "Outage Risk": "STABLE"},
            {"Category": "Product", "Volume": 14, "Avg Frustration": 24, "Outage Risk": "STABLE"},
        ])
        st.dataframe(heatmap_df, use_container_width=True)

        if st.button("🚨 Simulate Urgent Outage Spike"):
            st.error("Outage Anomaly Detected: 502 Bad Gateway spike across Technical ingress!")

    # TAB 2: TRIAGE OVERRIDE QUEUE
    with tab2:
        st.subheader("Triage Override Queue (Active Learning Loop)")
        st.write("Predictions below confidence cutoff logged for human verification and retraining.")

        overrides = [t for t in st.session_state.tickets if t["status"] == "in_review" or t["confidence"] < 0.75]
        for item in overrides:
            with st.container():
                st.markdown(f"**Ticket ID:** `{item['id']}` · **Confidence:** `{(item['confidence']*100):.1f}%`")
                st.write(item["description"])
                col_btn = st.columns(4)
                for i, cat in enumerate(["technical", "billing", "account", "product"]):
                    if col_btn[i].button(f"Assign {cat.capitalize()}", key=f"ov_{item['id']}_{cat}"):
                        item["category"] = cat
                        item["status"] = "triaged"
                        st.success(f"Overridden to {cat}!")

    # TAB 3: AI GOVERNANCE
    with tab3:
        st.subheader("Autonomous AI Cutoff Threshold")
        threshold = st.slider("Autonomous Routing Confidence Cutoff", min_value=0.70, max_value=0.98, value=0.88, step=0.02)
        st.write(f"Predictions with confidence < **{int(threshold*100)}%** will automatically route to Admin Review Queue.")

        st.checkbox("Mandatory HITL verification on all Security and Account Incidents", value=True)
        st.checkbox("Mandatory HITL verification on Billing discrepancies > $500", value=True)
