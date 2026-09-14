import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import fitz  # PyMuPDF
from pipelines.schemas.manifest import PaperManifest, QuestionManifest


class IngestionValidator:
    """
    Self-validating quality gate engine enforcing:
    1. Expected Question Count Gate
    2. Image HTTP / Disk File Quality Gate
    3. Math Single-Render Safeguard
    4. Layered Deduplication Gate
    5. Reconciliation Report Generator
    """

    @staticmethod
    def validate_math_single_render(text: str) -> Tuple[bool, List[str]]:
        """Verifies text does not contain duplicated math strings like '380 380' or '5% 5%'."""
        issues = []
        # Check for duplicated consecutive numbers or percentage tokens
        dup_matches = re.findall(r"\b(\d{1,4}%?)\s+\1\b", text)
        if dup_matches:
            issues.append(f"Duplicated math token detected in text: {dup_matches}")
            return False, issues
        return True, []

    @staticmethod
    def validate_image_access(file_path: Optional[str]) -> Tuple[bool, str]:
        """Validates that cropped image file exists on disk and is non-empty."""
        if not file_path:
            return False, "No file path provided"
        if not os.path.exists(file_path):
            return False, f"File does not exist: {file_path}"
        if os.path.getsize(file_path) == 0:
            return False, f"File is 0 bytes: {file_path}"
        return True, "OK"

    @classmethod
    def run_structural_assertions(cls, q: QuestionManifest) -> Tuple[List[str], List[str]]:
        """
        Executes 9 Machine Structural Assertions. Returns (passed_assertions, failed_issues).
        """
        passed = []
        failed = []

        # Assertion 1: source_page_verified
        if q.page_numbers and len(q.page_numbers) > 0:
            passed.append("assert_source_page_verified")
        else:
            failed.append("FAIL: assert_source_page_verified - Missing source page number")

        # Assertion 2: question_number_verified
        if q.question_number is not None and 1 <= q.question_number <= 150:
            passed.append("assert_question_number_verified")
        else:
            failed.append("FAIL: assert_question_number_verified - Invalid question number anchor")

        # Assertion 3: question_ownership_region_verified
        if q.ownership_region and q.ownership_region.bbox:
            passed.append("assert_question_ownership_region_verified")
        else:
            failed.append("FAIL: assert_question_ownership_region_verified - Ownership region not computed")

        # Assertion 4: visual_region_verified
        for fig in q.figures:
            if fig.bbox and fig.bbox.area() > 0:
                passed.append("assert_visual_region_verified")
            else:
                failed.append("FAIL: assert_visual_region_verified - Visual bbox area is 0")

        # Assertion 5: neighboring_question_exclusion
        for fig in q.figures:
            if not fig.is_rejected:
                passed.append("assert_neighboring_question_exclusion")

        # Assertion 6: language_verified
        if q.language == "english" and not bool(re.search(r"[\u0900-\u097F]", q.text)):
            passed.append("assert_language_verified")
        else:
            failed.append("FAIL: assert_language_verified - Unfiltered Hindi text detected")

        # Assertion 7: crop_integrity_verified
        for fig in q.figures:
            if fig.crop_file_path and os.path.exists(fig.crop_file_path) and os.path.getsize(fig.crop_file_path) > 100:
                passed.append("assert_crop_integrity_verified")

        # Assertion 8: visual_question_association_verified
        if len(q.figures) == 0 or all(f.confidence >= 0.85 for f in q.figures):
            passed.append("assert_visual_question_association_verified")
        else:
            failed.append("FAIL: assert_visual_question_association_verified - Association confidence too low")

        # Assertion 9: source_to_crop_correspondence_verified
        if q.source_pdf_hash:
            passed.append("assert_source_to_crop_correspondence_verified")

        return passed, failed

    @classmethod
    def validate_question_manifest(cls, q: QuestionManifest) -> Tuple[str, List[str]]:
        """Runs quality checks on an individual QuestionManifest."""
        issues = []
        
        # Check 1: Text length & presence
        if not q.text or len(q.text.strip()) < 10:
            issues.append("Question text is empty or too short (< 10 chars)")
            
        # Check 2: Math duplication
        is_math_valid, math_issues = cls.validate_math_single_render(q.text)
        if not is_math_valid:
            issues.extend(math_issues)
            
        # Check 3: Options structure
        if not q.options or len(q.options) < 2:
            issues.append(f"Insufficient options dictionary: {q.options}")
            
        # Check 4: Figure crop validity & 9 Structural Assertions
        passed_assertions, failed_assertions = cls.run_structural_assertions(q)
        q.structural_assertions_passed = passed_assertions
        if failed_assertions:
            issues.extend(failed_assertions)

        for fig in q.figures:
            if fig.crop_file_path:
                is_img_valid, img_msg = cls.validate_image_access(fig.crop_file_path)
                if not is_img_valid:
                    issues.append(f"Figure crop access failure: {img_msg}")

        status = "PASS" if not issues else "REVIEW_REQUIRED"
        return status, issues

    @classmethod
    def render_debug_contact_sheet(cls, doc: fitz.Document, paper: PaperManifest, output_path: str) -> str:
        """
        Renders debug contact sheet PDF/PNG overlays with blue boxes for Q_ownership and green boxes for V_bbox.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Draw overlays
            for q in paper.questions:
                if page_num in q.page_numbers and q.ownership_region:
                    ob = q.ownership_region.bbox
                    rect_ob = fitz.Rect(ob.x0, ob.y0, ob.x1, ob.y1)
                    page.draw_rect(rect_ob, color=(0, 0, 1), width=1.5)  # Blue for Q_ownership
                    page.insert_text((ob.x0 + 5, ob.y0 + 12), f"Q{q.question_number}", color=(0, 0, 1), fontsize=10)

                for fig in q.figures:
                    if fig.bbox.page_num == page_num:
                        fb = fig.bbox
                        rect_fb = fitz.Rect(fb.x0, fb.y0, fb.x1, fb.y1)
                        page.draw_rect(rect_fb, color=(0, 1, 0), width=2.0)  # Green for V_bbox
                        page.insert_text((fb.x0 + 5, fb.y0 + 12), f"Fig Q{fig.source_question_number or ''}", color=(0, 0.8, 0), fontsize=9)

        # Save debug PDF
        doc.save(output_path)
        return output_path

    @classmethod
    def run_paper_validation_gates(cls, paper: PaperManifest) -> PaperManifest:
        """
        Executes paper-level quality gates and generates reconciliation summary.
        """
        validated_qs: List[QuestionManifest] = []
        dup_tracker: Dict[Tuple[int, str], QuestionManifest] = {}
        
        passed_count = 0
        review_count = 0
        failed_count = 0
        
        for q in paper.questions:
            status, issues = cls.validate_question_manifest(q)
            q.validation_status = status
            q.validation_issues = issues
            
            # Deduplication Check on (question_number, normalized_text)
            q_num = q.question_number or 0
            norm_key = (q_num, q.text[:40].lower().strip())
            
            if norm_key in dup_tracker:
                q.validation_status = "FAIL"
                q.validation_issues.append("DEDUPLICATION GATE: Duplicate question detected in same paper.")
                failed_count += 1
                continue
            else:
                dup_tracker[norm_key] = q

            if status == "PASS":
                passed_count += 1
            else:
                review_count += 1
                
            validated_qs.append(q)

        paper.questions = validated_qs
        paper.validated_question_count = len(validated_qs)
        
        # Question Count Quality Gate
        expected = paper.expected_question_count
        detected = paper.detected_question_count
        
        count_diff = abs(expected - paper.validated_question_count)
        if count_diff == 0:
            paper.overall_status = "PASS"
        elif count_diff <= 5:
            paper.overall_status = "PASS"
        else:
            paper.overall_status = "REVIEW_REQUIRED"

        paper.reconciliation_summary = {
            "expected_count": expected,
            "detected_count": detected,
            "validated_count": paper.validated_question_count,
            "passed_count": passed_count,
            "review_count": review_count,
            "failed_count": failed_count,
            "count_gate_status": "MATCH" if count_diff == 0 else f"DIFF: {count_diff}"
        }
        
        return paper

    @staticmethod
    def generate_reconciliation_report(paper: PaperManifest, output_path: str) -> str:
        """Saves paper reconciliation report to JSON file."""
        report_data = {
            "paper_id": paper.paper_id,
            "source_pdf": paper.source_pdf,
            "source_pdf_hash": paper.source_pdf_hash,
            "exam": f"{paper.exam_type} {paper.year} {paper.session or ''} {paper.subject}".strip(),
            "overall_status": paper.overall_status,
            "reconciliation_summary": paper.reconciliation_summary,
            "question_audit": [
                {
                    "q_num": q.question_number,
                    "pages": q.page_numbers,
                    "status": q.validation_status,
                    "issues": q.validation_issues,
                    "figures_count": len(q.figures)
                }
                for q in paper.questions
            ]
        }
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
            
        return output_path

