import re

HIGH_RISK_TERMS = {
    # Dosage
    "dose", "dosage", "overdose", "underdose", "mg", "ml",
    "milligram", "millilitre", "tablet", "capsule",
    # Conditions
    "allergy", "allergic", "anaphylaxis",
    "insulin", "diabetes", "diabetic",
    "pregnancy", "pregnant", "trimester",
    "hiv", "aids", "arv", "antiretroviral",
    "tuberculosis", "tb", "isoniazid", "rifampicin",
    # Actions
    "inject", "injection", "infusion", "transfusion",
    "stop", "discontinue", "avoid", "contraindicated",
    "emergency", "urgent", "immediately",
}


def check_safety(text: str, translated: str) -> dict:
    """
    Returns a safety assessment for a translation.
    Uses word-boundary matching to avoid false positives
    (e.g. 'tb' inside 'tablet', 'stop' inside 'stomach').
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
            " This phrase contains high-risk medical terminology. "
            "Please verify this translation with a qualified bilingual "
            "healthcare professional before clinical use."
        ) if is_high_risk else None,
        "requires_review": is_high_risk,
    }
