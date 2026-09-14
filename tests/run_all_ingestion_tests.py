import os
import sys
import unittest
from pathlib import Path

# Add paths to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "apps" / "api"))
sys.path.insert(0, str(root_dir))

from dotenv import load_dotenv
load_dotenv(str(root_dir / "apps" / "api" / ".env"))

def run_tests():
    print("================================================================================")
    print("RUNNING ALL PRODUCTION DOCUMENT INGESTION UNIT & REGRESSION TESTS")
    print("================================================================================")

    # Import test modules
    import tests.ingestion.test_option_reconstruction as t_opt
    import tests.ingestion.test_file_validation as t_file
    import tests.ingestion.test_cross_page as t_cross
    import tests.ingestion.test_quality_validation as t_qual
    import tests.ingestion.test_page_routing as t_route
    import tests.ingestion.test_provider_failures as t_prov

    passed = 0
    failed = 0
    test_functions = [
        # Option Reconstruction & Critical Regression
        ("test_critical_regression_numeric_options", t_opt.test_critical_regression_numeric_options),
        ("test_single_line_multiple_options", t_opt.test_single_line_multiple_options),
        ("test_two_by_two_grid_options", t_opt.test_two_by_two_grid_options),
        ("test_multiline_options", t_opt.test_multiline_options),
        ("test_statement_options", t_opt.test_statement_options),
        ("test_mathematical_options", t_opt.test_mathematical_options),

        # File Validation
        ("test_valid_pdf_validation", t_file.test_valid_pdf_validation),
        ("test_empty_file_rejection", t_file.test_empty_file_rejection),
        ("test_corrupted_pdf_rejection", t_file.test_corrupted_pdf_rejection),
        ("test_sha256_hash_consistency", t_file.test_sha256_hash_consistency),

        # Cross-Page Assembly
        ("test_cross_page_question_and_options_stitching", t_cross.test_cross_page_question_and_options_stitching),

        # Quality Validation & Safety
        ("test_valid_question_passes_verification", t_qual.test_valid_question_passes_verification),
        ("test_missing_option_routes_to_needs_review", t_qual.test_missing_option_routes_to_needs_review),
        ("test_option_label_collision_detected_and_rejected", t_qual.test_option_label_collision_detected_and_rejected),
        ("test_placeholder_option_detected_and_rejected", t_qual.test_placeholder_option_detected_and_rejected),

        # Page Routing
        ("test_digital_page_avoids_unnecessary_ocr", t_route.test_digital_page_avoids_unnecessary_ocr),

        # Cloud Provider Backoff
        ("test_retry_with_backoff_on_transient_429", t_prov.test_retry_with_backoff_on_transient_429),
        ("test_fail_fast_on_invalid_api_key", t_prov.test_fail_fast_on_invalid_api_key),
    ]

    for name, func in test_functions:
        try:
            func()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    print("\n================================================================================")
    print(f"TEST RUN SUMMARY: {passed} PASSED, {failed} FAILED (TOTAL: {len(test_functions)})")
    print("================================================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
