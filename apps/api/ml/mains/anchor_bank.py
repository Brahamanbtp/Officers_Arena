from typing import List, Dict, Any

class MainsAnchorBank:
    """
    Standardized, calibrated UPSC Mains answer benchmarks across score tiers (Low, Medium, High).
    Injected into LLM evaluation prompts to provide few-shot grounding, eliminating prompt drift.
    """

    ANCHORS: Dict[str, List[Dict[str, Any]]] = {
        "GS2_POLITY": [
            {
                "score_tier": "LOW (3.0/10)",
                "characteristics": "Generic points, no constitutional articles, no Supreme Court cases, unstructured paragraphs.",
                "sample_excerpt": "The Governor has many powers. He can appoint the Chief Minister and dismiss the government. Sometimes this causes political problems. The Governor should act fairly."
            },
            {
                "score_tier": "MEDIUM (5.5/10)",
                "characteristics": "Mentions Article 163 and Sarkaria Commission, standard pros/cons, lacks recent case law and punchy way forward.",
                "sample_excerpt": "Under Article 163, the Governor acts on aid and advice except in discretionary matters. Issues arise in Article 356 and floor tests. Sarkaria Commission recommended impartial persons. Punchhi commission also gave recommendations."
            },
            {
                "score_tier": "HIGH (8.5/10)",
                "characteristics": "Multi-dimensional: constitutional provisions (Art 163, 174, 200, 356), landmark rulings (Nabam Rebia 2016, Shamsher Singh, Rameshwar Prasad), Punchhi Committee & NCRWC citations, schematic flowchart, clear reform roadmap.",
                "sample_excerpt": "The Governor's office represents the federal linchpin (Art 153-163). In Shamsher Singh v. State of Punjab, SC held discretionary powers are constitutional exceptions. In Nabam Rebia (2016), discretion under Art 174 was curtailed regarding assembly summoning. Reforms: Implement Punchhi Commission's 5-year fixed tenure and impeachment-like removal procedure to ensure constitutional neutrality."
            }
        ],
        "GS3_ECONOMY": [
            {
                "score_tier": "LOW (3.0/10)",
                "characteristics": "Superficial economic points, missing GDP/NPA statistics, no mention of statutory acts or NITI Aayog.",
                "sample_excerpt": "India needs more manufacturing to grow. MSMEs are important for jobs. Government has launched schemes like Make in India. More loans should be given to small industries."
            },
            {
                "score_tier": "MEDIUM (5.5/10)",
                "characteristics": "Structured with sub-headings, mentions PLI scheme and Logistics Policy, standard textbook analysis.",
                "sample_excerpt": "Manufacturing sector contributes ~15% to GDP. Key bottlenecks include logistics cost (13% of GDP) and credit gap. Government initiatives: Production Linked Incentive (PLI) across 14 sectors, National Logistics Policy (NLP 2022). Way forward: Skill development and ease of doing business."
            },
            {
                "score_tier": "HIGH (8.5/10)",
                "characteristics": "Deep empirical data (GVA share, capital goods import dependency, ICOR analysis), multi-pillar framework (Supply-side, Infrastructure, Factor market reforms), references to Economic Survey and NITI Aayog Strategy @75.",
                "sample_excerpt": "To escape the 'Premature De-industrialization' trap, India's National Manufacturing Policy aims for 25% GDP share by 2025. Bottlenecks: Inverted duty structures, elevated logistics friction (14% vs Global 8%), and MSME missing middle (Stunted Firm phenomenon - Economic Survey). Strategic Roadmap: Scale PLI with value-addition mandates, integrate PM Gati Shakti with Dedicated Freight Corridors (DFCs), and operationalize plug-and-play Industrial Corridors (NICDIT)."
            }
        ]
    }

    @classmethod
    def get_anchors_for_prompt(cls, topic_or_paper: str = "GS2_POLITY") -> str:
        key = "GS3_ECONOMY" if "econ" in topic_or_paper.lower() or "gs3" in topic_or_paper.lower() else "GS2_POLITY"
        anchors = cls.ANCHORS.get(key, cls.ANCHORS["GS2_POLITY"])
        
        text = "### CALIBRATED GRADING BENCHMARKS (FEW-SHOT ANCHORS):\n"
        for a in anchors:
            text += f"- **Tier {a['score_tier']}**:\n"
            text += f"  - Criteria: {a['characteristics']}\n"
            text += f"  - Reference Benchmark: \"{a['sample_excerpt']}\"\n\n"
        return text
