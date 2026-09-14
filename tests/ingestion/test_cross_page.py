from pipelines.question_segmenter import RawSegmentedQuestion
from pipelines.cross_page_assembler import CrossPageAssembler

def test_cross_page_question_and_options_stitching():
    """
    Simulates a question split across two pages:
    Page 1: Question 52 body + options A, B
    Page 2: Options C, D + Question 53
    """
    # Page 1 raw segmented questions
    page1_q52 = RawSegmentedQuestion(
        question_number=52,
        source_pages=[1],
        question_lines=["Under Article 77 of the Constitution of India, consider the following statements:"],
        option_lines=["(a) 1 only", "(b) 2 only"]
    )

    # Page 2 raw segmented questions (continuation of options for Q52, then Q53)
    page2_q52_continuation = RawSegmentedQuestion(
        question_number=52,
        source_pages=[2],
        question_lines=[],
        option_lines=["(c) Both 1 and 2", "(d) Neither 1 nor 2"]
    )

    page2_q53 = RawSegmentedQuestion(
        question_number=53,
        source_pages=[2],
        question_lines=["With reference to the Indian economy, consider the following statements:"],
        option_lines=["(a) 10%", "(b) 20%", "(c) 30%", "(d) 40%"]
    )

    segmented_by_page = [
        [page1_q52],
        [page2_q52_continuation, page2_q53]
    ]

    assembled = CrossPageAssembler.assemble_questions(segmented_by_page)

    assert len(assembled) == 2, f"Expected 2 assembled questions, got {len(assembled)}"

    # Check Question 52 reconstructed across pages
    q52 = assembled[0]
    assert q52.question_number == 52
    assert q52.source_pages == [1, 2]
    assert q52.options["A"] == "1 only"
    assert q52.options["B"] == "2 only"
    assert q52.options["C"] == "Both 1 and 2"
    assert q52.options["D"] == "Neither 1 nor 2"
    assert q52.is_cross_page is True

    # Check Question 53 is intact on page 2
    q53 = assembled[1]
    assert q53.question_number == 53
    assert q53.source_pages == [2]
    assert q53.options["A"] == "10%"
    assert q53.options["D"] == "40%"
