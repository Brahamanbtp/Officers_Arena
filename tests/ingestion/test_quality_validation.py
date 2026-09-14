from pipelines.final_validator import FinalValidator

def test_valid_question_passes_verification():
    q_text = "Which of the following articles deals with the executive power of the President of India?"
    options = {
        "A": "Article 52",
        "B": "Article 53",
        "C": "Article 54",
        "D": "Article 55"
    }

    res = FinalValidator.validate(
        question_text=q_text,
        options=options,
        question_number=1,
        overall_confidence=0.96,
        answer_key="B"
    )

    assert res.is_verified is True
    assert res.status == "VERIFIED"
    assert len(res.errors) == 0


def test_missing_option_routes_to_needs_review():
    q_text = "What is the capital of India?"
    options = {
        "A": "New Delhi",
        "B": "Mumbai",
        "C": "",  # Missing Option C
        "D": "Kolkata"
    }

    res = FinalValidator.validate(
        question_text=q_text,
        options=options,
        question_number=2,
        overall_confidence=0.90
    )

    assert res.is_verified is False
    assert res.status == "NEEDS_REVIEW"
    assert "MISSING_OPTION_CONTENT" in res.flags


def test_option_label_collision_detected_and_rejected():
    q_text = "What is the value of x in the equation 2x = 50?"
    options = {
        "A": "A",  # Collapsed label bug!
        "B": "25",
        "C": "30",
        "D": "35"
    }

    res = FinalValidator.validate(
        question_text=q_text,
        options=options,
        question_number=3,
        overall_confidence=0.95
    )

    assert res.is_verified is False
    assert res.status == "NEEDS_REVIEW"
    assert "SUSPICIOUS_OPTION_EXTRACTION" in res.flags


def test_placeholder_option_detected_and_rejected():
    q_text = "Consider the following statements regarding the Governor:"
    options = {
        "A": "Option A",  # Placeholder text!
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
    }

    res = FinalValidator.validate(
        question_text=q_text,
        options=options,
        question_number=4,
        overall_confidence=0.95
    )

    assert res.is_verified is False
    assert res.status == "NEEDS_REVIEW"
    assert "PLACEHOLDER_OPTION_DETECTED" in res.flags
