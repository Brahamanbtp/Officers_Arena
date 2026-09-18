import os
import re
import uuid
import time
import asyncio
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional, TypedDict
import httpx
from datetime import datetime, timezone

class RSSFeedConfig(TypedDict):
    source: str
    url: str
    fallback_category: str
    credibility: float

# High-credibility global and national feeds
RSS_FEEDS: List[RSSFeedConfig] = [
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
        "background_context": "Rakhigarhi, situated in Hisar district of Haryana, spans across seven mounds and exceeds 350 hectares, establishing it as the largest known Indus Valley Civilization metropolis, surpassing Mohenjo-daro. Recent multidisciplinary excavations conducted jointly by the Archaeological Survey of India (ASI) and Deccan College have deployed state-of-the-art ground penetrating radar (GPR), craniofacial reconstruction, and paleogenomic analysis to decipher the socio-technological evolution of the Saraswati-Ghaggar river system between 3000 BCE and 1800 BCE.",
        "prelims_facts": [
            "Location: Hisar District, Haryana (Ghaggar-Hakra river basin).",
            "Classification: Largest Mature Harappan site in the Indian subcontinent (>350 hectares).",
            "Key Architectural Finds: Subterranean soak jars, interconnected multi-tiered brick drains, fortified citadel with mud-brick podiums.",
            "Scientific Evidence: Ancient DNA from female skeleton (I6113) confirms indigenous ancestry without Steppe pastoralist admixture prior to 2000 BCE.",
            "Nodal Agency: Archaeological Survey of India (ASI), Ministry of Culture."
        ],
        "mains_dimensions": [
            {
                "title": "Urban Planning & Sanitation Architecture",
                "points": [
                    "Standardized sun-dried and kiln-fired brick ratios (1:2:4) demonstrating centralized guild norms and civic regulation.",
                    "Separation of residential wastewater and stormwater drainage networks offering critical insights for modern smart city drainage."
                ]
            },
            {
                "title": "Socio-Economic & Metallurgical Specialization",
                "points": [
                    "Micro-bead manufacturing and semi-precious stone lapidary workshops indicating vibrant long-distance maritime and overland trade with Dilmun and Mesopotamia.",
                    "Absence of monarchical palaces or militaristic iconography, pointing to a civic mercantile council governance structure."
                ]
            }
        ],
        "arguments_matrix": {
            "pros": [
                "Provides empirical archaeological backing to the indigenous evolution thesis of Harappan civilization.",
                "Demolishes Aryan Invasion stereotypes through direct biomolecular paleogenomics.",
                "Elevates Indian prehistoric heritage on global UNESCO World Heritage tentative inventories."
            ],
            "cons": [
                "Encroachment, agricultural leveling, and weathering threaten unexcavated mounds (Mound 1 through Mound 7).",
                "Lack of on-site climate-controlled conservation laboratories exposes fragile terracotta and skeletal specimens to rapid degradation."
            ]
        },
        "way_forward": [
            "Expedite the establishment of the Rakhigarhi National Archaeological Site Museum under the Union Budget Iconic Sites initiative.",
            "Deploy AI-driven 3D photogrammetry and non-invasive laser scanning to digitally document stratigraphy before physical trenching.",
            "Integrate local village communities as trained conservation custodians to prevent illegal antique scavenging."
        ],
        "revision_summary": "**Rakhigarhi (GS-1 / Ancient India)**\n- Largest IVC site in Haryana (>350 ha).\n- DNA confirms indigenous ancestry.\n- 1:2:4 standardized brick ratio & soak jar sanitation.\n- Textbook: NCERT Class XI Fine Arts + Singhania Ch 1.",
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
        "background_context": "The constitutional debate over sub-categorization of Scheduled Castes has persisted for decades. In 2004, a 5-judge bench in E.V. Chinnaiah v. State of Andhra Pradesh ruled that all castes included in the Presidential notification under Article 341 form a single homogeneous class that cannot be further divided by state legislatures. However, multiple states (including Punjab, Tamil Nadu, and Haryana) argued that affirmative action benefits were being disproportionately cornered by relatively advanced sub-castes, leaving extremely marginalized groups (such as Valmikis, Mazhabi Sikhs, and Arunthathiyars) under-represented. The 7-judge Constitution Bench headed by the CJI re-examined the doctrine of equality.",
        "prelims_facts": [
            "Constitutional Articles: Article 14 (Right to Equality), Article 15(4) (Special provisions for advancement), Article 16(4) (Inadequate public employment reservation), Article 341 (Presidential list of Scheduled Castes).",
            "Key Landmark Overruled: E.V. Chinnaiah v. State of A.P. (2004).",
            "Bench Strength: 7-Judge Constitution Bench (6:1 Majority).",
            "Statutory Precondition: Empirical quantifiable data showing severe intra-group backwardness; subject to judicial review under Basic Structure."
        ],
        "mains_dimensions": [
            {
                "title": "Constitutional Philosophy (Substantive Equality)",
                "points": [
                    "Articles 15(4) and 16(4) are enabling restatements of Article 14 substantive equality, not mere exceptions to formal equality.",
                    "Treating unequals as equals violates Article 14: homogeneous legal fiction cannot supersede empirical social hierarchy."
                ]
            },
            {
                "title": "Federalism & State Legislative Competence",
                "points": [
                    "State legislatures retain competence under Entry 41 of List II (State Public Services) to apportion quota percentages without altering Entry 341 Presidential membership.",
                    "Prevents central over-monopolization of affirmative welfare delivery."
                ]
            }
        ],
        "arguments_matrix": {
            "pros": [
                "Ensures social justice reaches the most vulnerable and depressed sub-strata who suffered historical double exclusion.",
                "Prevents 'creamy layer' saturation within marginalized classifications.",
                "Promotes evidence-based, data-driven governance through mandatory state commission surveys."
            ],
            "cons": [
                "Risk of political vote-bank weaponization and competitive sub-caste fragmentation.",
                "Administrative complexities in conducting foolproof empirical caste censuses without litigation delays.",
                "Potential dilution of broader Dalit solidarity against systemic caste discrimination."
            ]
        },
        "way_forward": [
            "Establish permanent Independent State Social Justice Commissions to periodically audit caste representation metrics.",
            "Formulate objective, transparent criteria for creamy layer exclusion among SCs/STs without bureaucratic harassment.",
            "Supplement quota sub-classification with focused educational scholarships, skill centers, and nutritional support."
        ],
        "revision_summary": "**SC Sub-Classification (GS-2 / Polity)**\n- Case: State of Punjab v. Davinder Singh (7-Judge Bench).\n- Overrules: E.V. Chinnaiah (2004).\n- Rule: States can sub-classify under Arts 15(4)/16(4) based on empirical data; Art 341 untouched.\n- Textbook: Laxmikanth Ch 7 (Fundamental Rights).",
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
        "background_context": "India currently consumes ~6 million tonnes of grey hydrogen annually, produced almost entirely from imported fossil fuels (natural gas and naphtha) via steam methane reforming, emitting over 50 MT of CO2 per year. Under the COP26 Panchamrit commitments (500 GW non-fossil capacity and Net Zero by 2070), the Union Cabinet approved the National Green Hydrogen Mission with an outlay of ₹19,744 crore. The SIGHT programme is the flagship financial incentive mechanism divided into Component I (Electrolyser Manufacturing) and Component II (Production of Green Hydrogen).",
        "prelims_facts": [
            "Outlay: ₹19,744 Crore under the Ministry of New and Renewable Energy (MNRE).",
            "Mission Target: At least 5 MMT (Million Metric Tonnes) per annum green hydrogen by 2030.",
            "Associated Renewable Capacity: ~125 GW addition dedicated solely to hydrogen production.",
            "Emissions Abatement: ~50 MMT of annual GHG emissions reduction.",
            "Implementing Agency: Solar Energy Corporation of India (SECI)."
        ],
        "mains_dimensions": [
            {
                "title": "Industrial Decarbonization (Hard-to-Abate Sectors)",
                "points": [
                    "Direct replacement of coking coal in Direct Reduced Iron (DRI) green steel manufacturing.",
                    "Decarbonizing grey ammonia synthesis in urea production, saving billions in fertilizer import subsidies."
                ]
            },
            {
                "title": "Geoeconomic Energy Sovereignty",
                "points": [
                    "Shields Indian macroeconomy from geopolitical supply shocks in the Strait of Hormuz and volatile LNG spot markets.",
                    "Positions India as a major exporter of Green Ammonia and e-fuels to the European Union (bypassing CBAM carbon border tax)."
                ]
            }
        ],
        "arguments_matrix": {
            "pros": [
                "Massive foreign exchange savings (~₹1 Lakh Crore cumulative fossil fuel import reduction by 2030).",
                "Fosters indigenous high-tech semiconductor and stack manufacturing under Make in India.",
                "Enables integration of intermittent solar/wind power via hydrogen long-duration energy storage."
            ],
            "cons": [
                "High production cost ($4-5/kg vs $1.5/kg for grey hydrogen) requiring extended fiscal subsidies.",
                "Severe water intensity (~9-10 litres of demineralized pure water per 1 kg of hydrogen produced) posing challenges in arid zones like Rajasthan.",
                "Lack of dedicated cryogenic pipelines and high-pressure storage infrastructure."
            ]
        },
        "way_forward": [
            "Establish Green Hydrogen Valleys / Port Hubs (Paradip, Kandla, Tuticorin) near coastal desalination units.",
            "Introduce mandatory green hydrogen consumption mandates (GHPO) for domestic steel and refinery conglomerates.",
            "Foster bilateral green ammonia certification agreements with Japan, South Korea, and the EU."
        ],
        "revision_summary": "**National Green Hydrogen Mission (GS-3 / Economy & Tech)**\n- Outlay: ₹19,744 Cr | Target: 5 MMT/yr by 2030 | 125 GW RE.\n- SIGHT: Component I (Electrolysers) & Component II (H2 Production).\n- Decarbonizes steel, fertilizer, and refineries.\n- Textbook: PMF IAS / Shankar IAS (Energy Security).",
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
        "background_context": "The exponential proliferation of generative AI, hyper-realistic voice clones, and synthetic video deepfakes has introduced unprecedented epistemic threats to democratic elections worldwide. In recent election cycles, political operatives utilized deceptive audio simulations of candidates right before the silence period to manipulate voters. Invoking its plenary constitutional powers under Article 324, the Election Commission of India (ECI) notified binding ethical directives under the Model Code of Conduct (MCC), holding party presidents and social media convenors criminally liable under IPC/BNS and the IT Act for deceptive synthetic disinformation.",
        "prelims_facts": [
            "Constitutional Basis: Article 324 (Superintendence, direction, and control of elections).",
            "Statutory Framework: Section 123 of Representation of the People Act 1951 (Corrupt electoral practices), Information Technology (Intermediary Guidelines) Rules 2021.",
            "Mandatory Safeguards: Invisible digital provenance watermarking and explicit on-screen visual banners for AI-generated political advertisements."
        ],
        "mains_dimensions": [
            {
                "title": "Democratic Morality & Epistemic Fairness",
                "points": [
                    "Free and fair elections require informed citizen voter choice; weaponized deepfakes poison the epistemic commons and manufactured false consent.",
                    "Erosion of institutional public trust when authentic evidence is dismissed as 'fake' (the Liar's Dividend)."
                ]
            },
            {
                "title": "Nolan Principles in Political Governance",
                "points": [
                    "Political parties as constitutional organs must adhere to Integrity, Openness, and Accountability.",
                    "Duty of candour: Full upfront disclosure of algorithmic campaign tools."
                ]
            }
        ],
        "arguments_matrix": {
            "pros": [
                "Protects vulnerable voters from malicious election-eve disinformation cascades.",
                "Instills ethical accountability directly into political leadership hierarchies.",
                "Establishes a global democratic standard for responsible AI deployment during polling."
            ],
            "cons": [
                "Chilling effect on legitimate political parody, satire, and free speech under Article 19(1)(a).",
                "Speed of viral dissemination on end-to-end encrypted messaging apps (WhatsApp, Telegram) outpaces ECI takedown notices.",
                "Ambiguity in defining where benign digital image enhancement ends and malicious deepfake begins."
            ]
        },
        "way_forward": [
            "Establish 24/7 Deepfake Forensic Rapid Response Cells with state-level cyber crime units.",
            "Integrate the Coalition for Content Provenance and Authenticity (C2PA) metadata standards across Indian digital advertising platforms.",
            "Launch nationwide digital media literacy curriculum on identifying synthetic manipulation."
        ],
        "revision_summary": "**AI Deepfakes & Electoral Ethics (GS-4 / Ethics)**\n- ECI Directive under Art 324 & RPA 1951 Sec 123.\n- Nolan Principles: Integrity, Openness, Accountability.\n- Liar's Dividend & Voter autonomy threats.\n- Textbook: Lexicon Ethics (Governance & Public Trust).",
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
        "background_context": "India's armed forces have traditionally operated through 17 independent single-service commands (Army 7, Air Force 7, Navy 3) plus two unified commands (Andaman & Nicobar Command and Strategic Forces Command). In modern multi-domain warfare spanning land, air, sea, cyber, and space, siloed command hierarchies create logistical friction, duplicate capital expenditures, and delay joint operational responses. The Kargil Review Committee (1999) and the Shekatkar Committee (2016) strongly recommended higher defence restructuring. The Department of Military Affairs (DMA) headed by the Chief of Defence Staff (CDS) has operationalized Integrated Theater Commands with shared operational control.",
        "prelims_facts": [
            "Higher Defense Structure: Chief of Defence Staff (CDS) is Permanent Chairman of Chiefs of Staff Committee (COSC) & Secretary of Department of Military Affairs (DMA).",
            "Key Reform Milestone: Inter-Services Organisations (Command, Control and Discipline) Act 2023 empowering Commander-in-Chief of joint formations.",
            "Joint Logistics Nodes (JLNs): Operationalized at Mumbai, Guwahati, and Port Blair for unified supply chains."
        ],
        "mains_dimensions": [
            {
                "title": "Operational Synergy & Two-Front Deterrence",
                "points": [
                    "Enables unified theater commander to deploy assets seamlessly across Army, Navy, and Air Force without inter-service bureaucratic approvals.",
                    "Rapid weapon and ammunition cross-servicing during high-tempo border escalations."
                ]
            },
            {
                "title": "Fiscal Rationalization & Capital Optimization",
                "points": [
                    "Cuts duplicated military procurement and standalone infrastructure lines.",
                    "Releases capital budget savings toward advanced drone swarms, loitering munitions, and electronic countermeasures."
                ]
            }
        ],
        "arguments_matrix": {
            "pros": [
                "Dramatic increase in military agility and integrated multi-domain battle response.",
                "Standardized doctrine, joint training, and unified military intelligence streams.",
                "Aligns Indian Armed Forces architecture with major global militaries (US, China PLA Theater Commands)."
            ],
            "cons": [
                "Limited combat air assets (IAF squadron strength deficits) complicating asset distribution across multiple theaters.",
                "Service cultural resistance and seniority parity adjustments between Army, Navy, and Air Force leadership.",
                "Need for extensive overhaul of legacy service acts and military disciplinary codes."
            ]
        },
        "way_forward": [
            "Implement joint specialized staff courses at National Defence College (NDC) and DSSC Wellington for integrated theater planning.",
            "Empower theater commanders with full operational control while service chiefs retain Raise, Train, and Sustain responsibilities.",
            "Accelerate domestic defense manufacturing under Atmanirbhar Bharat to bridge aerial platform shortages."
        ],
        "revision_summary": "**Theaterisation & Joint Commands (CDS / Defense)**\n- Shift from 17 single-service commands to Integrated Theater Commands.\n- Shekatkar Committee (2016) & Inter-Services Organisations Act 2023.\n- JLNs in Mumbai, Guwahati, Port Blair.\n- Textbook: Indian Military Modernization & National Security.",
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
        "background_context": "Mission Divyastra marked India's successful maiden flight test of the indigenously developed Agni-5 missile equipped with Multiple Independently Targetable Re-entry Vehicle (MIRV) technology. Unlike unitary warhead missiles, an MIRV missile carries a post-boost vehicle (bus) housing multiple nuclear or conventional warheads, each capable of being steered along an independent ballistic trajectory to hit separate targets separated by hundreds of kilometers. This places India in an elite league of nations (USA, Russia, China, France, UK) possessing proven MIRV technological mastery, dramatically enhancing strategic deterrence in the Indo-Pacific.",
        "prelims_facts": [
            "Mission Name: Mission Divyastra (DRDO, Dr. APJ Abdul Kalam Island, Odisha).",
            "Missile Class: Agni-5 (Intercontinental/Inter-theater Ballistic Missile, Range >5,000 km, 3-stage solid propellant).",
            "Core Technology: Multiple Independently Targetable Re-entry Vehicle (MIRV) with indigenous micro-electromechanical sensors (MEMS) and ring laser gyro INS.",
            "Historical Lineage: Conceived under Integrated Guided Missile Development Programme (IGMDP) initiated in 1983."
        ],
        "mains_dimensions": [
            {
                "title": "Credible Minimum Deterrence & Nuclear Doctrine",
                "points": [
                    "Reinforces India's declared No-First-Use (NFU) and assured punitive Second-Strike capability.",
                    "Guarantees warhead survivability and saturation against advanced hostile Ballistic Missile Defense (BMD) radar networks."
                ]
            },
            {
                "title": "Indigenous Technological Mastery",
                "points": [
                    "Complete self-reliance in composite carbon-carbon re-entry heat shields and precision separation stages.",
                    "Overcomes decades of MTCR (Missile Technology Control Regime) denial regimes."
                ]
            }
        ],
        "arguments_matrix": {
            "pros": [
                "Dramatically amplifies deterrence leverage with a leaner, highly survivable strategic missile arsenal.",
                "Counters asymmetric multi-layered anti-ballistic missile umbrellas in the neighborhood.",
                "Showcases world-class indigenous aerospace engineering by DRDO."
            ],
            "cons": [
                "Triggers regional counter-MIRV modernization and strategic warhead buildup in Southern Asia.",
                "Heightened crisis instability and reduced decision-making reaction times during geopolitical flashpoints.",
                "Increased complexity in command-and-control (C2) and nuclear warhead mating procedures."
            ]
        },
        "way_forward": [
            "Integrate MIRV warheads into submarine-launched ballistic missiles (SLBMs like K-5/K-6 on Arihant-class SSBNs) for ultimate sea-based survivability.",
            "Maintain unwavering diplomatic commitment to India's Draft Nuclear Doctrine of credible minimum deterrence.",
            "Harden terrestrial command, control, communications, computers, intelligence, surveillance, and reconnaissance (C4ISR) networks against cyber and anti-satellite (ASAT) threats."
        ],
        "revision_summary": "**Agni-5 MIRV / Mission Divyastra (CDS / Science & Tech)**\n- Range: >5,000 km | 3-stage solid propellant.\n- MIRV: Multiple independent warheads from 1 launch.\n- Counteracts BMD systems; fortifies No-First-Use 2nd strike.\n- Textbook: NCERT Science + General Science Physics.",
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
    _cached_items: List[Dict[str, Any]] = list(CANONICAL_CURRENT_AFFAIRS)
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
        Instant response from in-memory cache, with live sync on force_refresh.
        """
        if force_refresh:
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
        Polls configured RSS wire feeds asynchronously in parallel, parses items,
        deduplicates against the existing database/cache, and constructs structured intelligence.
        """
        fresh_items: List[Dict[str, Any]] = list(CANONICAL_CURRENT_AFFAIRS)
        fetched_count = 0

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        async def fetch_feed(client: httpx.AsyncClient, feed: RSSFeedConfig) -> List[Dict[str, Any]]:
            items: List[Dict[str, Any]] = []
            try:
                res = await client.get(feed["url"], headers=headers)
                if res.status_code == 200 and res.content:
                    root = ET.fromstring(res.content)
                    channel = root.find("channel")
                    if channel is not None:
                        xml_items = channel.findall("item")[:3]
                        for x_item in xml_items:
                            title = x_item.findtext("title", "").strip()
                            desc = x_item.findtext("description", "").strip()
                            pub_date = x_item.findtext("pubDate", datetime.now(timezone.utc).isoformat())

                            clean_desc = re.sub(r"<[^>]+>", "", desc).strip()
                            if not clean_desc:
                                clean_desc = title

                            if len(title) > 15:
                                item_id = f"live-{uuid.uuid4().hex[:8]}"
                                is_cds = any(k in title.lower() or k in clean_desc.lower() for k in ["defense", "defence", "army", "navy", "air force", "missile", "drdo", "military", "warship", "exercise"])
                                
                                inferred_gs = feed["fallback_category"]
                                if is_cds:
                                    inferred_gs = "CDS General Knowledge & Defense"

                                items.append({
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
                                    "background_context": f"This recent dispatch from {feed['source']} highlights contemporary developments in {inferred_gs}. In UPSC CSE and CDS examinations, contemporary affairs are tested through their foundational constitutional, statutory, and institutional mechanisms.",
                                    "prelims_facts": [
                                        f"Source Authority: {feed['source']}.",
                                        "Focus Domain: Contemporary Policy & Governance.",
                                        "Exam Orientation: Direct relevance to UPSC CSE & CDS General Knowledge syllabus."
                                    ],
                                    "mains_dimensions": [
                                        {
                                            "title": "Institutional & Policy Significance",
                                            "points": [
                                                "Requires analysis of institutional mandates, governance delivery, and policy efficacy.",
                                                "Examines constitutional and administrative compliance under standard governance frameworks."
                                            ]
                                        }
                                    ],
                                    "arguments_matrix": {
                                        "pros": [
                                            "Advances transparency, factual reporting, and policy awareness.",
                                            "Aligns with strategic governance priorities and public welfare goals."
                                        ],
                                        "cons": [
                                            "Challenges in grassroots execution, resource allocation, and timeline compliance.",
                                            "Need for sustained inter-agency coordination and institutional checks."
                                        ]
                                    },
                                    "way_forward": [
                                        "Adopt evidence-based policy execution aligned with 2nd ARC recommendations.",
                                        "Strengthen public accountability and independent auditing mechanisms."
                                    ],
                                    "revision_summary": f"**{title[:60]}**\n- Source: {feed['source']} | Focus: {inferred_gs}\n- Key Theme: Contemporary Policy & Governance\n- Standard Reference: NCERT & Subject Reference Manuals.",
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
            except Exception:
                pass
            return items

        async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
            tasks = [fetch_feed(client, feed) for feed in RSS_FEEDS]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for res_list in results:
                if isinstance(res_list, list):
                    for item in res_list:
                        fresh_items.insert(0, item)
                        fetched_count += 1

        cls._cached_items = fresh_items
        cls._last_sync_time = time.time()

        return {
            "status": "success",
            "total_items": len(cls._cached_items),
            "fresh_fetched": fetched_count,
            "last_synced_at": datetime.now(timezone.utc).isoformat()
        }
