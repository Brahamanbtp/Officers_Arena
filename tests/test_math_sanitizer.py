import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "apps" / "api"))

from pipelines.math_sanitizer import MathSanitizer
from pipelines.bilingual_filter import BilingualFilter

def test_math_sanitizer():
    print("Testing MathSanitizer...")

    # Test 1: Angle & Degree TeX symbols
    raw_1 = "In the figure, \\angle BAX = 70^\\circ and \\angle BAQ = 40^\\circ."
    sanitized_1 = MathSanitizer.sanitize(raw_1)
    print("Raw 1:", raw_1)
    print("Sanitized 1:", sanitized_1)
    assert "$" in sanitized_1, "MathSanitizer must wrap TeX expressions in dollar sign delimiters"

    # Test 2: Fraction TeX symbols
    raw_2 = "What is the value of \\frac{x}{y} + \\frac{1}{2}?"
    sanitized_2 = MathSanitizer.sanitize(raw_2)
    print("Raw 2:", raw_2)
    print("Sanitized 2:", sanitized_2)
    assert "$" in sanitized_2, "MathSanitizer must wrap fractions in dollar sign delimiters"

    # Test 3: Already formatted math
    raw_3 = "If $\\angle ABC = 90^\\circ$, then find area."
    sanitized_3 = MathSanitizer.sanitize(raw_3)
    print("Raw 3:", raw_3)
    print("Sanitized 3:", sanitized_3)
    assert sanitized_3.count("$") == 2, "MathSanitizer must preserve existing dollar sign delimiters"

    print("MathSanitizer Tests PASSED!")

def test_bilingual_filter():
    print("Testing BilingualFilter...")

    # Test 1: Devanagari Hindi text stripping
    raw_hindi = "In the figure given above, what is \\angle CBA?\nऊपर दिए गए चित्र में, \\angle CBA क्या है?"
    clean_text = BilingualFilter.strip_hindi(raw_hindi)
    print("Clean text:", clean_text)
    assert "ऊपर दिए" not in clean_text, "BilingualFilter must strip Hindi translation lines"
    assert "In the figure given above" in clean_text, "BilingualFilter must preserve English text"

    print("BilingualFilter Tests PASSED!")

if __name__ == "__main__":
    test_math_sanitizer()
    test_bilingual_filter()
