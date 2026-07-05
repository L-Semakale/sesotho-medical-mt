import re

HIGH_RISK_TERMS = {
    # Overdose / toxic quantities
    "overdose",
    "toxic dose",
    "maximum dose exceeded",
    "lethal dose",

    # Controlled substances / high-risk drugs
    "morphine",
    "fentanyl",
    "ketamine",
    "midazolam",
    "diazepam",
    "haloperidol",
    "warfarin",
    "heparin",
    "insulin",
    "digoxin",
    "lithium",
    "methotrexate",
    "chemotherapy",

    # Life-threatening conditions / events
    "anaphylaxis",
    "anaphylactic shock",
    "cardiac arrest",
    "respiratory arrest",
    "stop breathing",
    "life-threatening",
    "do not resuscitate",
    "dnr",

    # Dangerous instructions
    "contraindicated",
    "do not administer",
    "do not inject",
    "do not take",
    "discontinue immediately",
    "stop immediately",
    "avoid completely",

    # High-risk drug interactions / warnings
    "fatal",
    "lethal",
    "poison",
    "poisoning",
    "toxicity",
    "toxic",
    "antidote",

    # Emergency escalation
    "call emergency",
    "call ambulance",
    "go to emergency",
}


def check_safety(text: str, translated: str) -> dict:
    """
    Returns a safety assessment for a translation.
    Uses word-boundary matching to avoid false positives.
    Only flags genuinely dangerous clinical terms.
    """
    text_lower     = text.lower()
    detected_terms = [
        term for term in HIGH_RISK_TERMS
        if re.search(rf"\b{re.escape(term)}\b", text_lower)
    ]
    is_high_risk = len(detected_terms) > 0

    return {
        "is_high_risk":    is_high_risk,
        "detected_terms":  detected_terms,
        "warning": (
            "This phrase contains high-risk medical terminology. "
            "Please verify this translation with a qualified bilingual "
            "healthcare professional before clinical use."
        ) if is_high_risk else None,
        "requires_review": is_high_risk,
    }
