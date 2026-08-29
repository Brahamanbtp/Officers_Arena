-- Officers Arena - Seed First UPSC Question & Topic

-- 1. Insert Target Topic: Indian Polity
INSERT INTO public.topics (id, name, parent_topic_id, subject)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Executive Powers of the President',
    NULL,
    'Indian Polity'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert UPSC Question: President's Executive & Ordinance Powers
INSERT INTO public.questions (
    id,
    topic_id,
    exam_type,
    difficulty_level,
    content,
    explanation,
    metadata
)
VALUES (
    '99999999-8888-7777-6666-555555555555',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'UPSC',
    0.65,
    'Under the provisions of the Constitution of India, consider the following statements regarding the Executive Powers of the President of India:

1. All executive actions of the Government of India are formally taken in the name of the President.
2. The President can make rules specifying the manner in which orders and other instruments made and executed in his name shall be authenticated.
3. The President appoints the Prime Minister and other ministers, and they hold office during his pleasure.

Which of the statements given above are correct?',
    'Statements 1, 2, and 3 are all correct. Under Article 77(1), all executive action of the Government of India is expressed to be taken in the name of the President. Article 77(2) provides that orders and other instruments shall be authenticated in such manner as specified by rules made by the President. Under Article 75(1), the Prime Minister is appointed by the President and other Ministers are appointed on the advice of the Prime Minister, holding office during the pleasure of the President.',
    '{"subject": "Indian Polity", "year": 2023, "paper": "UPSC CSE Prelims Paper I", "source": "M. Laxmikanth - Chapter 17"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert 4 Options for the Question
INSERT INTO public.options (id, question_id, content, is_correct)
VALUES 
    (uuid_generate_v4(), '99999999-8888-7777-6666-555555555555', '1 and 2 only', FALSE),
    (uuid_generate_v4(), '99999999-8888-7777-6666-555555555555', '2 and 3 only', FALSE),
    (uuid_generate_v4(), '99999999-8888-7777-6666-555555555555', '1, 2 and 3', TRUE),
    (uuid_generate_v4(), '99999999-8888-7777-6666-555555555555', '1 and 3 only', FALSE)
ON CONFLICT (id) DO NOTHING;
