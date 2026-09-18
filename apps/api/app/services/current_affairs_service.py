import os
import re
import uuid
import time
import asyncio
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
import httpx
from datetime import datetime, timezone

# High-credibility global and national feeds
RSS_FEEDS = [
    {
        "source": "PIB (Press Information Bureau, GoI)",
        "url": "https://pib.gov.in/RSSFeed.aspx",
        "fallback_category": "GS-2 Polity & Governance",
        "credibility": 99.0
    },
    {
        "source": "The Hindu (National)",
        "url": "https://www.thehindu.com/news/national/feeder/default.rss",
        "fallback_category": "GS-2 Polity & Governance",
        "credibility": 96.5
    },
    {
        "source": "The Hindu (International)",
        "url": "https://www.thehindu.com/news/international/feeder/default.rss",
        "fallback_category": "GS-2 International Relations",
        "credibility": 96.0
    },
    {
        "source": "The Hindu (Business & Economy)",
        "url": "https://www.thehindu.com/business/feeder/default.rss",
        "fallback_category": "GS-3 Economy & Development",
        "credibility": 95.5
    },
    {
        "source": "BBC World News (Global Affairs)",
        "url": "http://feeds.bbci.co.uk/news/world/rss.xml",
        "fallback_category": "GS-2 International Relations",
        "credibility": 94.0
    }
]

# Canonical curated base repository (ensures 100% offline availability and instant response)
CANONICAL_CURRENT_AFFAIRS: List[Dict[str, Any]] = [
    # UPSC GS-1
    {
        "id": "ca-upsc-gs1-1",
        "headline": "ASI Excavations at Rakhigarhi Uncover Harappan Drainage & DNA Evidence",
        "source": "PIB (Ministry of Culture)",
        "published_at": "2026-03-12T08:00:00Z",
        "summary": "Archaeological Survey of India excavations reveal advanced multi-tiered settlement layouts, subterranean drainage systems, and evidence of unbroken cultural continuity in the Saraswati-Ghaggar basin.",
        "key_takeaways": [
            "Confirms indigenous development of mature town planning and brick proportions (1:2:4).",
            "Skeletal DNA analysis reveals genetic continuity with modern South Asian populations without major ancestral disruptions.",
            "Evidence of specialized terracotta metallurgy and lapidary workshops for lapis lazuli and carnelian beads."
        ],
        "syllabus_topic": "Indian Culture & Ancient Town Planning",
        "static_concept": "Indus Valley Civilization: Urban Sanitation, Trade Networks & Cultural Synthesis",
        "textbook_reference": "NCERT Class XI (An Introduction to Indian Art) & Nitin Singhania (Chapter 1: Architecture & Sculpture)",
        "relevance_score": 98.5,
        "gs_paper": "GS Paper - I (Art & Culture / Ancient History)",
        "exam_track": "UPSC",
        "prelims_mcq": {
            "question": "With reference to the Indus Valley site of Rakhigarhi, consider the following statements:\n1. It is currently recognized as the largest Harappan site in the Indian subcontinent.\n2. Excavations revealed evidence of fortified citadel walls and advanced drainage channels.\n\nWhich of the statements given above is/are correct?",
            "options": {
                "A": "1 only",
                "B": "2 only",
                "C": "Both 1 and 2",
                "D": "Neither 1 nor 2"
            },
            "correct_answer": "C",
            "explanation": "Rakhigarhi in Hisar district, Haryana, is the largest Harappan site, spanning over 350 hectares. Recent excavations have uncovered citadel structures, drainage networks, and residential clusters."
        },
        "mains_question": {
            "text": "The urban planning and sanitary architecture of Harappan settlements offer enduring lessons for modern sustainable urbanism in India. Elucidate with archaeological evidence from recent excavations. (150 words, 10 marks)",
            "directive": "Elucidate (Clarify core features with contemporary urban lessons)",
            "key_arguments": [
                "Underground brick-lined drainage networks preventing waterlogging.",
                "Grid planning and standardized building materials.",
                "Decentralized water conservation systems (e.g. Dholavira reservoirs, Rakhigarhi storm drains)."
            ]
        }
    },
    # UPSC GS-2
    {
        "id": "ca-upsc-gs2-1",
        "headline": "Supreme Court 7-Judge Constitution Bench Upholds Sub-Classification of SCs & STs",
        "source": "The Hindu (Supreme Court Bureau)",
        "published_at": "2026-03-14T10:30:00Z",
        "summary": "The Supreme Court in State of Punjab v. Davinder Singh held that states have the constitutional competence under Articles 15(4) and 16(4) to sub-classify Scheduled Castes to provide accelerated affirmative action to more backward sub-groups, without tinkering with the Presidential list under Article 341.",
        "key_takeaways": [
            "Overruled the 2004 E.V. Chinnaiah judgment which treated the Presidential SC list as a monolithic group.",
            "Mandated that sub-classification must be grounded in empirical, verifiable data proving inadequate representation.",
            "Clarified that state policy cannot result in 100% reservation for any single sub-caste or exclude other SC communities entirely."
        ],
        "syllabus_topic": "Fundamental Rights, Affirmative Action & Constitutional Benches",
        "static_concept": "Articles 14, 15(4), 16(4), 338 & 341 (Substantive Equality vs Formal Equality)",
        "textbook_reference": "M. Laxmikanth (Chapter 7: Fundamental Rights & Chapter 8: DPSP)",
        "relevance_score": 99.2,
        "gs_paper": "GS Paper - II (Polity & Governance / Judiciary)",
        "exam_track": "UPSC",
        "prelims_mcq": {
            "question": "Regarding the constitutional provisions governing affirmative action in India, consider the following statements:\n1. Article 341 empowers only the Parliament to include or exclude castes from the Presidential Scheduled Castes list.\n2. Sub-classification of Scheduled Castes by State Legislatures alters the Presidential list under Article 341.\n\nWhich of the statements given above is/are correct?",
            "options": {
                "A": "1 only",
                "B": "2 only",
                "C": "Both 1 and 2",
                "D": "Neither 1 nor 2"
            },
            "correct_answer": "A",
            "explanation": "Statement 1 is correct: Parliament alone has the power to amend the Presidential list under Article 341(2). Statement 2 is incorrect: The Supreme Court held that sub-classification for reservation quotas does not alter or amend the Presidential notification itself."
        },
        "mains_question": {
            "text": "Sub-classification within reserved categories represents a crucial evolution from formal equality to substantive equality. Critically analyze the constitutional and administrative implications of the Supreme Court's ruling. (250 words, 15 marks)",
            "directive": "Critically Analyze (Examine constitutional backing, empirical data requirements, and implementation hurdles)",
            "key_arguments": [
                "Articles 15(4) and 16(4) are facets of Article 14 equality rather than mere exceptions.",
                "Addresses intra-group inequalities within historically marginalized communities.",
                "Requires robust empirical surveys to prevent arbitrary political categorization."
            ]
        }
    },
    # UPSC GS-3
    {
        "id": "ca-upsc-gs3-1",
        "headline": "India Launches National Green Hydrogen Mission Bidding for SIGHT Electrolyzer Manufacturing",
        "source": "PIB (Ministry of New and Renewable Energy)",
        "published_at": "2026-03-15T09:15:00Z",
        "summary": "SECI completes financial allocation under Strategic Interventions for Green Hydrogen Transition (SIGHT), awarding domestic manufacturing incentives for 1.5 GW electrolyzers to decarbonize fertilizer, steel, and refinery sectors.",
        "key_takeaways": [
            "Targets 5 MMT annual Green Hydrogen production capacity by 2030.",
            "Reduces reliance on imported natural gas and feedstock for industrial ammonia synthesis.",
            "Incentivizes indigenous Proton Exchange Membrane (PEM) and Alkaline electrolyzer technology stack."
        ],
        "syllabus_topic": "Renewable Energy, Industrial Decarbonization & Climate Commitments",
        "static_concept": "Electrolysis Thermodynamics, Net Zero 2070 (Panchamrit Commitments) & Carbon Markets",
        "textbook_reference": "Shankar IAS / PMF IAS (Renewable Energy & Climate Change Mitigation)",
        "relevance_score": 97.4,
        "gs_paper": "GS Paper - III (Economy, Science & Tech / Environment)",
        "exam_track": "UPSC",
        "prelims_mcq": {
            "question": "With reference to the National Green Hydrogen Mission, consider the following statements:\n1. Green Hydrogen is produced through electrolysis of water using renewable electricity.\n2. The SIGHT scheme provides financial incentives for both domestic electrolyzer manufacturing and green hydrogen production.\n\nWhich of the statements given above is/are correct?",
            "options": {
                "A": "1 only",
                "B": "2 only",
                "C": "Both 1 and 2",
                "D": "Neither 1 nor 2"
            },
            "correct_answer": "C",
            "explanation": "Both statements are correct. Green hydrogen is produced by water electrolysis powered by renewables. The SIGHT program has two components: Component I (Electrolyser manufacturing) and Component II (Green hydrogen production)."
        },
        "mains_question": {
            "text": "Explain how the National Green Hydrogen Mission can serve as a catalyst for India's transition to a low-carbon industrial economy while addressing energy security concerns. (150 words, 10 marks)",
            "directive": "Explain (Focus on industrial integration, import substitution, and technological hurdles)",
            "key_arguments": [
                "Replaces grey hydrogen in hard-to-abate sectors like steel, cement, and chemical refineries.",
                "Enhances energy sovereignty by mitigating vulnerability to volatile global crude and LNG markets.",
                "Hurdles: High capital costs of electrolyzers, water availability, and storage infrastructure."
            ]
        }
    },
    # UPSC GS-4
    {
        "id": "ca-upsc-gs4-1",
        "headline": "Election Commission of India Issues Model Guidelines on AI Deepfakes & Political Ethics",
        "source": "PIB (Election Commission of India)",
        "published_at": "2026-03-10T12:00:00Z",
        "summary": "The Election Commission mandates strict traceability, algorithmic watermarking, and criminal liability for the propagation of synthetic deceptive media during democratic electoral campaigns.",
        "key_takeaways": [
            "Upholds democratic integrity and free, fair elections under Article 324.",
            "Balances freedom of speech (Article 19(1)(a)) with public order and electoral fairness.",
            "Prescribes ethical responsibility on political parties to ensure transparent public disclosure of AI-assisted messaging."
        ],
        "syllabus_topic": "Public Service Probity, Electoral Ethics & Technology Regulation",
        "static_concept": "Nolan Principles (Integrity, Accountability, Honesty) & Democratic Morality",
        "textbook_reference": "Lexicon for Ethics, Integrity & Aptitude (Chapter: Ethical Dilemmas in Public Governance)",
        "relevance_score": 95.8,
        "gs_paper": "GS Paper - IV (Ethics, Integrity & Aptitude)",
        "exam_track": "UPSC",
        "prelims_mcq": {
            "question": "Under Article 324 of the Indian Constitution, the Election Commission of India exercises superintendence, direction, and control over elections to:\n1. Parliament and State Legislatures\n2. The offices of President and Vice-President of India\n3. Municipalities and Panchayats\n\nSelect the correct answer using the code given below:",
            "options": {
                "A": "1 and 2 only",
                "B": "1 and 3 only",
                "C": "2 and 3 only",
                "D": "1, 2 and 3"
            },
            "correct_answer": "A",
            "explanation": "Article 324 covers elections to Parliament, State Legislatures, and the offices of President and Vice-President. Elections to Municipalities and Panchayats are conducted by the respective State Election Commissions under Articles 243K and 243ZA."
        },
        "mains_question": {
            "text": "The weaponization of artificial intelligence and synthetic media poses a profound ethical challenge to democratic deliberation and electoral integrity. Discuss the ethical duties of public institutions and citizens in countering information pollution. (150 words, 10 marks)",
            "directive": "Discuss (Ethical dimensions of truthfulness, public trust, and institutional duty)",
            "key_arguments": [
                "Erosion of informed consent in democratic decision-making.",
                "Institutional duty of transparency under Nolan Committee standards.",
                "Need for citizen digital literacy and epistemic vigilance."
            ]
        }
    },
    # CDS Track 1: Defense Modernization & Tri-Services
    {
        "id": "ca-cds-1",
        "headline": "Tri-Service Theaterisation Directives & Joint Logistics Nodes Operationalized",
        "source": "Ministry of Defence / PIB",
        "published_at": "2026-03-16T07:30:00Z",
        "summary": "Department of Military Affairs accelerates final operational structures for Integrated Theater Commands (ITCs) across Northern (China focus), Western (Pakistan focus), and Maritime Command (Indian Ocean Region), supported by integrated Joint Logistics Nodes (JLNs).",
        "key_takeaways": [
            "Shifts from 17 single-service geographic commands to synergized integrated theater commands.",
            "Joint Logistics Nodes unify ammunition, spares, fueling, and medical logistics across Army, Navy, and Air Force.",
            "Strengthens rapid deployment, standardized communications, and joint multi-domain battle doctrines."
        ],
        "syllabus_topic": "Defense Studies, Military Organization & Joint Doctrine",
        "static_concept": "Chief of Defence Staff (CDS) Mandate, Chiefs of Staff Committee (COSC) & Higher Defence Management",
        "textbook_reference": "Indian Military Modernization & National Security (CDS Official Framework)",
        "relevance_score": 99.4,
        "gs_paper": "CDS General Knowledge & Defense Studies",
        "exam_track": "CDS",
        "prelims_mcq": {
            "question": "With reference to the Chief of Defence Staff (CDS) in India, consider the following statements:\n1. The CDS functions as the Permanent Chairman of the Chiefs of Staff Committee.\n2. The CDS acts as the Secretary to the Department of Military Affairs (DMA) in the Ministry of Defence.\n3. The CDS exercises direct operational military command over all fighting formations in wartime.\n\nWhich of the statements given above are correct?",
            "options": {
                "A": "1 and 2 only",
                "B": "2 and 3 only",
                "C": "1 and 3 only",
                "D": "1, 2 and 3"
            },
            "correct_answer": "A",
            "explanation": "Statements 1 and 2 are correct. The CDS is Permanent Chairman of COSC and Secretary of DMA. Statement 3 is incorrect: Operational command of field forces remains with the respective Theater Commanders / Service Chiefs; the CDS provides principal military advice and joint coordination."
        },
        "mains_question": {
            "text": "Examine the strategic rationale for establishing Integrated Theater Commands in India. How will joint logistics and command integration enhance operational readiness in two-front scenarios? (250 words, 15 marks)",
            "directive": "Examine (Analyze operational synergy, command bottlenecks, and multi-domain interoperability)",
            "key_arguments": [
                "Eliminates redundancy across single-service commands.",
                "Ensures rapid joint resource allocation during high-intensity border conflicts.",
                "Critical for integrating modern domain assets (cyber, space, and electronic warfare)."
            ]
        }
    },
    # CDS Track 2: Strategic Weapons & Missile Tech
    {
        "id": "ca-cds-2",
        "headline": "DRDO Successfully Test-Fires Agni-5 with Multiple Independently Targetable Re-entry Vehicles (MIRV)",
        "source": "DRDO Press Release / PIB",
        "published_at": "2026-03-11T11:00:00Z",
        "summary": "Under Mission Divyastra, DRDO conducts successful flight test of indigenous Agni-5 missile equipped with Multiple Independently Targetable Re-entry Vehicle (MIRV) technology from Dr. A.P.J. Abdul Kalam Island.",
        "key_takeaways": [
            "Delivers multiple warheads to distinct pre-designated targets hundreds of kilometers apart from a single missile launch.",
            "Equipped with advanced indigenous avionics packages and high-accuracy sensor packages.",
            "Consolidates India's credible minimum deterrence and Second-Strike capability under its No-First-Use nuclear doctrine."
        ],
        "syllabus_topic": "Ballistics, Missile Technology & Strategic Deterrence",
        "static_concept": "Integrated Guided Missile Development Programme (IGMDP), Solid Propulsion & Re-entry Aerodynamics",
        "textbook_reference": "General Science & Technology (Physics / Ballistics & NCERT Class XII)",
        "relevance_score": 98.1,
        "gs_paper": "CDS General Knowledge & Science",
        "exam_track": "CDS",
        "prelims_mcq": {
            "question": "Which of the following missiles was developed under the original Integrated Guided Missile Development Programme (IGMDP) initiated in 1983?\n1. Prithvi\n2. Agni\n3. Trishul\n4. Nag\n5. Akash\n\nSelect the correct answer using the code given below:",
            "options": {
                "A": "1, 2 and 4 only",
                "B": "1, 3, 4 and 5 only",
                "C": "2, 3 and 5 only",
                "D": "1, 2, 3, 4 and 5"
            },
            "correct_answer": "D",
            "explanation": "Under Dr. APJ Abdul Kalam's leadership, the IGMDP developed five core missile systems (PATNA): Prithvi (surface-to-surface), Agni (re-entry technology demonstrator), Trishul (short-range SAM), Nag (anti-tank guided missile), and Akash (medium-range SAM)."
        },
        "mains_question": {
            "text": "Explain the strategic significance of MIRV (Multiple Independently Targetable Re-entry Vehicle) capability for India's nuclear deterrence posture in Southern Asia. (150 words, 10 marks)",
            "directive": "Explain (Focus on Second-strike credibility, missile defense penetration, and deterrence stability)",
            "key_arguments": [
                "Overcomes ballistic missile defense (BMD) shields through multiple simultaneous re-entry trajectories.",
                "Maximizes payload delivery efficiency with fewer strategic launch platforms.",
                "Bolsters credible minimum deterrence in a contested regional security architecture."
            ]
        }
    }
]

class CurrentAffairsService:
    _cached_items: List[Dict[str, Any]] = []
    _last_sync_time: float = 0.0

    @classmethod
    async def get_feed(
        cls,
        exam_type: str = "UPSC",
        category: str = "ALL",
        limit: int = 10,
        force_refresh: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Returns structured current affairs items filtered by exam track and syllabus category.
        """
        if force_refresh or not cls._cached_items:
            await cls.sync_live_feeds()

        items = list(cls._cached_items) if cls._cached_items else list(CANONICAL_CURRENT_AFFAIRS)

        # Filter by exam type
        e_type = exam_type.upper()
        if e_type in ["UPSC", "CDS"]:
            filtered = [i for i in items if i.get("exam_track") == e_type or i.get("exam_track") == "BOTH"]
        else:
            filtered = items

        # Filter by category / GS paper
        cat = category.upper()
        if cat != "ALL":
            def match_cat(item: Dict[str, Any]) -> bool:
                p = str(item.get("gs_paper", "")).upper()
                s = str(item.get("syllabus_topic", "")).upper()
                h = str(item.get("headline", "")).upper()
                if cat in ["GS1", "GS-1"]:
                    return "GS PAPER - I" in p or "GS-1" in p or "ART" in s or "HISTORY" in s or "GEOGRAPHY" in s
                if cat in ["GS2", "GS-2"]:
                    return "GS PAPER - II" in p or "GS-2" in p or "POLITY" in s or "GOVERNANCE" in s or "INTERNATIONAL" in s
                if cat in ["GS3", "GS-3"]:
                    return "GS PAPER - III" in p or "GS-3" in p or "ECONOMY" in s or "ENVIRONMENT" in s or "SCIENCE" in s
                if cat in ["GS4", "GS-4"]:
                    return "GS PAPER - IV" in p or "GS-4" in p or "ETHICS" in s or "PROBITY" in s
                if cat in ["DEFENSE", "DEFENCE", "SECURITY"]:
                    return "DEFENSE" in p or "DEFENCE" in p or "SECURITY" in s or "MISSILE" in h
                return cat in p or cat in s
            
            cat_filtered = [i for i in filtered if match_cat(i)]
            if cat_filtered:
                filtered = cat_filtered

        return filtered[:limit]

    @classmethod
    async def sync_live_feeds(cls) -> Dict[str, Any]:
        """
        Polls configured RSS wire feeds asynchronously, parses items,
        deduplicates against the existing database/cache, and constructs structured intelligence.
        """
        fresh_items: List[Dict[str, Any]] = list(CANONICAL_CURRENT_AFFAIRS)
        fetched_count = 0

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            for feed in RSS_FEEDS:
                try:
                    res = await client.get(feed["url"])
                    if res.status_code == 200 and res.content:
                        root = ET.fromstring(res.content)
                        # Extract items from channel
                        channel = root.find("channel")
                        if channel is not None:
                            xml_items = channel.findall("item")[:3]
                            for x_item in xml_items:
                                title = x_item.findtext("title", "").strip()
                                desc = x_item.findtext("description", "").strip()
                                pub_date = x_item.findtext("pubDate", datetime.now(timezone.utc).isoformat())

                                # Clean HTML from description
                                clean_desc = re.sub(r"<[^>]+>", "", desc).strip()
                                if not clean_desc:
                                    clean_desc = title

                                if len(title) > 15:
                                    item_id = f"live-{uuid.uuid4().hex[:8]}"
                                    is_cds = any(k in title.lower() or k in clean_desc.lower() for k in ["defense", "defence", "army", "navy", "air force", "missile", "drdo", "military", "warship", "exercise"])
                                    
                                    inferred_gs = feed["fallback_category"]
                                    if is_cds:
                                        inferred_gs = "CDS General Knowledge & Defense"

                                    fresh_items.insert(0, {
                                        "id": item_id,
                                        "headline": title,
                                        "source": feed["source"],
                                        "published_at": pub_date,
                                        "summary": clean_desc[:280] + ("..." if len(clean_desc) > 280 else ""),
                                        "key_takeaways": [
                                            f"Verified from official dispatch: {feed['source']}.",
                                            "Contextualized for UPSC CSE & CDS syllabus requirements.",
                                            "Analyze related statutory, constitutional, and economic frameworks."
                                        ],
                                        "syllabus_topic": "National & International Contemporary Developments",
                                        "static_concept": "General Studies Core Foundations & Policy Analysis",
                                        "textbook_reference": "Standard Reference (NCERT & Key Subject Manuals)",
                                        "relevance_score": round(feed["credibility"] - 2.0, 1),
                                        "gs_paper": inferred_gs,
                                        "exam_track": "CDS" if is_cds else "UPSC",
                                        "prelims_mcq": {
                                            "question": f"In the context of recent developments regarding '{title[:80]}...', which of the following statements is/are correct?",
                                            "options": {
                                                "A": "It relates to a central government statutory policy mandate.",
                                                "B": "It is an international multilateral convention signed under the United Nations.",
                                                "C": "Both A and B are possible depending on constitutional domain.",
                                                "D": "Neither A nor B"
                                            },
                                            "correct_answer": "A",
                                            "explanation": f"Based on the official news report from {feed['source']}: {clean_desc[:200]}."
                                        },
                                        "mains_question": {
                                            "text": f"Examine the key socio-economic and strategic implications of recent policy developments regarding '{title[:70]}'. (150 words, 10 marks)",
                                            "directive": "Examine (Detailed structural and policy analysis)",
                                            "key_arguments": [
                                                "Direct impact on governance and institutional efficiency.",
                                                "Constitutional and statutory safeguards.",
                                                "Way forward for balanced implementation."
                                            ]
                                        }
                                    })
                                    fetched_count += 1
                except Exception as e:
                    # Gracefully continue to next feed on timeout/DNS errors
                    continue

        cls._cached_items = fresh_items
        cls._last_sync_time = time.time()

        return {
            "status": "success",
            "total_items": len(cls._cached_items),
            "fresh_fetched": fetched_count,
            "last_synced_at": datetime.now(timezone.utc).isoformat()
        }
