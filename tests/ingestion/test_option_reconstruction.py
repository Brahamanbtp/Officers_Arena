from pipelines.option_reconstructor import OptionReconstructor

def test_critical_regression_numeric_options():
    """
    CRITICAL REGRESSION TEST:
    Input:
    (a) 25
    (b) 50
    (c) 75
    (d) 100

    MUST become:
    A = "25"
    B = "50"
    C = "75"
    D = "100"

    MUST NOT become:
    A = "A" or "Option A"
    B = "B" or "Option B"
    """
    lines = [
        "(a) 25",
        "(b) 50",
        "(c) 75",
        "(d) 100"
    ]

    opts_dict, reconstructed, conf = OptionReconstructor.reconstruct_options(lines)

    assert opts_dict["A"] == "25", f"Expected A='25', got '{opts_dict.get('A')}'"
    assert opts_dict["B"] == "50", f"Expected B='50', got '{opts_dict.get('B')}'"
    assert opts_dict["C"] == "75", f"Expected C='75', got '{opts_dict.get('C')}'"
    assert opts_dict["D"] == "100", f"Expected D='100', got '{opts_dict.get('D')}'"

    for r in reconstructed:
        assert r.text != r.label, f"Option content collapsed to label '{r.label}'!"
        assert not r.text.startswith("Option "), f"Option content was replaced with placeholder '{r.text}'!"
        assert r.content_type == "NUMERIC"
    assert conf >= 0.95


def test_single_line_multiple_options():
    """
    Tests options formatted on a single line:
    (a) 25   (b) 50   (c) 75   (d) 100
    """
    lines = [
        "(a) 25   (b) 50   (c) 75   (d) 100"
    ]

    opts_dict, reconstructed, conf = OptionReconstructor.reconstruct_options(lines)

    assert opts_dict["A"] == "25"
    assert opts_dict["B"] == "50"
    assert opts_dict["C"] == "75"
    assert opts_dict["D"] == "100"
    assert conf >= 0.95


def test_two_by_two_grid_options():
    """
    Tests options formatted as a 2x2 grid:
    (a) 12 km/h    (b) 24 km/h
    (c) 36 km/h    (d) 48 km/h
    """
    lines = [
        "(a) 12 km/h    (b) 24 km/h",
        "(c) 36 km/h    (d) 48 km/h"
    ]

    opts_dict, reconstructed, conf = OptionReconstructor.reconstruct_options(lines)

    assert "12 km/h" in opts_dict["A"]
    assert "24 km/h" in opts_dict["B"]
    assert "36 km/h" in opts_dict["C"]
    assert "48 km/h" in opts_dict["D"]
    assert conf >= 0.95


def test_multiline_options():
    """
    Tests option content that wraps across multiple lines without a new option marker.
    """
    lines = [
        "(a) The President shall make rules for the more convenient",
        "transaction of the business of the Government of India",
        "(b) The executive power of the Union shall be vested",
        "in the Prime Minister",
        "(c) The Council of Ministers shall be collectively responsible",
        "to the House of the People",
        "(d) None of the above statements is correct"
    ]

    opts_dict, reconstructed, conf = OptionReconstructor.reconstruct_options(lines)

    assert "convenient transaction" in opts_dict["A"]
    assert "Prime Minister" in opts_dict["B"]
    assert "House of the People" in opts_dict["C"]
    assert "None of the above" in opts_dict["D"]
    assert conf >= 0.95


def test_statement_options():
    """
    Tests options based on statement combinations:
    (a) 1 only
    (b) 2 only
    (c) Both 1 and 2
    (d) Neither 1 nor 2
    """
    lines = [
        "(a) 1 only",
        "(b) 2 only",
        "(c) Both 1 and 2",
        "(d) Neither 1 nor 2"
    ]

    opts_dict, reconstructed, conf = OptionReconstructor.reconstruct_options(lines)

    assert opts_dict["A"] == "1 only"
    assert opts_dict["B"] == "2 only"
    assert opts_dict["C"] == "Both 1 and 2"
    assert opts_dict["D"] == "Neither 1 nor 2"
    assert reconstructed[2].content_type == "STATEMENT"


def test_mathematical_options():
    """
    Tests mathematical options with fractions and square roots:
    (a) \\frac{1}{\\sqrt{2}}
    (b) \\frac{\\sqrt{3}}{2}
    (c) 1
    (d) 0
    """
    lines = [
        r"(a) \frac{1}{\sqrt{2}}",
        r"(b) \frac{\sqrt{3}}{2}",
        "(c) 1",
        "(d) 0"
    ]

    opts_dict, reconstructed, conf = OptionReconstructor.reconstruct_options(lines)

    assert r"\frac{1}{\sqrt{2}}" in opts_dict["A"] or r"\frac{1}{\sqrt{2}}" in opts_dict["A"].replace("$", "")
    assert r"\frac{\sqrt{3}}{2}" in opts_dict["B"] or r"\frac{\sqrt{3}}{2}" in opts_dict["B"].replace("$", "")
    assert opts_dict["C"] == "1"
    assert opts_dict["D"] == "0"
    assert reconstructed[0].content_type == "MATHEMATICAL"
