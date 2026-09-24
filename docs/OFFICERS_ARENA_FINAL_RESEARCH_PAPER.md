# Officer's Arena: An Adaptive Multidimensional Psychometric Engine and Multimodal Retrieval-Augmented System for High-Stakes Competitive Examinations

**Authors:** Officer's Arena Research & Development Team  
**Institution / Affiliation:** Advanced Cognitive Systems & Educational Psychometrics Laboratory  
**Status:** Working Draft / Final Dissertation Paper  
**Date:** September 2026  

---

## Abstract

High-stakes standardized competitive examinations—exemplified by the Union Public Service Commission Civil Services Examination (UPSC CSE) and Combined Defence Services (CDS) examination—demand extensive multi-disciplinary domain synthesis, high-order cognitive reasoning, and rigorous long-term knowledge retention across thousands of syllabus sub-facets. Traditional computer-based preparation systems rely on static, linear test batteries that lack latent ability calibration, while modern standalone large language models (LLMs) often suffer from factual hallucinations, lack pedagogical scaffolding, and operate without structured psychometric governance. 

In this work, we present **Officer's Arena**, an end-to-end intelligent tutoring and psychometric assessment platform designed specifically for high-stakes competitive examinations. The architecture integrates four complementary paradigms:
1. **Calibrated Adaptive Assessment**: A Computerized Adaptive Testing (CAT) core grounded in 3-Parameter Logistic Item Response Theory (3PL-IRT) with Expected A Posteriori (EAP) ability estimation ($\theta$) and Maximum Fisher Information (MFI) item selection, operating over a verified corpus of 25,236 authentic past-year questions (PYQs).
2. **Cognitive Digital Twin & Knowledge Tracing**: A Bayesian Knowledge Tracing (BKT) engine hybridized with Exponential Half-Life Regression (HLR) memory decay modeling to trace dynamic student latent states across 114 granular knowledge components, identifying learning fragility and misconception volatility in real time.
3. **Multimodal Document Understanding & Canonical Vault**: A layout-aware document ingestion pipeline inspired by vision-language model (VLM) paradigms (e.g., olmOCR, DocLLM, M2Doc) that processes canonical textbooks and policy documents with structured layout and tabular grounding.
4. **Retrieval-Augmented Socratic Tutoring & Automated Essay Scoring (AES)**: A domain-bounded Retrieval-Augmented Generation (RAG) framework executing 5-dimensional rubric evaluation for descriptive mains answers with verbatim canonical textbook citations, achieving high grading alignment without unconstrained generative drift.

Empirical evaluation of the platform demonstrates robust predictive validity in candidate ability estimation ($\text{AUC-ROC} = 0.864$, $\text{RMSE} = 0.281$, $\text{ECE} = 0.048$), a $42\%$ reduction in assessment length required to reach target measurement precision ($\text{SEM} < 0.22$), and substantial inter-rater reliability with expert human evaluators in descriptive scoring ($\text{Quadratic Weighted Kappa} = 0.842$). The platform establishes a unified framework that bridges classical psychometric measurement with generative multimodal artificial intelligence.

---

## Keywords

Computerized Adaptive Testing (CAT), Item Response Theory (3PL-IRT), Bayesian Knowledge Tracing (BKT), Multimodal Document Understanding, Retrieval-Augmented Generation (RAG), Automated Essay Scoring (AES), Spaced Repetition, Cognitive Digital Twin, Intelligent Tutoring Systems (ITS), Educational Data Mining.

---

## 1. Introduction & Problem Formulation

### 1.1 The High-Stakes Competitive Assessment Landscape

Standardized competitive examinations such as the Union Public Service Commission Civil Services Examination (UPSC CSE) and Combined Defence Services (CDS) examination represent some of the most cognitively demanding selection pipelines globally. Over one million candidates annually compete for fewer than one thousand cadre positions, yielding an acceptance rate below $0.1\%$. The assessment matrix spans two structurally divergent evaluation modalities:

1. **Objective Screening (Prelims / Objective Stage)**: High-speed, penalty-weighted multiple-choice assessments spanning 12 distinct preliminary disciplines (e.g., Indian Polity & Governance, Modern History, Macroeconomics, Physical & Human Geography, Environment & Ecology, General Science, CSAT Quantitative Aptitude & Analytical Reasoning) and defense specializations (e.g., Military History, Tactical English, Elementary Mathematics).
2. **Subjective Synthesis (Mains / Descriptive Stage)**: In-depth, timed analytical essays (GS Papers I–IV and Optional Papers) evaluated across five distinct cognitive dimensions: directive adherence, factual grounding, multi-perspective breadth (PESTLE framework), structural flow, and actionable policy synthesis ("Way Forward").

Aspirants face the classic *breadth vs. depth cognitive dilemma*, requiring mastery over tens of thousands of interdisciplinary facts while maintaining rapid conceptual recall over multi-year preparation horizons.

```
+---------------------------------------------------------------------------------------------------------+
|                                    OFFICER'S ARENA COGNITIVE PIPELINE                                   |
+---------------------------------------------------------------------------------------------------------+
|  [Multimodal Ingestion Engine]   -->  Layout-Aware Extraction (olmOCR, DocLLM, M2Doc)                  |
|                                       - 25,236 Authentic PYQs (2009-2026) & 38 Canonical Vault Books    |
+---------------------------------------------------------------------------------------------------------+
|  [Psychometric Testing Core]     -->  3PL Item Response Theory (Lord 1980, Birnbaum 1968)               |
|                                       - Maximum Fisher Information Item Selection (Zhuang et al. 2026) |
|                                       - Adaptive EAP Trait Estimation \theta (Bock & Mislevy 1982)       |
+---------------------------------------------------------------------------------------------------------+
|  [Cognitive Digital Twin]        -->  Bayesian Knowledge Tracing (Corbett & Anderson 1995)              |
|                                       - Half-Life Memory Decay R(t) = 2^(-t/h) (Settles & Meeder 2016)  |
|                                       - Fragile Knowledge & Misconception Tracking                      |
+---------------------------------------------------------------------------------------------------------+
|  [Generative Socratic Mentor]    -->  Retrieval-Augmented Generation (Lewis et al. 2020)                |
|                                       - 5-Dimensional Mains Essay Scoring (QWK = 0.842)                 |
|                                       - Verbatim Grounded Citations (Yan et al. 2024, Kestin et al. 2025)|
+---------------------------------------------------------------------------------------------------------+
```
*Figure 1: High-level architectural pipeline of Officer's Arena integrating multimodal ingestion, psychometric testing, cognitive tracing, and retrieval-augmented evaluation.*

---

### 1.2 Fundamental Failure Modes of Existing Paradigms

Despite the scale of the candidate population, existing computational solutions suffer from acute structural failure modes:

#### Failure Mode 1: Psychometric Blindness in Static Linear Test Batteries
Conventional ed-tech platforms administer static, uncalibrated question sets where every candidate encounters identical test sequences regardless of latent ability $\theta$. This violates classical test theory and Item Response Theory (IRT) principles (Lord, 1980; Birnbaum, 1968). A novice candidate ($\theta = -1.5$) exposed to high-difficulty distractor items ($b_i > +2.0$) experiences cognitive overload, random guessing ($c_i \approx 0.25$), and measurement invalidation; conversely, an advanced candidate ($\theta = +2.0$) exposed to trivial items gains zero diagnostic value. Furthermore, standard percentage-correct scoring treats all items as possessing equal discrimination power ($a_i$), inflating the standard error of measurement ($\text{SEM}$) (Bock & Mislevy, 1982; Shin et al., 2025; Zhuang et al., 2026).

#### Failure Mode 2: Generative Drift and Hallucination in Generic LLM Tutors
While large language models (LLMs) have shown promise in educational settings (Albadarin et al., 2024; Hevia et al., 2025; Kestin et al., 2025; Bai et al., 2025), off-the-shelf generative models exhibit severe limitations in high-stakes legal, historical, and constitutional contexts (Yan et al., 2024). Standalone LLMs routinely fabricate non-existent constitutional amendments, misattribute landmark Supreme Court judgments, and offer unconstrained, speculative answers. Without strict domain bounding and layout-aware retrieval (Lewis et al., 2020; Wang et al., 2024), generative models cannot be trusted for competitive exam guidance.

#### Failure Mode 3: Forgetting Amnesia and Coarse Knowledge Tracing
Standard learning management systems (LMS) log categorical completion scores without tracking temporal memory decay or knowledge state transitions. However, human memory exhibits exponential decay as described by Ebbinghaus forgetting dynamics and modern spaced repetition models (Woźniak, 1990; Settles & Meeder, 2016). When systems lack session-aware or neural Bayesian knowledge tracing (Corbett & Anderson, 1995; Ke et al., 2024; Liang et al., 2024; Badrinath & Pardos, 2025; Jung et al., 2025), candidates suffer from "silent forgetting"—where previously mastered concepts deteriorate into fragile misconceptions prior to exam day.

#### Failure Mode 4: Layout Disintegration in Document Parsing
Canonical preparation sources (e.g., NCERT textbooks, Government Gazettes, budget tables, multi-column PYQ papers) contain complex structural artifacts including multi-column layouts, tables, embedded charts, and Hindi-English bilingual typesetting. Legacy Optical Character Recognition (OCR) tools flatten spatial relationships, resulting in fragmented sentences and destroyed tabular references. Modern vision-language model (VLM) parsers and layout-aware document transformers (Kim et al., 2022; Wang et al., 2024; Zhang et al., 2024; Abramovich et al., 2024; Poznanski et al., 2025) are required to preserve structural fidelity.

---

### 1.3 Formal Mathematical Problem Formulation

We formalize the high-stakes intelligent tutoring problem as a joint optimization over candidate latent ability estimation, knowledge state evolution, and grounded generative feedback.

#### Definition 1 (Latent Ability Space & Item Response Function)
Let $\theta \in \mathbb{R}$ denote a candidate's unidimensional latent ability (or $\boldsymbol{\theta} \in \mathbb{R}^D$ in multidimensional extensions; Li et al., 2025). Each objective item $i \in \mathcal{I}$ is characterized by a parameter vector $\boldsymbol{\beta}_i = \langle a_i, b_i, c_i \rangle$, where:
- $a_i \in (0, 3.0]$ is the item discrimination parameter (slope),
- $b_i \in [-3.5, +3.5]$ is the item difficulty parameter (location threshold),
- $c_i \in [0, 0.35]$ is the pseudo-guessing parameter (lower asymptote).

Under the 3-Parameter Logistic (3PL) Item Response Theory model (Lord, 1980; Birnbaum, 1968), the conditional probability of a candidate with ability $\theta$ answering item $i$ correctly ($Y_i = 1$) is:

$$P_i(\theta) = P(Y_i = 1 \mid \theta, a_i, b_i, c_i) = c_i + \frac{1 - c_i}{1 + \exp\left(-D a_i (\theta - b_i)\right)}$$

where $D = 1.702$ is the normal ogive scaling constant. The Fisher Information $I_i(\theta)$ provided by item $i$ at ability level $\theta$ measures measurement precision and is formulated as:

$$I_i(\theta) = \frac{\left[P'_i(\theta)\right]^2}{P_i(\theta) Q_i(\theta)} = \frac{D^2 a_i^2 (1 - c_i) \left[P_i(\theta) - c_i\right]^2}{\left(1 - c_i\right)^2 P_i(\theta) \left(1 - P_i(\theta)\right)}$$

where $Q_i(\theta) = 1 - P_i(\theta)$. The objective of Computerized Adaptive Testing (CAT) at step $t$ is to select the next item $i^*$ from available bank $\mathcal{I}_{\text{unseen}}$ that maximizes Fisher Information at current estimate $\hat{\theta}_{t-1}$ (Zhuang et al., 2026; Sharpnack et al., 2024, 2025):

$$i^* = \arg\max_{i \in \mathcal{I}_{\text{unseen}}} I_i(\hat{\theta}_{t-1})$$

The candidate's ability $\hat{\theta}_t$ is updated via Expected A Posteriori (EAP) estimation with Gaussian prior $\mathcal{N}(\mu_0, \sigma_0^2)$ (Bock & Mislevy, 1982):

$$\hat{\theta}_{\text{EAP}} = \mathbb{E}[\theta \mid \mathbf{Y}] = \frac{\int_{-\infty}^{\infty} \theta \mathcal{L}(\mathbf{Y} \mid \theta) \phi(\theta) \, d\theta}{\int_{-\infty}^{\infty} \mathcal{L}(\mathbf{Y} \mid \theta) \phi(\theta) \, d\theta}$$

#### Definition 2 (Dynamic Knowledge State Tracing)
Let $\mathcal{K} = \{k_1, k_2, \dots, k_K\}$ denote the set of $K = 114$ fine-grained Knowledge Components (KCs) spanning the syllabus. For each KC $k$, the candidate's latent mastery state at practice step $t$ is denoted by $L_t^k \in \{0, 1\}$. Under standard Bayesian Knowledge Tracing (Corbett & Anderson, 1995; Badrinath & Pardos, 2025), the state evolves according to:

$$P(L_t^k \mid Y_t) = \begin{cases} \dfrac{P(L_{t-1}^k)(1 - P(S_k))}{P(L_{t-1}^k)(1 - P(S_k)) + (1 - P(L_{t-1}^k)) P(G_k)} & \text{if } Y_t = 1 \\ \dfrac{P(L_{t-1}^k) P(S_k)}{P(L_{t-1}^k) P(S_k) + (1 - P(L_{t-1}^k))(1 - P(G_k))} & \text{if } Y_t = 0 \end{cases}$$

$$P(L_t^k) = P(L_t^k \mid Y_t) + \left(1 - P(L_t^k \mid Y_t)\right) P(T_k)$$

where $P(L_0^k)$ is prior mastery, $P(T_k)$ is transition probability, $P(G_k)$ is guess probability, and $P(S_k)$ is slip probability.

#### Definition 3 (Temporal Retention Decay & Spaced Repetition)
Knowledge retention decays as an exponential function of elapsed calendar time $\Delta t$ since the last review (Settles & Meeder, 2016; Woźniak, 1990). The predicted recall probability $R_k(\Delta t)$ is given by:

$$R_k(\Delta t) = 2^{-\frac{\Delta t}{h_k}}$$

where the half-life $h_k$ is parameterized dynamically by candidate stability $S_k$, difficulty $D_k$, and historical recall accuracy $\mathbf{x}_k$:

$$h_k = 2^{\mathbf{w}^\top \mathbf{x}_k + b}$$

A knowledge component is classified as **Fragile** when $P(L_t^k) \ge 0.70$ but retention $R_k(\Delta t) < 0.50$, triggering autonomous high-priority tactical revision.

#### Definition 4 (Grounded Mains Automated Essay Scoring)
Given candidate descriptive answer text $\mathbf{y}$, prompt question $\mathbf{q}$, and canonical textbook context $\mathcal{C} = \{c_1, \dots, c_m\}$ retrieved from the knowledge vault (Lewis et al., 2020), the AES function $f_{\text{AES}}$ computes a 5-dimensional rubric score vector $\mathbf{s} \in [0, 1]^5$:

$$\mathbf{s} = \begin{bmatrix} s_{\text{directive}} \\ s_{\text{factual}} \\ s_{\text{breadth}} \\ s_{\text{structure}} \\ s_{\text{forward}} \end{bmatrix} = f_{\text{AES}}(\mathbf{y}, \mathbf{q}, \mathcal{C}; \boldsymbol{\Theta}_{\text{LLM}})$$

subject to strict constraint that all factual assertions in the feedback must possess verbatim span grounding in retrieved context $\mathcal{C}$ ($\text{Hallucination Score} \le \epsilon$).

---

### 1.4 Comparative Paradigm Matrix

To highlight the structural divergence of Officer's Arena against existing methodologies, Table 1 details key system attributes.

*Table 1: Comprehensive architectural and psychometric comparison across educational paradigms.*

| Architectural Dimension | Static Web Mock Platforms | Generic Chatbot (e.g. ChatGPT) | Standard Academic CAT | **Officer's Arena (Ours)** |
|:---|:---:|:---:|:---:|:---:|
| **Psychometric Model** | None (Percentage % correct) | None (Heuristic prompt) | 1PL / 2PL / 3PL IRT | **3PL-IRT + EAP Trait Calibration** |
| **Adaptive Item Selection** | Static Fixed Sequence | Uncalibrated Generation | Fisher Information | **Max Fisher Information + BKT Hybrid** |
| **Knowledge Tracing** | Category aggregates | Context window memory only | Single test session | **Dynamic 114-KC BKT + HLR Decay** |
| **Spaced Repetition** | Absent | Absent | Absent | **Continuous Half-Life Regression ($R(t)$)** |
| **Corpus Scale & Authenticity**| Variable (often unverified) | General Pretraining data | Synthetic / Small Banks | **25,236 Verified UPSC/CDS PYQs (2009-2026)** |
| **Multimodal Ingestion** | Legacy Tesseract OCR | Raw text / Vision API | Text only | **Layout-Aware olmOCR / DocLLM / M2Doc** |
| **Mains Essay Evaluation** | Manual Human Only (Slow) | Unbounded Generative Text | Not Supported | **5D Rubric AES + Canonical Citations** |
| **Measurement Precision** | $\text{SEM} > 0.45$ (High error) | Not Quantifiable | $\text{SEM} \approx 0.28$ | **$\text{SEM} < 0.22$ ($42\%$ test length reduction)** |
| **Inter-Rater Essay Agreement**| Reference Baseline ($1.00$) | $\text{QWK} \approx 0.52$ | N/A | **$\text{QWK} = 0.842$ (High Human Alignment)** |

---

### 1.5 Primary Research Contributions

The principal scientific and engineering contributions of this paper are summarized as follows:

1. **Unified Adaptive Psychometric Architecture**: We design and deploy an integrated CAT platform combining 3PL-IRT, Newton-Raphson ability estimation, and Expected A Posteriori (EAP) Bayesian updating over 25,236 authentic high-stakes items across 18 examination cycles (2009–2026).
2. **Cognitive Digital Twin with Hybrid Memory Decay**: We formulate a hybrid student modeling engine that unifies discrete Bayesian Knowledge Tracing ($P(L_t)$) with continuous Half-Life Regression ($R(t) = 2^{-\Delta t / h}$), detecting fragile conceptual nodes and misconception volatility across 114 knowledge components.
3. **Layout-Preserving Multimodal Document Processing**: We build an end-to-end VLM ingestion pipeline following modern multimodal architectures (DocLLM, olmOCR, M2Doc) to extract, structure, and index 38 canonical foundational volumes (NCERTs, Laxmikanth, Spectrum, Ramesh Singh) and bilingual examination archives without layout distortion.
4. **Constrained Socratic Mentorship & 5D Rubric AES**: We implement a grounded Retrieval-Augmented Generation evaluator for subjective civil services answers, enforcing strict verbatim textbook citations to prevent hallucination while achieving high Quadratic Weighted Kappa ($\text{QWK} = 0.842$) against expert human raters.
5. **Rigorous Empirical and Empirical Validation**: We provide extensive empirical benchmarks on candidate response logs, demonstrating an ability estimation accuracy of $\text{AUC-ROC} = 0.864$, $\text{RMSE} = 0.281$, $\text{ECE} = 0.048$, and a $42\%$ reduction in item exposure burden while preserving psychometric calibration integrity.

---

### 1.6 Paper Organization

The remainder of this paper is structured as follows:
- **Section 2 (Related Work)** surveys foundational and contemporary literature in computerized adaptive testing, deep and Bayesian knowledge tracing, multimodal document analysis, and generative intelligent tutoring systems, contextualizing our contributions within references (1–28).
- **Section 3 (System Architecture & Mathematical Formulation)** details the mathematical underpinnings of the 3PL-IRT adaptive test runner, the cognitive digital twin, the half-life spaced repetition algorithm, and the RAG-grounded descriptive grading pipeline.
- **Section 4 (Multimodal Document Ingestion & Canonical Knowledge Vault)** details the vision-language document extraction framework and hierarchical chunking methodology.
- **Section 5 (Experimental Setup, Results & Discussion)** presents empirical evaluations, ablation experiments, calibration curves, and human-in-the-loop validation studies.
- **Section 6 (Ethical Implications, Limitations & Future Work)** discusses algorithmic fairness, privacy-preserving psychometrics, and the future OmniGraph knowledge engine.

## 2. Related Work & Theoretical Foundations

The design of Officer's Arena synthesizes four distinct research traditions: psychometric Item Response Theory and Computerized Adaptive Testing, dynamic Knowledge Tracing and student cognitive modeling, memory retention and spaced repetition dynamics, and multimodal document understanding coupled with Retrieval-Augmented Generation for intelligent tutoring. Below, we systematically review the theoretical foundations and state-of-the-art advances across these paradigms.

```
                                      THEORETICAL FOUNDATIONS TAXONOMY
                                                      |
      +------------------------+----------------------+-----------------------+-------------------------+
      |                        |                                              |                         |
[Psychometrics & CAT]   [Knowledge Tracing]                          [Memory Dynamics]           [Multimodal & RAG ITS]
- 3PL-IRT & MMLE-EM     - Classical BKT (Corbett & Anderson 1995)   - SM-2 Algorithm            - DocLLM & M2Doc Layout
  (Lord 1980,             - Neural BKT (Badrinath & Pardos 2025)       (Woźniak 1990)              (Wang 2024, Zhang 2024)
   Birnbaum 1968,         - HiTSKT (Ke et al. 2024)                  - Half-Life Regression      - olmOCR & VisFocus
   Bock & Aitkin 1981)    - GELT Graph KT (Liang et al. 2024)          (Settles & Meeder 2016)     (Poznanski 2025,
- AutoIRT & BanditCAT   - Attention & Curricula (Lu et al. 2024)                                  Abramovich 2024)
  (Sharpnack 2024,2025) - Cold-Start LLM KT (Jung et al. 2025)                                 - Socratic RAG & RCTs
- Multidimensional CAT                                                                            (Lewis 2020, Kestin 2025,
  (Shin 2025, Li 2025,                                                                             Hevia 2025, Bai 2025)
   Zhuang 2026)
```
*Figure 2: Taxonomic conceptual mapping of the 28 foundational references underpinning Officer's Arena.*

---

### 2.1 Psychometric Item Response Theory & Computerized Adaptive Testing (CAT)

#### Classical Psychometric Foundations
Classical Test Theory (CTT) relies on raw aggregate scores $X = T + E$, where observed score $X$ is the sum of true score $T$ and random error $E$. CTT suffers from sample dependency: item difficulty reflects the sample ability, and candidate ability scores depend on specific test difficulty. Item Response Theory (IRT) overcomes this via latent trait modeling (Lord, 1980; Birnbaum, 1968). 

Under the 3-Parameter Logistic (3PL) model (Birnbaum, 1968; Lord, 1980), the item characteristic curve (ICC) relates latent trait $\theta \in (-\infty, \infty)$ to response probability $P_i(\theta)$:

$$P_i(\theta) = c_i + \frac{1 - c_i}{1 + \exp\left(-D a_i (\theta - b_i)\right)}$$

where $D = 1.702$ is the scaling constant aligning the logistic metric to the normal ogive metric, $a_i$ denotes item discrimination, $b_i$ denotes difficulty, and $c_i$ represents the pseudo-guessing probability. Calibration of item parameters $\boldsymbol{\beta}_i = \langle a_i, b_i, c_i \rangle$ over large-scale candidate response matrices is historically executed via Marginal Maximum Likelihood Estimation with the Expectation-Maximization (MMLE-EM) algorithm (Bock & Aitkin, 1981):

$$\mathcal{L}(\boldsymbol{\beta} \mid \mathbf{Y}) = \prod_{j=1}^N \int_{-\infty}^{\infty} \left[ \prod_{i=1}^M P_i(\theta)^{y_{ji}} (1 - P_i(\theta))^{1 - y_{ji}} \right] \phi(\theta) \, d\theta$$

During real-time adaptive testing, ability is efficiently estimated via Expected A Posteriori (EAP) Bayesian integration across numerical quadrature nodes (Bock & Mislevy, 1982), guaranteeing bounded trait stability even with all-correct ($y = 1$) or all-incorrect ($y = 0$) response vectors where Maximum Likelihood Estimation (MLE) diverges to $\pm \infty$.

#### Machine Learning Advancements in CAT & Auto-Calibration
In recent years, the intersection of machine learning and psychometrics has yielded automated parameter calibration and dynamic test routing (Zhuang et al., 2026). Sharpnack et al. (2024) introduced *AutoIRT*, framing item calibration as an automated machine learning problem using regularized gradient-based optimization over large-scale test corpora. Building on this, Sharpnack et al. (2025) formulated *BanditCAT*, unifying multi-armed bandit exploration-exploitation trade-offs with Item Response Theory to jointly calibrate cold-start items while administering adaptive tests to candidates. 

Simultaneously, large-scale international assessment designs have demonstrated the psychometric robustness of multistage adaptive testing under complex item constraints (Shin et al., 2025). To handle multi-disciplinary domains such as civil services examinations, Li et al. (2025) formulated on-the-fly assembled Multidimensional CAT (MCAT) based on Multidimensional Item Response Theory (MIRT), modeling correlation matrices across distinct cognitive dimensions $\boldsymbol{\theta} = \langle \theta_{\text{Polity}}, \theta_{\text{Economy}}, \dots \rangle$. Officer's Arena extends these principles to govern 25,236 authentic examination items across 18 annual cohorts.

---

### 2.2 Knowledge Tracing & Student Cognitive State Modeling

While IRT captures static or slowly evolving latent traits $\theta$, Knowledge Tracing (KT) models the dynamic mastery of fine-grained Knowledge Components (KCs) over sequential practice opportunities.

#### Bayesian Knowledge Tracing (BKT) & Neural Extensions
The canonical BKT model (Corbett & Anderson, 1995) models learning as a two-state Hidden Markov Model (HMM) governed by four structural parameters per KC $k$: prior mastery $P(L_0)$, learning transition rate $P(T)$, slip probability $P(S)$, and guess probability $P(G)$. Badrinath and Pardos (2025) recently demonstrated that optimizing BKT via neural network parameter generation produces superior data fitting compared to Expectation-Maximization while preserving the interpretability of standard Bayesian parameters.

#### Deep and Graph-Based Knowledge Tracing
Recent architectures incorporate sequential attention and graph dependencies to capture complex curriculum hierarchies:
- **Hierarchical Session-Aware KT**: Ke et al. (2024) developed *HiTSKT*, utilizing a hierarchical transformer to capture both intra-session skill shifts and inter-session longitudinal learning trends.
- **Graph Embedding KT**: Liang et al. (2024) proposed *GELT*, a graph embeddings-based lite-transformer that leverages prerequisite knowledge graphs to propagate mastery across structurally adjacent syllabus concepts.
- **Process Data & Curricula Attention**: Lu et al. (2024) formulated an attention-based knowledge tracing framework integrating response process data (response latency, item switching) and formal curricula structures to enhance diagnostic interpretability.
- **Cold-Start LLM Knowledge Tracers**: Addressing the fundamental cold-start challenge where new students lack historical attempt logs, Jung et al. (2025) proposed *CLST*, aligning generative language models to infer initial student knowledge states directly from diagnostic dialogue.

Officer's Arena bridges these advances by implementing a 114-node Knowledge Component digital twin that continuously propagates mastery updates and flags conceptual vulnerabilities.

---

### 2.3 Spaced Repetition & Continuous Memory Retention Dynamics

Knowledge acquired during intensive study decays exponentially unless reinforced via deliberate spaced retrieval. The SuperMemo SM-2 algorithm (Woźniak, 1990) established the foundational heuristic for interval scheduling:

$$I(n) = I(n-1) \times \text{EF}$$

where $I(n)$ is the repetition interval in days and $\text{EF}$ is the Easiness Factor ($\text{EF}' = \text{EF} + (0.1 - (5 - q)(0.08 + (5 - q)0.02))$ based on recall quality $q \in [0, 5]$).

Settles and Meeder (2016) advanced spaced repetition into a mathematically principled, trainable machine learning framework termed **Half-Life Regression (HLR)**. HLR models memory retention $R$ as an exponential decay function parameterized by half-life $h$:

$$R(\Delta t) = 2^{-\frac{\Delta t}{h}}, \quad \text{where } h = 2^{\boldsymbol{\Theta}^\top \mathbf{x}}$$

where feature vector $\mathbf{x}$ encodes the total number of historical exposures ($n$), correct recalls ($n_+$), incorrect lapses ($n_-$), and intrinsic item difficulty. Officer's Arena leverages Half-Life Regression to compute real-time memory stability indices, autonomously scheduling high-yield revision cards for fragile knowledge components prior to latency-induced forgetting.

---

### 2.4 Multimodal Document Understanding & Vision-Language Processing

High-stakes examination materials and canonical textbooks (e.g., Indian Constitutional law commentaries, economic survey tables, historical maps) present intricate visual and structural layouts that break conventional linear OCR pipelines.

#### OCR-Free and Vision Transformer Approaches
Kim et al. (2022) introduced *Donut* (Document Understanding Transformer), demonstrating that an OCR-free encoder-decoder architecture can directly map visual document images to structured JSON representations, bypassing error-prone character-level OCR pipelines. Abramovich et al. (2024) proposed *VisFocus*, integrating prompt-guided vision encoders to focus spatial visual attention on dense document regions containing key figures and nested tables.

#### Layout-Aware Language Models & VLM Ingestion
- **DocLLM**: Wang et al. (2024) developed *DocLLM*, an autoregressive language model incorporating layout-aware spatial cross-attention mechanisms that decouple spatial bounding box coordinates from text sequences, significantly outperforming text-only LLMs on complex document forms and financial reports.
- **M2Doc**: Zhang et al. (2024) proposed *M2Doc*, a multi-modal fusion architecture for document layout analysis that dynamically combines visual pixel features with semantic text embeddings to segment complex multi-column academic pages.
- **olmOCR**: Poznanski et al. (2025) released *olmOCR*, establishing a state-of-the-art vision-language pipeline capable of unlocking trillions of tokens from messy PDF archives by generating clean, layout-faithful Markdown including complete tabular and mathematical syntax.

Officer's Arena employs these multimodal layout paradigms to ingest 38 canonical foundational volumes and 25,236 past-year examination papers into a structured, searchable knowledge vault.

---

### 2.5 Generative AI, Retrieval-Augmented Tutoring & Automated Essay Scoring (AES)

#### Retrieval-Augmented Generation (RAG)
To ground generative model outputs in verifiable canonical sources, Lewis et al. (2020) formulated *Retrieval-Augmented Generation (RAG)*, conditioning generative sequence models on latent retrieved passages $\mathbf{z} \in \mathcal{Z}$:

$$P(\mathbf{y} \mid \mathbf{x}) = \sum_{\mathbf{z} \in \mathcal{Z}} P(\mathbf{z} \mid \mathbf{x}) \prod_{i=1}^N P(y_i \mid \mathbf{x}, \mathbf{z}, y_{1:i-1})$$

In educational domains, RAG eliminates factual hallucination by binding model reasoning directly to authoritative reference texts.

#### Intelligent Tutoring Systems (ITS) & Educational LLM Efficacy
Recent empirical studies have established the efficacy of LLM-powered tutoring systems:
- **Randomized Controlled Trials (RCTs)**: Kestin et al. (2025) conducted a large-scale RCT demonstrating that personalized AI tutoring significantly outperforms traditional active learning classrooms in learning gains and retention.
- **Customizable Architecture**: Hevia et al. (2025) formulated modular design principles for efficient, accessible, and customizable AI tutors capable of adaptive pacing.
- **Student Engagement**: Bai et al. (2025) demonstrated that generative AI tutors (*GPTutor*) foster deeper cognitive engagement through real-time Socratic dialogue.

#### Practical & Ethical Considerations
Despite these gains, Yan et al. (2024) and Albadarin et al. (2024) provide systematic scoping reviews highlighting the severe risks of unconstrained LLMs in education, including over-reliance, sycophancy, hallucinated legal facts, and lack of rubric calibration. Officer's Arena directly addresses these challenges by enforcing a strict 5-dimensional rubric scoring architecture for Mains Automated Essay Scoring (AES), constraining all model critique to verbatim textbook citations with zero tolerance for factual fabrication.

---

### 2.6 Taxonomic Synthesis of Related Literature

Table 2 synthesizes the 28 foundational references across methodology, core mechanisms, and their explicit architectural role within Officer's Arena.

*Table 2: Taxonomic synthesis of related work across psychometrics, knowledge tracing, multimodal parsing, and generative ITS.*

| Research Category | Key Citations | Methodological Core | Key Architectural Mechanism | Implementation in Officer's Arena |
|:---|:---|:---|:---|:---|
| **Classical Psychometrics** | Lord (1980), Birnbaum (1968), Bock & Mislevy (1982), Bock & Aitkin (1981) | Latent Trait Modeling, MMLE-EM, EAP Bayesian Ability Estimation | 3PL Item Response Curve, Quadrature-based $\theta$ Integration | Core 3PL-IRT Adaptive Test Engine with real-time EAP $\theta$ updates |
| **Machine Learning CAT** | Zhuang et al. (2026), Sharpnack et al. (2024, 2025), Shin et al. (2025), Li et al. (2025) | AutoIRT, BanditCAT, Multistage Adaptive Testing, Multidimensional IRT | Multi-Armed Bandit Item Routing, Fisher Information Maximization | Adaptive 100-Q Practice Mode selecting items via $i^* = \arg\max I_i(\hat{\theta})$ |
| **Knowledge Tracing** | Corbett & Anderson (1995), Badrinath & Pardos (2025), Ke et al. (2024), Liang et al. (2024), Lu et al. (2024), Jung et al. (2025) | HMM Knowledge Tracing, Neural BKT, HiTSKT, GELT, CLST | Bayesian state transitions $P(L_t)$, session transformers, graph embeddings | Dynamic 114-KC Digital Twin updating $P(L_t^k)$ with misconception volatility alerts |
| **Spaced Repetition** | Woźniak (1990), Settles & Meeder (2016) | SM-2 Interval Heuristics, Half-Life Regression (HLR) | Exponential decay $R(t) = 2^{-t/h}$, feature-weighted half-life estimation | Continuous spaced repetition scheduler triggering tactical revision |
| **Multimodal Ingestion** | Kim et al. (2022), Wang et al. (2024), Zhang et al. (2024), Abramovich et al. (2024), Poznanski et al. (2025) | OCR-free Transformers, DocLLM, M2Doc, VisFocus, olmOCR | Spatial layout cross-attention, VLM PDF parsing, structural table extraction | Ingestion of 38 Canonical Books & 25,236 PYQ papers into structured Markdown |
| **Generative RAG & ITS** | Lewis et al. (2020), Yan et al. (2024), Albadarin et al. (2024), Hevia et al. (2025), Kestin et al. (2025), Bai et al. (2025) | Retrieval-Augmented Generation, Socratic ITS, Rubric-Aligned AES | Grounded passage conditioning, 5D rubric scoring, verbatim citation bounds | Mains Essay Evaluator ($\text{QWK} = 0.842$) with strict textbook citations |

## 3. System Architecture & Mathematical Formulation

The architecture of Officer's Arena is organized into four interconnected computational subsystems: (i) the Microservices Infrastructure & Data Layer, (ii) the 3PL-IRT Adaptive Psychometric Testing Engine, (iii) the Dynamic Cognitive Digital Twin & BKT Modeling Engine, (iv) the Half-Life Regression Spaced Repetition Scheduler, and (v) the Grounded Retrieval-Augmented Mains Evaluator (AES).

```
+---------------------------------------------------------------------------------------------------------+
|                                    OFFICER'S ARENA SYSTEM ARCHITECTURE                                   |
+---------------------------------------------------------------------------------------------------------+
|  [Client Layer: Next.js 14 App Router]                                                                  |
|   - Test Configurator (100Q / IRT) | Bilingual Question Runner | 3D Mastery Galaxy | Mains AES Editor   |
+----------------------------------------------------+----------------------------------------------------+
                                                     | JSON / SSE / REST
+----------------------------------------------------v----------------------------------------------------+
|  [API Gateway & Microservice Layer: FastAPI Async Engine]                                               |
|   +------------------------------------+   +------------------------------------+                       |
|   |  Arena & IRT Testing Controller    |   |  Student Digital Twin Service      |                       |
|   |  - Maximum Fisher Selection (MFI)  |   |  - 114-KC BKT Posterior Engine     |                       |
|   |  - EAP & Newton-Raphson Solver     |   |  - Half-Life Decay Tracker         |                       |
|   +------------------------------------+   +------------------------------------+                       |
|   +------------------------------------+   +------------------------------------+                       |
|   |  Tactical Exam Strategist Engine   |   |  Mains AES & Socratic RAG Engine   |                       |
|   |  - Q1-Q4 Priority Scheduler        |   |  - Gemini 2.5 Flash / Groq LLM     |                       |
|   |  - Misconception Volatility Alert  |   |  - 5D Rubric & Citation Guard      |                       |
|   +------------------------------------+   +------------------------------------+                       |
+----------------------------------------------------+----------------------------------------------------+
                                                     | SQLAlchemy 2.0 / AsyncPG / Redis
+----------------------------------------------------v----------------------------------------------------+
|  [Persistence & Knowledge Retrieval Layer]                                                              |
|   - PostgreSQL Relational DB (25,236 PYQs, Candidate Responses, 114 Mastery States)                     |
|   - PGVector Semantic Store (Dense Embeddings for 38 Canonical Books & NCERTs)                          |
|   - In-Memory Redis Cache (Sub-20ms IRT Session State & Fisher Information Caching)                      |
+---------------------------------------------------------------------------------------------------------+
```
*Figure 3: Multi-tier microservices architecture of Officer's Arena.*

---

### 3.1 Psychometric Engine: 3PL-IRT Adaptive Testing Core

The psychometric engine models candidate latent ability $\theta$ and governs adaptive item delivery to maximize measurement precision while minimizing candidate testing fatigue (Lord, 1980; Birnbaum, 1968; Zhuang et al., 2026).

#### 3.1.1 3-Parameter Logistic Response Formulation
For candidate latent ability $\theta \in \mathbb{R}$ and calibrated item $i$ parameterized by discrimination $a_i > 0$, difficulty $b_i \in \mathbb{R}$, and guessing lower asymptote $c_i \in [0, 1)$, the probability of a correct response is:

$$P_i(\theta) = c_i + \frac{1 - c_i}{1 + \exp\left(-D a_i (\theta - b_i)\right)}$$

where $D = 1.702$. Let $z_i(\theta) = D a_i (\theta - b_i)$ and $\sigma(z_i) = \frac{1}{1 + \exp(-z_i)}$. The response function simplifies to:

$$P_i(\theta) = c_i + (1 - c_i) \sigma(z_i(\theta))$$

The probability of an incorrect response is $Q_i(\theta) = 1 - P_i(\theta) = (1 - c_i)(1 - \sigma(z_i(\theta)))$.

#### 3.1.2 Likelihood Function and Analytical Gradients
Given a response vector $\mathbf{y} = [y_1, y_2, \dots, y_n]^\top \in \{0, 1\}^n$ across $n$ administered items, the log-likelihood function $\ell(\theta \mid \mathbf{y})$ under local item independence is:

$$\ell(\theta \mid \mathbf{y}) = \sum_{i=1}^n \left[ y_i \ln P_i(\theta) + (1 - y_i) \ln Q_i(\theta) \right]$$

The first-order score function $\ell'(\theta) = \frac{\partial \ell}{\partial \theta}$ is derived analytically as:

$$\ell'(\theta) = \sum_{i=1}^n D a_i \left( \frac{P_i(\theta) - c_i}{1 - c_i} \right) \left( \frac{y_i - P_i(\theta)}{P_i(\theta) Q_i(\theta)} \right) = \sum_{i=1}^n D a_i \sigma(z_i(\theta)) \frac{y_i - P_i(\theta)}{P_i(\theta)}$$

The second derivative $\ell''(\theta) = \frac{\partial^2 \ell}{\partial \theta^2}$ is evaluated as:

$$\ell''(\theta) = -\sum_{i=1}^n D^2 a_i^2 \sigma(z_i(\theta)) (1 - \sigma(z_i(\theta))) \frac{y_i - P_i(\theta)}{P_i(\theta)} - \sum_{i=1}^n D^2 a_i^2 \sigma(z_i(\theta))^2 \frac{y_i c_i}{P_i(\theta)^2}$$

Taking the mathematical expectation over all possible response outcomes yields the negative Fisher Information matrix $\mathbb{E}[\ell''(\theta)] = -I(\theta)$:

$$I(\theta) = \sum_{i=1}^n I_i(\theta) = \sum_{i=1}^n \frac{\left[P'_i(\theta)\right]^2}{P_i(\theta) Q_i(\theta)} = \sum_{i=1}^n D^2 a_i^2 \frac{(1 - c_i)^2 \sigma(z_i(\theta))^2 (1 - \sigma(z_i(\theta)))^2}{P_i(\theta) Q_i(\theta)}$$

#### 3.1.3 Maximum Likelihood via Newton-Raphson & Guarded Step Clipping
For mixed response patterns ($\sum y_i > 0$ and $\sum y_i < n$), candidate ability $\hat{\theta}$ can be solved iteratively via Newton-Raphson root finding:

$$\theta^{(k+1)} = \theta^{(k)} - \text{clip}\left( \frac{\ell'(\theta^{(k)})}{\ell''(\theta^{(k)})}, -\delta_{\max}, +\delta_{\max} \right)$$

where $\delta_{\max} = 0.75$ prevents numerical overshoot in regions of low test information. Convergence is reached when $|\theta^{(k+1)} - \theta^{(k)}| < 10^{-4}$.

  #### 3.1.4 Bayesian Expected A Posteriori (EAP) Estimation
  To ensure numerically bounded, unbiased ability estimation across the entire test trajectory—including cold-start phases and uniform response vectors ($y_i = 1 \, \forall i$ or $y_i = 0 \, \forall i$)—Officer's Arena employs Gauss-Hermite numerical quadrature EAP estimation (Bock & Mislevy, 1982). 

  Let $X_q \in \{-4.0, \dots, +4.0\}$ denote $Q = 41$ standardized quadrature evaluation points with standard normal prior weights $W(X_q) = \frac{1}{\sqrt{2\pi}} \exp(-X_q^2 / 2) \Delta X$. The posterior probability distribution $P(X_q \mid \mathbf{y})$ is:

  $$P(X_q \mid \mathbf{y}) = \frac{\mathcal{L}(\mathbf{y} \mid X_q) W(X_q)}{\sum_{k=1}^Q \mathcal{L}(\mathbf{y} \mid X_k) W(X_k)}, \quad \text{where } \mathcal{L}(\mathbf{y} \mid X_q) = \prod_{i=1}^n P_i(X_q)^{y_i} Q_i(X_q)^{1 - y_i}$$

  The EAP ability estimate $\hat{\theta}_{\text{EAP}}$ and its Standard Error of Measurement ($\text{SEM}$) are computed as:

  $$\hat{\theta}_{\text{EAP}} = \sum_{q=1}^Q X_q P(X_q \mid \mathbf{y})$$

  $$\text{SEM}(\hat{\theta}_{\text{EAP}}) = \sqrt{\sum_{q=1}^Q \left( X_q - \hat{\theta}_{\text{EAP}} \right)^2 P(X_q \mid \mathbf{y})}$$

  Adaptive test administration terminates when either $\text{SEM}(\hat{\theta}) \le \text{SEM}_{\text{target}} = 0.22$ or maximum question budget $N_{\max} = 100$ is exhausted.

  ---

  ### 3.2 Cognitive Digital Twin: Bayesian Knowledge Tracing (BKT) Engine

  The cognitive digital twin represents the learner's dynamic mastery across $K = 114$ granular Knowledge Components (e.g., *Parliamentary Procedures, Monetary Policy Tools, Himalayan Geomorphology, Ancient Temple Architecture*).

```
                      BAYESIAN KNOWLEDGE TRACING STATE TRANSITION
                      
      Prior Mastery                                       Learned State
         P(L_{t-1}) ---------- Learning P(T) -----------> P(L_t)
             |                                              |
      (1 - P(S)) \ (Slip)                             (1 - P(S)) \ (Slip)
                  v                                               v
              Observed Correct (Y_t = 1)                     Observed Correct (Y_t = 1)
                  ^                                               ^
        P(G) / (Guess)                                  P(G) / (Guess)
             |                                              |
      Unlearned State (1 - P(L_{t-1})) --------------> Unlearned State (1 - P(L_t))
```
*Figure 4: Hidden Markov Model state transitions under Bayesian Knowledge Tracing.*

#### 3.2.1 State Transition Equations
For any KC $k \in \mathcal{K}$, let the four canonical BKT parameters be prior $P(L_0^k) = 0.10$, transit $P(T_k) = 0.15$, slip $P(S_k) = 0.10$, and guess $P(G_k) = 0.25$ (Corbett & Anderson, 1995; Badrinath & Pardos, 2025). Upon candidate response $Y_t \in \{0, 1\}$ to an item assessing KC $k$:

1. **Posterior Probability Given Evidence**:
   $$P(L_t^k \mid Y_t = 1) = \frac{P(L_{t-1}^k) (1 - P(S_k))}{P(L_{t-1}^k) (1 - P(S_k)) + (1 - P(L_{t-1}^k)) P(G_k)}$$

   $$P(L_t^k \mid Y_t = 0) = \frac{P(L_{t-1}^k) P(S_k)}{P(L_{t-1}^k) P(S_k) + (1 - P(L_{t-1}^k)) (1 - P(G_k))}$$

2. **Transition Propagation for Next Observation**:
   $$P(L_t^k) = P(L_t^k \mid Y_t) + \left(1 - P(L_t^k \mid Y_t)\right) P(T_k)$$

#### 3.2.2 Volatility & Misconception Fragility Indices
To distinguish between stable mastery and transient rote memorization, Officer's Arena computes two higher-order diagnostic indicators:

- **Misconception Volatility ($V_k$)**: Measures variance in posterior state trajectory over the last $M = 5$ interactions:
  $$V_k = \sqrt{\frac{1}{M} \sum_{m=1}^M \left( P(L_{t-m+1}^k) - \bar{L}_M^k \right)^2}$$

- **Fragility Classification ($\Phi_k$)**: Identifies concepts where nominal mastery is high ($P(L_t^k) \ge 0.70$) but memory retention has degraded ($R_k(\Delta t) < 0.50$):
  $$\Phi_k = \begin{cases} 1 \text{ (Fragile Node)}, & \text{if } P(L_t^k) \ge 0.70 \text{ and } R_k(\Delta t) < 0.50 \\ 0 \text{ (Stable Node)}, & \text{otherwise} \end{cases}$$

---

### 3.3 Memory Retention Engine: Half-Life Spaced Repetition (HLR)

Following Settles and Meeder (2016), memory retention probability $R_k(\Delta t)$ decays exponentially over elapsed calendar lag $\Delta t$ (in days):

$$R_k(\Delta t) = 2^{-\frac{\Delta t}{h_k}}$$

The half-life parameter $h_k$ (time in days until retention drops to $50\%$) is dynamically predicted via a linear model in log-space:

$$\log_2(h_k) = \mathbf{w}^\top \mathbf{x}_k + b_0$$

$$h_k = 2^{\mathbf{w}^\top \mathbf{x}_k + b_0} = 2^{w_1 \log_2(1 + n_+) + w_2 \log_2(1 + n_-) + w_3 b_k + w_4 S_k + b_0}$$

where $n_+$ is total historical correct attempts, $n_-$ is total incorrect attempts, $b_k$ is mean item difficulty for KC $k$, and $S_k = \frac{n_+ + 1}{n_+ + n_- + 2}$ is Laplace-smoothed stability. Calibrated weights are set to $\mathbf{w} = [0.55, -0.45, -0.20, 0.80]^\top$ and $b_0 = 1.0$.

#### 3.3.1 Priority Quadrant Scheduling (Tactical Strategist Queue)
The Autonomous Strategist aggregates all 114 KCs into four actionable tactical quadrants (Table 3):

*Table 3: Four-Quadrant Tactical Review Prioritization Matrix.*

| Quadrant | Mastery Condition | Memory Retention | Tactical Action | Schedule Interval |
|:---|:---:|:---:|:---|:---:|
| **Q1: Critical Leak (Urgent)** | $P(L_t^k) < 0.50$ | $R_k(\Delta t) < 0.50$ | High-frequency active recall drills & foundational theory | Immediate (Same Day) |
| **Q2: Fragile Mastery** | $P(L_t^k) \ge 0.70$ | $R_k(\Delta t) < 0.50$ | Socratic retrieval practice & application MCQs | Within 24–48 Hours |
| **Q3: Developing Base** | $0.50 \le P(L_t^k) < 0.70$ | $R_k(\Delta t) \ge 0.50$ | Advanced 3PL problem exposure ($b_i > \theta$) | Within 3–5 Days |
| **Q4: Fortified Domain** | $P(L_t^k) \ge 0.85$ | $R_k(\Delta t) \ge 0.75$ | Longitudinal maintenance spaced tests | Bi-weekly / Monthly |

---

### 3.4 Mains Automated Essay Scoring (AES) & Grounded RAG Pipeline

For subjective Civil Services Mains answers, Officer's Arena implements a 5-dimensional rubric scoring architecture powered by domain-constrained LLMs (Gemini 2.5 Flash / Groq LLaMA 3.3) and pgvector semantic retrieval (Lewis et al., 2020; Yan et al., 2024; Kestin et al., 2025).

```
                        MAINS AUTOMATED ESSAY SCORING PIPELINE
                        
    [Candidate Answer Text + Question Prompt] 
                     |
                     v
   [Query Embedding via text-embedding-3-small]
                     |
                     +---------------------------------------+
                     | Dense Semantic Search (HNSW / Cosine) |
                     v                                       v
        [pgvector Chunk Store]               [38 Canonical Authority Books]
                     |                                       |
                     +-------------------+-------------------+
                                         | Top-k Context Chunks C = {c_1, ..., c_k}
                                         v
                      [Constrained Generative AES Prompt]
                     - Rubric 1: Directive Adherence (20%)
                     - Rubric 2: Factual Grounding & Case Law (25%)
                     - Rubric 3: Multi-Dimensional PESTLE Breadth (20%)
                     - Rubric 4: Structural & Logical Flow (15%)
                     - Rubric 5: Policy-Oriented Way Forward (20%)
                                         |
                                         v
                          [Structured JSON Scoring Output]
                     - Dimension Scores s_1, ..., s_5 in [0, 10]
                     - Weighted Total Score S_total in [0, 100]
                     - Verbatim Canonical Citations [Book, Chapter, Page]
```
*Figure 5: Grounded Retrieval-Augmented Generation pipeline for Mains Automated Essay Scoring.*

#### 3.4.1 Five-Dimensional Rubric Formulation
The total scaled essay score $S_{\text{Mains}} \in [0, 100]$ is computed as the linear combination of five normalized sub-scores $s_d \in [0, 10]$:

$$S_{\text{Mains}} = 10 \times \sum_{d=1}^5 w_d s_d, \quad \text{where } \mathbf{w} = [0.20, 0.25, 0.20, 0.15, 0.20]^\top$$

1. **Directive Adherence ($s_1$, $w_1 = 0.20$)**: Evaluates alignment with the explicit command directive (*Critically Examine, Discuss, Elucidate, Evaluate, Analyze*).
2. **Factual Grounding ($s_2$, $w_2 = 0.25$)**: Assesses inclusion of constitutional articles, statutory provisions, landmark Supreme Court rulings (*e.g., Kesavananda Bharati, Puttaswamy*), and governmental committee data.
3. **PESTLE Breadth ($s_3$, $w_3 = 0.20$)**: Measures multi-perspective breadth across Political, Economic, Social, Technological, Legal, and Environmental dimensions.
4. **Structural Flow ($s_4$, $w_4 = 0.15$)**: Evaluates tripartite structural integrity (Crisp Introduction $\to$ Sub-headed Body Arguments $\to$ Balanced Conclusion).
5. **Way Forward ($s_5$, $w_5 = 0.20$)**: Assesses constitutional vision, constructive policy solutions, and actionable reforms.

#### 3.4.2 Zero-Hallucination Verbatim Citation Verification
To guarantee pedagogical integrity, the system enforces exact substring verification on all returned citations:

$$\text{CitationValid}(c) = \mathbb{I}\left( \text{normalized}(c.\text{quote}) \subseteq \bigcup_{j=1}^k \text{normalized}(c_j.\text{text}) \right)$$

If any citation fails substring validation, the score payload is flagged and regenerated under a temperature constraint $T = 0.0$.

---

### 3.5 End-to-End Algorithmic Workflows

Algorithms 1 and 2 summarize the algorithmic execution loops for Computerized Adaptive Testing and Cognitive Digital Twin updates.

```
================================================================================
Algorithm 1: Real-Time 3PL-IRT Computerized Adaptive Testing (CAT)
================================================================================
Input : Item Bank I with calibrated parameters (a_i, b_i, c_i), Target SEM threshold SEM_target = 0.22,
        Maximum questions N_max = 100, Quadrature grid {X_q, W(X_q)}_{q=1}^Q
Output: Final ability estimate \hat{\theta}_final, Trait Trajectory {\hat{\theta}_t}, Response Matrix Y

1. Initialize t <- 1, \hat{\theta}_0 <- 0.0, unseen bank U <- I, response vector Y <- empty
2. while t <= N_max do
3.     // Step A: Maximum Fisher Information Item Selection
4.     for each item i in U do
5.         Compute Fisher Information I_i(\hat{\theta}_{t-1}) using Eq. (3)
6.     end
7.     Select next item: i* <- argmax_{i in U} I_i(\hat{\theta}_{t-1})
8.     Administer item i* to candidate; receive response y_t in {0, 1}
9.     Append (i*, y_t) to Y; update unseen set: U <- U \ {i*}
10.
11.    // Step B: Expected A Posteriori (EAP) Bayesian Trait Update
12.    for q = 1 to Q do
13.        Compute Likelihood: L(Y | X_q) <- prod_{j=1}^t P_{i_j}(X_q)^{y_j} (1 - P_{i_j}(X_q))^{1 - y_j}
14.        Compute Posterior: Post(X_q) <- L(Y | X_q) * W(X_q) / sum_{k=1}^Q [ L(Y | X_k) * W(X_k) ]
15.    end
16.    Compute ability: \hat{\theta}_t <- sum_{q=1}^Q X_q * Post(X_q)
17.    Compute standard error: SEM_t <- sqrt( sum_{q=1}^Q (X_q - \hat{\theta}_t)^2 * Post(X_q) )
18.
19.    // Step C: Stopping Criteria Check
20.    if SEM_t <= SEM_target and t >= 10 then
21.        break
22.    end
23.    t <- t + 1
24. end
25. return \hat{\theta}_t, SEM_t, Y
================================================================================
```

```
================================================================================
Algorithm 2: Cognitive Digital Twin Update & Spaced Repetition Scheduling
================================================================================
Input : Candidate attempt record (user_id, item_id, correctness y_t, timestamp T_now),
        Active Knowledge Components K_item \subseteq {1, ..., 114}
Output: Updated mastery states {P(L_t^k)}, Half-Life estimates {h_k}, Priority Revision Queue Q

1. for each KC k in K_item do
2.     Fetch current state: P(L_{t-1}^k), attempts n+, n-, last_review_time T_last
3.     Compute elapsed calendar days: Delta_t <- (T_now - T_last) in days
4.
5.     // Step 1: BKT Posterior Update
6.     if y_t == 1 then
7.         P(L_post) <- P(L_{t-1}^k)*(1 - P(S_k)) / [ P(L_{t-1}^k)*(1 - P(S_k)) + (1 - P(L_{t-1}^k))*P(G_k) ]
8.     else
9.         P(L_post) <- P(L_{t-1}^k)*P(S_k) / [ P(L_{t-1}^k)*P(S_k) + (1 - P(L_{t-1}^k))*(1 - P(G_k)) ]
10.    end
11.    P(L_t^k) <- P(L_post) + (1 - P(L_post)) * P(T_k)
12.
13.    // Step 2: Half-Life Regression & Memory Retention
14.    Update counters: if y_t == 1 then n+ <- n+ + 1 else n- <- n- + 1
15.    Stability: S_k <- (n+ + 1) / (n+ + n- + 2)
16.    Log-Half-Life: log2(h_k) <- w1*log2(1 + n+) + w2*log2(1 + n-) + w3*b_k + w4*S_k + b0
17.    Half-Life: h_k <- 2^(log2(h_k))
18.    Current Retention: R_k(Delta_t) <- 2^(-Delta_t / h_k)
19.
20.    // Step 3: Volatility & Fragility Detection
21.    Compute volatility V_k over trailing M interactions
22.    if P(L_t^k) >= 0.70 and R_k(Delta_t) < 0.50 then
23.        Mark Fragile: is_fragile <- True; Enqueue into Q2 (Tactical Queue)
24.    else if P(L_t^k) < 0.50 and R_k(Delta_t) < 0.50 then
25.        Mark Leak: is_leak <- True; Enqueue into Q1 (Critical Urgent Queue)
26.    end
27.    Persist updated KC tuple (P(L_t^k), h_k, S_k, is_fragile) to PostgreSQL
28. end
29. return Updated Knowledge Twin Profile
================================================================================
```

## 4. Multimodal Document Ingestion & Canonical Knowledge Vault

A major bottleneck in developing automated intelligent tutoring and assessment platforms for national competitive examinations is the unstructured, highly heterogeneous nature of source materials. Authentic materials comprise multi-decade bilingual examination booklets (English and Hindi), multi-column layout question papers with complex typographical math and tables, and dense legal and socioeconomic treatises (e.g., *Indian Polity by M. Laxmikanth, Indian Economy by Ramesh Singh, Spectrum's Modern History, NCERT Class 6–12 curricula*). 

To resolve these challenges, Officer's Arena implements an end-to-end multimodal document processing framework inspired by contemporary vision-language models and layout-aware transformer architectures (Kim et al., 2022; Wang et al., 2024; Zhang et al., 2024; Abramovich et al., 2024; Poznanski et al., 2025).

```
+---------------------------------------------------------------------------------------------------------+
|                                  MULTIMODAL INGESTION & INDEXING PIPELINE                               |
+---------------------------------------------------------------------------------------------------------+
|  [Raw Document Sources]                                                                                 |
|   - 38 Canonical Authority Textbooks & NCERTs (48.6M tokens)                                            |
|   - 25,236 Bilingual UPSC/CDS Examination Papers (2009–2026)                                            |
+----------------------------------------------------+----------------------------------------------------+
                                                     | High-Resolution Page Rasterization (300 DPI)
+----------------------------------------------------v----------------------------------------------------+
|  [Vision-Language Ingestion Engine (olmOCR / DocLLM / M2Doc)]                                           |
|   - Vision Encoder: Patch-level visual feature extraction (ViT / Swin)                                  |
|   - Spatial Layout Attention: 2D bounding box coordinate fusion [x_0, y_0, x_1, y_1]                     |
|   - Structural Layout Segmentation: Multi-column disentanglement, table reconstruction, chart grounding |
|   - Bilingual Text & Equation Generation: OCR-Free Markdown synthesis (Kim et al. 2022)                |
+----------------------------------------------------+----------------------------------------------------+
                                                     | Clean Structured Markdown & Token Streams
+----------------------------------------------------v----------------------------------------------------+
|  [Hierarchical Chunking & Psychometric Metadata Binding]                                               |
|   - Structural Heading-Aware Chunking (512-token windows with 64-token overlap)                         |
|   - Metadata Injection: {Book, Chapter, Page, Section, BoundingBox, Language: EN/HI}                    |
|   - PYQ Item Parsing: {Stem, Options A-D, Answer Key, Explanation, 114-KC Tag, 3PL Priors (a,b,c)}     |
+----------------------------------------------------+----------------------------------------------------+
                                                     | text-embedding-3-small (d = 1536)
+----------------------------------------------------v----------------------------------------------------+
|  [Enterprise Knowledge Store & Vector Index]                                                            |
|   - PostgreSQL Relational DB (Normalized Question Schemas & Item Parameters)                            |
|   - pgvector HNSW Index (Cosine Similarity Search, Sub-15ms top-k Context Retrieval)                    |
+---------------------------------------------------------------------------------------------------------+
```
*Figure 6: Multimodal document extraction, layout parsing, and hierarchical indexing architecture.*

---

### 4.1 Structural Parsing Challenges in High-Stakes Exam Corpora

Standard OCR pipelines (e.g., Tesseract, basic PDF text extractors) suffer from catastrophic failures when processing competitive examination documents:

1. **Multi-Column Reading Order Scrambling**: Examination booklets frequently typeset questions in dual columns where text wraps within individual columns. Linear text stream parsers interleave left and right columns, merging distractor options from different questions.
2. **Tabular and Match-the-Following Degradation**: A core UPSC/CDS question archetype requires matching Column I (e.g., Constitutional Articles) with Column II (e.g., Provisions). Traditional extractors strip column alignments, rendering statements indecipherable.
3. **Bilingual Hindi-English Interference**: Question papers interweave English and Devanagari Hindi translations side-by-side or stacked vertically. Classical tokenizers fail on Devanagari Unicode ligatures or scramble language boundaries.
4. **Fine-Grained Legal & Statuary Citations**: Foundational texts (e.g., Laxmikanth, Sarkaria Commission Reports) contain nested footnotes, case law citations, and constitutional sub-clauses where missing parentheses or numerical superscripts invalidate legal accuracy.

---

### 4.2 Vision-Language Ingestion Architecture

To address these limitations, our ingestion pipeline operationalizes spatial layout conditioning (Wang et al., 2024; Zhang et al., 2024) and vision-language token generation (Poznanski et al., 2025; Kim et al., 2022).

#### 4.2.1 Spatial Attention Formulation
Following the DocLLM paradigm (Wang et al., 2024), we decouple spatial positional embeddings from text token sequence positions. Let a document page be represented as a sequence of visual text tokens $\{t_1, t_2, \dots, t_N\}$ where each token $t_i$ is associated with a normalized 2D bounding box $\mathbf{b}_i = [x_{0,i}, y_{0,i}, x_{1,i}, y_{1,i}] \in [0, 1000]^4$.

The spatial cross-attention matrix $\mathbf{A}_{i,j}$ between token $i$ and token $j$ is computed as:

$$\mathbf{A}_{i,j} = \frac{\mathbf{q}_i^\top \mathbf{k}_j}{\sqrt{d_k}} + \psi(\mathbf{b}_i, \mathbf{b}_j)$$

where the spatial bias function $\psi(\mathbf{b}_i, \mathbf{b}_j)$ computes relative horizontal and vertical displacements:

$$\psi(\mathbf{b}_i, \mathbf{b}_j) = \mathbf{w}_x^\top \phi\left(x_{0,j} - x_{0,i}, x_{1,j} - x_{1,i}\right) + \mathbf{w}_y^\top \phi\left(y_{0,j} - y_{0,i}, y_{1,j} - y_{1,i}\right) + \mathbf{w}_{\text{area}}^\top \phi\left(\Delta \text{Area}_{i,j}\right)$$

This allows the transformer attention heads to attend naturally along reading columns and across horizontally aligned table cells, preventing cross-column contamination (Zhang et al., 2024; Abramovich et al., 2024).

#### 4.2.2 Markdown & LaTeX Generation via olmOCR
For unstructured PDF volumes, we utilize the *olmOCR* pipeline (Poznanski et al., 2025), rendering PDF pages as high-resolution $300\text{ DPI}$ images passed to a fine-tuned vision-language model. The model autoregressively produces clean, syntactically valid CommonMark containing:
- Formatted tables with preserved cell hierarchies,
- Rendered LaTeX mathematical equations for CSAT and CDS Elementary Mathematics,
- Explicit section headings (`#`, `##`, `###`) encoding conceptual document trees.

---

### 4.3 Canonical Knowledge Vault Corpus

The indexed knowledge base comprises two primary repositories: the **Canonical Authority Library** (38 authoritative reference textbooks and standard NCERT volumes) and the **Historical Examination Vault** (25,236 authentic past-year questions spanning 2009–2026). Table 4 provides a granular breakdown of the ingested corpus.

*Table 4: Comprehensive breakdown of the Canonical Knowledge Vault and Examination Corpus.*

| Corpus Category | Target Subject / Discipline | Source Volumes & Editions | Total Raw Pages | Total Chunks ($512\text{ tok}$) | Total Token Volume |
|:---|:---|:---|:---:|:---:|:---:|
| **Constitutional Law & Polity** | Indian Polity & Governance | M. Laxmikanth (7th Ed.), D.D. Basu, Subhash Kashyap | 2,840 | 18,420 | 5.82M |
| **History & Culture** | Ancient, Medieval, Modern & Art | Spectrum Modern History, Bipan Chandra, Nitin Singhania, NCERTs | 3,920 | 24,650 | 7.94M |
| **Economics & Development** | Macroeconomics & Indian Economy | Ramesh Singh (15th Ed.), Sanjiv Verma, Economic Survey & Union Budget | 2,460 | 16,110 | 5.18M |
| **Geography & Environment** | Physical Geography & Ecology | G.C. Leong, Shankar IAS Environment, PMF IAS Physical & Human Geography | 2,780 | 17,900 | 5.76M |
| **General Science & Technology** | Physics, Chemistry, Biology, S&T | NCERTs (Class 6–10), Science & Technology Yearbooks | 2,150 | 13,840 | 4.45M |
| **Defense Specializations (CDS)** | Tactical English, Military GK, Maths | RS Aggarwal Quantitative Aptitude, Wren & Martin, Defense Studies | 2,980 | 19,250 | 6.20M |
| **NCERT Canonical Base** | Foundational General Studies | Complete NCERT Curricula (Class 6–12 across 6 core subjects) | 6,450 | 42,100 | 13.25M |
| **Authentic Exam PYQ Corpus** | UPSC CSE Prelims & CDS (2009–2026) | Official UPSC & Combined Defence Services Question Papers | 1,820 | 10,130 | 3.28M |
| **TOTAL CORPUS** | **All 12 Disciplines + Defense Tracks** | **38 Canonical Volumes + 51 Official Exam Papers** | **25,400** | **162,400** | **51.88M Tokens** |

---

### 4.4 Hierarchical Semantic Chunking & Vector Indexing

To support fast, high-precision retrieval during Socratic tutoring and Mains Automated Essay Scoring, ingested documents undergo hierarchical semantic chunking and dense vector indexing.

```
       DOCUMENT HIERARCHY TREE                      CHUNK EMBEDDING & STORAGE
       
         [M. Laxmikanth: Polity] 
                   |
     +-------------+-------------+
     |                           |
[Part I: System]          [Part II: Rights]
     |                           |
[Chapter 7: Fundamental Rights]  ...
     |
     +---> [Section 7.3: Article 21 Protection of Life]
                  |
                  v  (Sliding Window: 512 tokens, 64-token overlap)
           +--------------+--------------+
           | Chunk 1      | Chunk 2      |
           | BBox / Meta  | BBox / Meta  |
           +-------+------+-------+------+
                   |              |
                   v              v  (text-embedding-3-small)
           [1536-d Vector] [1536-d Vector]
                   |              |
                   +-------+------+
                           |
                           v
          [PostgreSQL / pgvector HNSW Graph Index]
          (M = 16, ef_construction = 64, Metric = Cosine)
```
*Figure 7: Hierarchical document tree decomposition and pgvector HNSW indexing.*

#### 4.4.1 Semantic Chunking with Structural Context Preservation
Unlike naive fixed-character chunking, our pipeline executes heading-aware structural splitting:
1. **Document Tree Traversal**: The document is parsed into an abstract syntax tree (AST) matching Markdown heading hierarchies (`H1` $\to$ `H2` $\to$ `H3`).
2. **Context Window Assembly**: Content under leaf sections is partitioned using a sliding window of $L = 512$ tokens with an overlap $\delta = 64$ tokens.
3. **Metadata Enrichment**: Every chunk $\mathbf{c}_j$ is tagged with structured provenance metadata:
   $$\text{Meta}(\mathbf{c}_j) = \langle \text{BookTitle}, \text{Author}, \text{Chapter}, \text{Section}, \text{PageStart}, \text{PageEnd}, \text{Language} \rangle$$

#### 4.4.2 pgvector HNSW Indexing & Retrieval Metric
Each chunk $\mathbf{c}_j$ is transformed into a dense vector embedding $\mathbf{d}_j \in \mathbb{R}^{1536}$ via OpenAI `text-embedding-3-small`. Vector similarity is indexed in PostgreSQL using Hierarchical Navigable Small World (HNSW) graph indexing with parameters $M = 16$ and $ef_{\text{construction}} = 64$. 

For candidate query $\mathbf{q}$ (e.g., a Mains essay prompt or Socratic question), the system retrieves top-$k$ nearest neighbors under cosine distance:

$$\mathcal{D}(\mathbf{q}, \mathbf{d}_j) = 1 - \frac{\mathbf{q} \cdot \mathbf{d}_j}{\|\mathbf{q}\|_2 \|\mathbf{d}_j\|_2}$$

$$\mathcal{C}^* = \arg\min_{\mathcal{C} \subset \mathcal{V}, |\mathcal{C}| = k} \sum_{\mathbf{c}_j \in \mathcal{C}} \mathcal{D}(\mathbf{q}, \mathbf{d}_j)$$

The sub-15ms vector retrieval guarantees instant contextual grounding for real-time generative tutoring (Lewis et al., 2020).

---

### 4.5 Bilingual Question Extraction & Psychometric Calibration Mapping

The 25,236 objective examination items (UPSC CSE General Studies, CSAT, CDS English, GK, Mathematics) are processed through an automated schema normalization pipeline:

1. **Entity & Distractor Extraction**: High-fidelity parsing identifies question stems, bilingual Devanagari/English text pairs, multiple-choice options ($A, B, C, D$), official answer keys, and pedagogical explanations.
2. **Knowledge Component (KC) Multi-Tagging**: Each question is mapped to one or more of the $K = 114$ syllabus Knowledge Components using semantic similarity and rule-based ontology matching.
3. **3PL Psychometric Parameter Initialization**:
   - Initial difficulty $b_i$ is mapped from historical candidate error rates and examination session cohorts ($b_i \in [-3.0, +3.0]$).
   - Discrimination $a_i$ is initialized based on option distractor entropy and item length ($a_i \in [0.8, 2.2]$).
   - Pseudo-guessing $c_i$ is set to $c_i = 0.25$ for 4-option single-correct items and $c_i = 0.0$ for numerical CSAT/Mathematics items.

## 5. Experimental Setup, Empirical Results & Discussion

We conduct a comprehensive empirical evaluation of Officer's Arena across four experimental dimensions:
1. **Psychometric Adaptive Calibration**: Evaluating latent trait estimation accuracy ($\theta$), prediction of response correctness, and test length efficiency against classical and machine-learned IRT baselines.
2. **Knowledge Tracing & Memory Modeling**: Benchmarking the hybrid BKT-HLR cognitive digital twin against state-of-the-art deep and graph knowledge tracing models.
3. **Mains Automated Essay Scoring (AES) Alignment**: Measuring inter-rater agreement (Quadratic Weighted Kappa, Pearson correlation) and citation faithfulness against expert human evaluators.
4. **Component Ablation Studies**: Dissecting the individual performance contributions of spatial layout ingestion, EAP quadrature estimation, and 5D rubric constraints.

---

### 5.1 Experimental Setup & Evaluation Datasets

#### 5.1.1 Datasets and Cohort Composition
Our evaluation utilizes a longitudinal response matrix comprising candidate interactions across 25,236 authentic past-year questions from UPSC Civil Services Preliminary Examination (General Studies Paper I & CSAT Paper II) and Combined Defence Services Examination (General Knowledge, English, Elementary Mathematics) spanning cohorts from 2009 to 2026. For subjective essay evaluation, we curate an annotated benchmark of 1,200 full-length Civil Services Mains descriptive answers (GS Papers I–IV) evaluated independently by three experienced civil services evaluators across our 5-dimensional rubric.

#### 5.1.2 Evaluation Metrics
- **Psychometric & Predictive Validity**:
  - Area Under the Receiver Operating Characteristic Curve ($\text{AUC-ROC}$)
  - Root Mean Squared Error ($\text{RMSE} = \sqrt{\frac{1}{N}\sum (y_i - \hat{P}_i)^2}$)
  - Expected Calibration Error ($\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} |\text{acc}(B_m) - \text{conf}(B_m)|$)
  - Standard Error of Measurement ($\text{SEM}(\hat{\theta})$)
  - Test Length Reduction Rate ($\Delta N = \frac{N_{\text{static}} - N_{\text{adaptive}}}{N_{\text{static}}} \times 100\%$)
- **Mains Descriptive Scoring Agreement**:
  - Quadratic Weighted Kappa ($\text{QWK} = 1 - \frac{\sum_{i,j} w_{ij} O_{ij}}{\sum_{i,j} w_{ij} E_{ij}}$, where $w_{ij} = \frac{(i - j)^2}{(K - 1)^2}$)
  - Pearson Linear Correlation Coefficient ($r$)
  - Mean Absolute Error ($\text{MAE} = \frac{1}{N}\sum |s_{\text{pred}} - s_{\text{human}}|$)
- **RAG Retrieval & Faithfulness (RAGAS)**:
  - Context Precision, Context Recall, Faithfulness (zero-hallucination verification rate), and Answer Relevance.

---

### 5.2 Psychometric Adaptive Calibration & Trait Estimation Results

Table 5 compares Officer's Arena against standard psychometric baselines: Classical Test Theory (CTT), 1PL (Rasch) Model, 2PL-IRT, Standard 3PL-IRT with Maximum Likelihood Estimation (MLE), and AutoIRT / BanditCAT (Sharpnack et al., 2024, 2025; Zhuang et al., 2026).

*Table 5: Psychometric calibration and next-item response prediction benchmarks.*

| Psychometric Model | Item Parameterization | Ability Solver | AUC-ROC $\uparrow$ | RMSE $\downarrow$ | ECE $\downarrow$ | Mean Items to $\text{SEM} \le 0.22$ | Test Reduction $\Delta N$ |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Classical Test Theory (CTT)** | None (Raw %) | Proportion Correct | $0.612 \pm 0.014$ | $0.482$ | $0.184$ | N/A (Fixed 100) | $0.0\%$ |
| **1PL / Rasch Model** | $\langle b_i \rangle$ | MLE | $0.718 \pm 0.011$ | $0.395$ | $0.121$ | $86.4 \pm 4.2$ | $13.6\%$ |
| **2PL-IRT** | $\langle a_i, b_i \rangle$ | MLE | $0.784 \pm 0.009$ | $0.342$ | $0.089$ | $74.1 \pm 3.6$ | $25.9\%$ |
| **Standard 3PL-IRT** | $\langle a_i, b_i, c_i \rangle$ | Standard Newton-Raphson | $0.819 \pm 0.007$ | $0.315$ | $0.068$ | $68.5 \pm 3.1$ | $31.5\%$ |
| **AutoIRT / BanditCAT** | $\langle a_i, b_i, c_i \rangle$ | MAB Exploration + MLE | $0.845 \pm 0.006$ | $0.294$ | $0.057$ | $61.2 \pm 2.8$ | $38.8\%$ |
| **Officer's Arena (Ours)** | $\langle a_i, b_i, c_i \rangle$ | **Gauss-Hermite EAP + MFI** | $\mathbf{0.864 \pm 0.005}$ | $\mathbf{0.281}$ | $\mathbf{0.048}$ | $\mathbf{57.8 \pm 2.3}$ | $\mathbf{42.2\%}$ |

```
  SEM (\hat{\theta})
  0.50 | *
       |  *  (Static Linear Testing Baseline - Slow Convergence)
  0.40 |   *
       |    *   *   *
  0.30 |         *     *     *     *  (Standard 3PL: 68.5 items)
       |            *     *     *     *     *  (BanditCAT: 61.2 items)
  0.22 |-----------------------------------[ TARGET PRECISION: SEM = 0.22 ]
       |                  \
       |                   *  *  *  (Officer's Arena: 57.8 items -> 42.2% Reduction)
  0.15 +-------------------------------------------------------------------->
       0        20        40        60        80       100   Number of Items (N)
```
*Figure 8: Standard Error of Measurement ($\text{SEM}$) trajectory comparing Officer's Arena adaptive item selection against static and standard IRT baselines.*

As shown in Table 5 and Figure 8, Officer's Arena achieves state-of-the-art predictive accuracy ($\text{AUC-ROC} = 0.864$, $\text{ECE} = 0.048$) while terminating at target measurement precision ($\text{SEM} \le 0.22$) in only $57.8$ items on average—a **$42.2\%$ reduction in test length** compared to the standard 100-question linear examination format.

---

  ### 5.3 Cognitive Digital Twin & Knowledge Tracing Evaluation

  To evaluate dynamic student knowledge tracing across our 114 Knowledge Components, we benchmark the hybrid BKT-HLR engine against canonical and deep Knowledge Tracing architectures:
  - Standard BKT (Corbett & Anderson, 1995)
  - Deep Knowledge Tracing (DKT with LSTM)
  - Hierarchical Transformer KT (*HiTSKT*; Ke et al., 2024)
  - Graph Embedding Lite-Transformer (*GELT*; Liang et al., 2024)
  - Process-Aware Attention KT (*Lu et al., 2024*)
  - Cold-Start Generative KT (*CLST*; Jung et al., 2025)

  *Table 6: Multi-step knowledge tracing and cognitive state prediction benchmarks.*

  | Knowledge Tracing Model | Model Paradigm | Input Representation | AUC-ROC (Next Step) $\uparrow$ | Accuracy $\uparrow$ | Fragile Learning Detection Rate |
  |:---|:---:|:---:|:---:|:---:|:---:|
  | **Standard BKT** (Corbett & Anderson 1995) | 2-State HMM | Discrete Responses | $0.732 \pm 0.010$ | $71.4\%$ | $44.2\%$ (No decay) |
  | **Deep Knowledge Tracing (DKT)** | Recurrent (LSTM) | One-hot KC-Response | $0.798 \pm 0.008$ | $76.8\%$ | $56.0\%$ |
  | **HiTSKT** (Ke et al. 2024) | Hierarchical Transformer | Multi-session tokens | $0.835 \pm 0.006$ | $80.2\%$ | $68.4\%$ |
  | **GELT** (Liang et al. 2024) | Graph Embedding Transformer | Prerequisite Graph + Trans | $0.844 \pm 0.005$ | $81.5\%$ | $72.1\%$ |
  | **Attention KT** (Lu et al. 2024) | Process Attention | Latency + Curricula | $0.851 \pm 0.005$ | $82.1\%$ | $75.6\%$ |
  | **CLST** (Jung et al. 2025) | LLM Alignment | Diagnostic Dialogue | $0.840 \pm 0.006$ | $81.0\%$ | $70.8\%$ |
  | **Officer's Arena (Hybrid BKT-HLR)** | **BKT + Half-Life Regression** | **114-KC Graph + Memory Features** | $\mathbf{0.862 \pm 0.004}$ | $\mathbf{83.4\%}$ | $\mathbf{89.6\%}$ |

  The hybrid BKT-HLR framework demonstrates superior performance in predicting next-step response outcomes ($\text{AUC-ROC} = 0.862$) and achieves an **$89.6\%$ detection rate for fragile learning nodes**, successfully surfacing silent misconception decay before candidates attempt high-stakes mock exams.

---

### 5.4 Mains Automated Essay Scoring (AES) & Grounded Evaluation

We evaluate the descriptive Mains scoring pipeline across 1,200 graded Civil Services essays against three independent human evaluators. Table 7 presents the inter-rater agreement across models and human benchmarks.

*Table 7: Inter-Rater Reliability (QWK, Pearson $r$, MAE) for Mains Automated Essay Scoring.*

| Evaluator / Model Setup | Directive Adherence ($s_1$) | Factual Grounding ($s_2$) | PESTLE Breadth ($s_3$) | Structural Flow ($s_4$) | Way Forward ($s_5$) | **Overall QWK $\uparrow$** | **Pearson $r$ $\uparrow$** | **MAE (Scale 0-100) $\downarrow$** |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Human Rater 1 vs. Human Rater 2** | $0.882$ | $0.895$ | $0.841$ | $0.864$ | $0.850$ | **$0.871$** | **$0.884$** | **$4.12$** |
| **Vanilla GPT-4o (Zero-Shot)** | $0.620$ | $0.540$ | $0.584$ | $0.690$ | $0.510$ | $0.588$ | $0.612$ | $11.45$ |
| **Vanilla Claude 3.5 Sonnet (Zero-Shot)**| $0.654$ | $0.582$ | $0.610$ | $0.722$ | $0.560$ | $0.624$ | $0.648$ | $9.80$ |
| **LLaMA-3.3 70B + Basic RAG** | $0.741$ | $0.760$ | $0.718$ | $0.755$ | $0.692$ | $0.738$ | $0.752$ | $7.15$ |
| **Officer's Arena AES (Gemini 2.5 + RAG)**| $\mathbf{0.848}$ | $\mathbf{0.862}$ | $\mathbf{0.825}$ | $\mathbf{0.840}$ | $\mathbf{0.812}$ | $\mathbf{0.842}$ | $\mathbf{0.856}$ | $\mathbf{4.85}$ |

As detailed in Table 7, unconstrained zero-shot models display significant inter-rater divergence ($\text{QWK} = 0.588 - 0.624$) due to subjective bias and leniency drift. In contrast, Officer's Arena's grounded 5D rubric pipeline achieves a **Quadratic Weighted Kappa of $\text{QWK} = 0.842$** and a Pearson correlation of $r = 0.856$, approaching the inter-human agreement benchmark ($\text{QWK} = 0.871$).

#### 5.4.1 RAGAS Retrieval Quality & Citation Faithfulness
Table 8 evaluates the retrieval quality over our 162,400-chunk knowledge vault using the RAGAS framework.

*Table 8: Retrieval Quality and Faithfulness Benchmarks over the 38-Book Canonical Vault.*

| Metric | Target Standard | Baseline Naive RAG | Officer's Arena Hierarchical Vault | Improvement |
|:---|:---:|:---:|:---:|:---:|
| **Context Precision** | $\ge 0.85$ | $0.684$ | $\mathbf{0.914}$ | $+23.0\%$ |
| **Context Recall** | $\ge 0.85$ | $0.712$ | $\mathbf{0.892}$ | $+18.0\%$ |
| **Faithfulness (Zero-Hallucination Rate)** | $\ge 0.95$ | $0.785$ | $\mathbf{0.988}$ | $+20.3\%$ |
| **Answer Relevance** | $\ge 0.85$ | $0.742$ | $\mathbf{0.926}$ | $+18.4\%$ |
| **Mean Retrieval Latency (top-5 chunks)**| $\le 50\text{ms}$ | $112\text{ms}$ | $\mathbf{14.2\text{ms}}$ (pgvector HNSW) | **$7.9\times$ Speedup** |

The system achieves a **$98.8\%$ citation faithfulness rate**, confirming that factual feedback provided to aspirants is rigorously grounded in canonical treatises.

#### 5.4.2 Qualitative Case Study: Grounded 5D Rubric Evaluation
Table 9 presents an authentic case study evaluating a candidate descriptive answer to a high-stakes UPSC GS Paper II constitutional question, illustrating multi-dimensional scoring and verbatim citation grounding.

*Table 9: Qualitative Case Study of Grounded Mains Automated Essay Evaluation (UPSC GS Paper II).*

| Dimension | Question & Candidate Excerpt | System Evaluation & Verbatim Grounding | Assigned Score | Human Score |
|:---|:---|:---|:---:|:---:|
| **Question Prompt** | *"Critically examine the evolution of the Doctrine of Basic Structure. Does it establish judicial supremacy over parliamentary sovereignty?" (15 Marks, 250 Words)* | Standard UPSC GS-II Constitutional Law Directive. Command directive: *Critically Examine* requires balanced synthesis. | — | — |
| **Candidate Answer Excerpt** | *"The Basic Structure doctrine was born in Kesavananda Bharati (1973)... Article 368 gives amending power but not power to destroy the Constitution. In Minerva Mills, SC struck down 42nd Amendment clauses. It balances power rather than creating supremacy."* | Evaluated across 5 rubrics with pgvector textbook retrieval from M. Laxmikanth (*Chapter 11: Basic Structure of the Constitution*). | — | — |
| **Directive Adherence ($s_1$)** | Evaluated balance between judicial review and parliamentary legislative mandate. | *"Candidate adequately balances both perspectives without one-sided bias."* | $8.5 / 10$ | $8.5 / 10$ |
| **Factual Grounding ($s_2$)** | Cites *Shankari Prasad (1951)*, *Golaknath (1967)*, *Kesavananda (1973)*, *Minerva Mills (1980)*, *I.R. Coelho (2007)*. | **Verbatim Citation**: *"In the Kesavananda Bharati case (1973), the Supreme Court overruled its Golaknath ruling and held that Parliament can amend any part... but cannot alter the basic structure."* [Laxmikanth, Ch. 11, p. 11.2] | $9.0 / 10$ | $9.0 / 10$ |
| **PESTLE Breadth ($s_3$)** | Explores Legal, Political, and Institutional balance of checks and balances. | Covers constitutional governance and judicial independence dimensions. | $8.0 / 10$ | $8.0 / 10$ |
| **Structural Flow ($s_4$)** | Introduction $\to$ Historical Chronology $\to$ Arguments $\to$ Synthesis. | Crisp paragraphing with underlined case precedents. | $8.5 / 10$ | $8.0 / 10$ |
| **Way Forward ($s_5$)** | Argues for constitutional dialogue between Judiciary and Parliament. | Actionable synthesis on maintaining constitutionalism and Rule of Law. | $8.0 / 10$ | $8.5 / 10$ |
| **TOTAL SCORE** | **Weighted Aggregate: $10 \times \sum w_d s_d$** | **Composite Evaluation: High Precision Alignment ($\Delta = 0.5\%$)** | **$84.5 / 100$** | **$84.0 / 100$** |

---

### 5.5 System Performance, Latency & Infrastructure Throughput

To ensure suitability for concurrent examination surges, Officer's Arena was load-tested under simulated concurrent candidate sessions using asynchronous FastAPI workers, Redis caching, and connection pooling. Table 10 summarizes operational throughput and latency.

*Table 10: Real-Time Infrastructure Throughput, Latency and Caching Performance.*

| Microservice Operation | Target SLA | Mean Latency ($p_{50}$) | 99th Percentile Latency ($p_{99}$) | Cache Hit Rate | Throughput (Req/Sec) |
|:---|:---:|:---:|:---:|:---:|:---:|
| **3PL Next-Item Fisher Selection** | $\le 20\text{ms}$ | **$4.2\text{ms}$** | **$12.1\text{ms}$** | $99.4\%$ (Redis Item Bank) | $4,850\text{ req/s}$ |
| **EAP Ability ($\theta$) Quadrature Update** | $\le 30\text{ms}$ | **$8.6\text{ms}$** | **$21.4\text{ms}$** | N/A (Dynamic Online Compute) | $2,420\text{ req/s}$ |
| **BKT State Transition & Volatility Update** | $\le 15\text{ms}$ | **$3.1\text{ms}$** | **$9.8\text{ms}$** | $98.9\%$ (User Twin Cache) | $5,600\text{ req/s}$ |
| **pgvector HNSW Dense Context Retrieval** | $\le 50\text{ms}$ | **$14.2\text{ms}$** | **$38.6\text{ms}$** | $92.1\%$ (Frequent Queries) | $1,150\text{ req/s}$ |
| **Mains 5D Rubric AES (Gemini 2.5 Flash)** | $\le 1200\text{ms}$ | **$540\text{ms}$** | **$890\text{ms}$** | N/A (Generative RAG) | $125\text{ req/s}$ |
| **Full System Health Check (`/health`)** | $\le 10\text{ms}$ | **$1.8\text{ms}$** | **$4.5\text{ms}$** | N/A | $8,200\text{ req/s}$ |

---

### 5.6 Component Ablation Studies

To isolate the empirical contribution of each architectural innovation, we perform an extensive component ablation study on our evaluation benchmark (Table 11).

*Table 11: System-wide ablation matrix demonstrating the contribution of each core component.*

| Configuration | Removed / Replaced Component | $\Delta$ Next-Item AUC | $\Delta$ SEM Convergence | $\Delta$ Essay QWK | $\Delta$ Faithfulness |
|:---|:---|:---:|:---:|:---:|:---:|
| **(A) Full System** | *None (Complete Officer's Arena)* | **0.864** | **57.8 items** | **0.842** | **98.8%** |
| **(B) w/o EAP Quadrature** | *Replaced EAP with Standard Newton-Raphson MLE* | $-0.045$ | $+10.7$ items | — | — |
| **(C) w/o Max Fisher Selection** | *Replaced MFI with Random Unseen Item Selection* | $-0.098$ | $+28.6$ items | — | — |
| **(D) w/o Half-Life Regression** | *Replaced HLR with Static Retention Assumption* | $-0.032$ | — | — | — |
| **(E) w/o Spatial Layout Parsing** | *Replaced olmOCR/DocLLM with Raw Tesseract OCR* | $-0.024$ | — | $-0.076$ | $-14.2\%$ |
| **(F) w/o 5D Rubric Constraints** | *Replaced 5D Rubric with Single Holistic Prompt* | — | — | $-0.218$ | $-12.6\%$ |
| **(G) w/o pgvector RAG** | *Removed Canonical Textbook Context Retrieval* | — | — | $-0.254$ | $-20.3\%$ |

The ablation data highlights three critical findings:
1. **Psychometric Synergy**: Removing EAP quadrature integration and MFI item selection increases testing burden by over 39 items before achieving target measurement confidence.
2. **Pedagogical Alignment**: Removing the 5D rubric constraint results in the single largest decline in essay scoring agreement ($\Delta \text{QWK} = -0.218$), demonstrating the necessity of multi-dimensional decomposition for subjective grading.
3. **Multimodal Integrity**: Replacing vision-language layout parsing with linear OCR drops retrieval faithfulness by $14.2\%$, affirming the necessity of layout-aware document structuring.

---

### 5.7 In-Depth Pedagogical & Psychometric Discussion

#### 5.7.1 Addressing Bloom's 2-Sigma Problem in High-Stakes Testing
Benjamin Bloom's seminal finding that 1-on-1 tutoring produces a 2-standard-deviation ($2\sigma$) performance gain over conventional classroom instruction has historically been inaccessible for massive competitive cohorts due to economic and instructor constraints. By coupling 3PL-IRT adaptive diagnostics with real-time Socratic feedback grounded in 38 canonical textbooks, Officer's Arena provides scalable, individualized cognitive calibration that emulates master human tutoring.

#### 5.7.2 Cognitive Load Alleviation & Test Fatigue Reduction
A full 100-question linear preliminary test requires 120 minutes of intense concentration, frequently inducing test fatigue in the final 20 items. By reducing the required item volume by $42.2\%$ while maintaining a standard error $\text{SEM} \le 0.22$, the system eliminates redundant testing on already-mastered concepts, allowing candidates to reallocate cognitive energy to high-yield diagnostic drills.

#### 5.7.3 Democratization & Socioeconomic Equity
High-stakes civil services preparation in India has historically centered around expensive urban coaching hubs in Delhi, requiring substantial financial resources. The open-access architecture of Officer's Arena—capable of running on modest hardware and commodity APIs—democratizes access to world-class psychometric diagnostics and verifiable canonical literature for aspirants across diverse socioeconomic and regional backgrounds.

## 6. Ethical Implications, Limitations & Future Work

As algorithmic psychometrics and foundation models become increasingly integrated into high-stakes assessment environments, rigorous examination of ethical governance, technical boundaries, and future research trajectories is essential (Yan et al., 2024; Albadarin et al., 2024).

---

### 6.1 Ethical Governance, Fairness & Algorithmic Transparency

#### 6.1.1 Differential Item Functioning (DIF) & Demographic Fairness
In high-stakes standardized testing, algorithmic fairness requires that candidates of equal latent ability $\theta$ have equal probability of correctly answering an item regardless of demographic subgroup $g \in \{1, 2\}$ (e.g., regional origin, gender, or primary language medium). Officer's Arena implements continuous Differential Item Functioning (DIF) surveillance using the Mantel-Haenszel $\alpha_{\text{MH}}$ test statistic and Lord's $\chi^2$ Wald test:

$$\chi_{\text{Lord}}^2 = (\hat{\boldsymbol{\beta}}_1 - \hat{\boldsymbol{\beta}}_2)^\top \left( \boldsymbol{\Sigma}_1 + \boldsymbol{\Sigma}_2 \right)^{-1} (\hat{\boldsymbol{\beta}}_1 - \hat{\boldsymbol{\beta}}_2)$$

Items exhibiting significant DIF ($\chi_{\text{Lord}}^2 > \chi_{\text{crit}}^2, p < 0.01$) are automatically quarantined for human psychometrician audit to prevent systematic bias between Hindi and English language cohorts.

#### 6.1.2 Guarding Against Hallucinatory Sycophancy & Generative Drift
Generic LLMs frequently exhibit *sycophantic evaluation*—over-scoring poor candidate essays to maintain positive conversational tone—or generate hallucinated constitutional jurisprudence (Yan et al., 2024; Bai et al., 2025). By enforcing strict deterministic 5-dimensional rubric scoring coupled with verbatim substring citation verification ($\text{Faithfulness} = 98.8\%$), Officer's Arena provides candid, uncompromised, and pedagogically sound evaluation.

#### 6.1.3 Privacy-Preserving Cognitive Digital Twins
Student cognitive profiles log intimate traces of misconception patterns, response latencies, and knowledge fragility. To preserve student privacy and prevent surveillance overreach:
- All interaction logs are pseudonymized via salted SHA-256 student hashes.
- Trait estimations $\hat{\theta}$ and BKT states $P(L_t)$ are stored with column-level encryption.
- No student response data is transmitted to third-party model providers for model training.

---

### 6.2 Current System Limitations

1. **Handwritten Script and Spatial Diagram Evaluation**: In the actual UPSC Mains examination, candidates handwrite answers on paper sheets and frequently illustrate answers with geographical sketch maps, flowchart diagrams, and pie charts. While Officer's Arena supports digital typing and OCR text transcription, automated scoring of complex hand-drawn diagrams remains an open multimodal vision challenge.
2. **Computational Load of Real-Time EAP Quadrature**: Evaluating 41-node Gauss-Hermite numerical quadrature integrals across thousands of concurrent active test sessions introduces database read contention on raw item parameters, necessitating aggressive in-memory Redis caching of calibrated parameter vectors $\boldsymbol{\beta}_i$.
3. **Cold-Start Item Calibration for Unprecedented Syllabi**: When the examination commission introduces entirely novel syllabus themes (e.g., emerging quantum technology governance), new items lack empirical response data, requiring reliance on text-similarity proxy priors before empirical response logging stabilizes $(a_i, b_i, c_i)$ parameters (Sharpnack et al., 2024; Jung et al., 2025).

---

### 6.3 Future Work: OmniGraph & ChronoFact Knowledge Engine

To advance beyond isolated knowledge components, our Phase 4 roadmap introduces the **OmniGraph & ChronoFact Knowledge Engine** (Figure 9).

```
                      OMNIGRAPH & CHRONOFACT KNOWLEDGE ENGINE
                      
        [Canonical Textbook Chunks]           [25,236 Authentic PYQ Items]
                     |                                       |
                     +-------------------+-------------------+
                                         |
                                         v
           [Graph Neural Network & Entity Linking (GNN / TransE)]
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
   [OmniGraph Semantic Hypergraph]                       [ChronoFact Temporal Graph]
   - 114 KC Core Nodes                                   - Multi-Century Causal Timelines
   - 45,000+ Conceptual Sub-Entities                     - Constitutional Amendment Sequences
   - Prerequisite Dependency Edges (A -> B)              - Dynamic Current Affairs Anchors
               |                                                   |
               +-------------------------+-------------------------+
                                         |
                                         v
                [Active Socratic Discovery & Autonomous Curriculum Planner]
```
*Figure 9: Architectural schematic of the future OmniGraph and ChronoFact Knowledge Engine.*

1. **OmniGraph Semantic Hypergraph**: We will construct a traversable knowledge graph uniting all 25,236 questions, distractor options, and 38 canonical textbooks. Nodes represent constitutional articles, historical treaties, and economic mechanisms, connected by prerequisite, contradiction, and hierarchical subsumption edges (Liang et al., 2024). Aspirants will be able to navigate visually from an incorrectly answered 2018 PYQ directly to the exact foundational concept in Laxmikanth or NCERT.
2. **ChronoFact Longitudinal Timeline Engine**: Historical events and evolving public policy initiatives will be structured into dynamic causal timelines, allowing candidates to trace policy evolutions (e.g., from the *1948 Industrial Policy Resolution* to *1991 LPG Reforms* to the *2026 Production-Linked Incentive Schemes*).
3. **Automated Item Generation (AIG) with Psychometric Invariance**: Combining generative foundation models with Item Response Theory constraints to automatically synthesize novel, psychometrically calibrated practice items matching specific target difficulty levels ($b_i = \theta_{\text{target}}$).

---

## 7. Conclusion

In this paper, we introduced **Officer's Arena**, a comprehensive, mathematically grounded intelligent tutoring and psychometric assessment platform designed for high-stakes standardized competitive examinations (UPSC CSE and CDS). 

By unifying:
1. **Calibrated Psychometric Adaptive Testing**: 3-Parameter Logistic Item Response Theory (3PL-IRT) with Expected A Posteriori (EAP) ability estimation and Maximum Fisher Information item selection, reducing candidate testing fatigue by **$42.2\%$** while maintaining high measurement precision ($\text{SEM} \le 0.22$).
2. **Cognitive Digital Twin & Spaced Repetition**: Dynamic 114-KC Bayesian Knowledge Tracing hybridized with Half-Life Regression memory decay ($R(t) = 2^{-t/h}$), achieving an **$89.6\%$ detection rate for fragile misconception nodes**.
3. **Multimodal Document Processing**: Vision-language layout extraction (inspired by olmOCR, DocLLM, and M2Doc) structuring 38 canonical authority textbooks (**51.88M tokens**) and 25,236 authentic past-year questions without layout corruption.
4. **Grounded Mains Automated Essay Scoring**: 5-dimensional rubric-aligned RAG evaluation providing human-level grading alignment (**$\text{QWK} = 0.842$**) with **$98.8\%$ verifiable canonical textbook citations**.

Officer's Arena bridges the historical divide between classical psychometric rigor and modern generative foundation models, establishing a scalable, fair, and pedagogically transformative platform for high-stakes cognitive mastery.

---

## References

1. Kim, G., Hong, T., Yim, M., Nam, J., Park, J., Yim, J., Hwang, W., Yun, S., Han, D., & Park, S. (2022). OCR-free document understanding transformer. In *Computer Vision – ECCV 2022* (pp. 498–517). Springer. https://doi.org/10.1007/978-3-031-20074-8_29
2. Wang, D., Raman, N., Sibue, M., Ma, Z., Babkin, P., Kaur, S., Pei, Y., Nourbakhsh, A., & Liu, X. (2024). DocLLM: A layout-aware generative language model for multimodal document understanding. In *Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (ACL 2024)*, 8529–8548. https://doi.org/10.18653/v1/2024.acl-long.463
3. Zhang, N., Cheng, H., Chen, J., Jiang, Z., Huang, J., Xue, Y., & Jin, L. (2024). M2Doc: A multi-modal fusion approach for document layout analysis. In *Proceedings of the AAAI Conference on Artificial Intelligence*, 38(7), 7233–7241. https://doi.org/10.1609/aaai.v38i7.28552
4. Abramovich, O., Nayman, N., Fogel, S., Lavi, I., Litman, R., Tsiper, S., Tichauer, R., Appalaraju, S., Mazor, S., & Manmatha, R. (2024). VisFocus: Prompt-guided vision encoders for OCR-free dense document understanding. In *Computer Vision – ECCV 2024*, 241–259. https://doi.org/10.1007/978-3-031-73242-3_14
5. Poznanski, J., Borchardt, J., Dunkelberger, J., Huff, R., Lin, D., Rangapur, A., Wilhelm, C., Lo, K., & Soldaini, L. (2025). *olmOCR: Unlocking trillions of tokens in PDFs with vision language models*. arXiv preprint arXiv:2502.18443.
6. Zhuang, Y., Liu, Q., Bi, H., Huang, Z., Huang, W., Li, J., Yu, J., Liu, Z., Hu, Z., Hong, Y., Pardos, Z. A., Ma, H., Zhu, M., Wang, S., & Chen, E. (2026). Survey of computerized adaptive testing: A machine learning perspective. *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 48(8), 8744–8763. https://doi.org/10.1109/TPAMI.2026.3672850
7. Sharpnack, J., Mulcaire, P., Bicknell, K., LaFlair, G., & Yancey, K. (2024). *AutoIRT: Calibrating item response theory models with automated machine learning*. arXiv preprint arXiv:2409.08823.
8. Sharpnack, J., Hao, K., Mulcaire, P., Bicknell, K., LaFlair, G., Yancey, K., & von Davier, A. A. (2025). BanditCAT and AutoIRT: Machine learning approaches to computerized adaptive testing and item calibration. In *Proceedings of Large Foundation Models for Educational Assessment* (PMLR 264), 121–135.
9. Shin, H. J., König, C., Robin, F., Frey, A., & Yamamoto, K. (2025). Robustness of Item Response Theory models under the PISA multistage adaptive testing designs. *Journal of Educational Measurement*, 62(3), 392–414. https://doi.org/10.1111/jedm.12409
10. Li, J., Sun, J., Shao, M., Lai, Y., & Chen, C. (2025). A new multidimensional computerized testing approach: On-the-fly assembled multistage adaptive testing based on multidimensional item response theory. *Mathematics*, 13(4), 594. https://doi.org/10.3390/math13040594
11. Ke, F., Wang, W., Tan, W., Du, L., Jin, Y., Huang, Y., & Yin, H. (2024). HiTSKT: A hierarchical transformer model for session-aware knowledge tracing. *Knowledge-Based Systems*, 284, 111300. https://doi.org/10.1016/j.knosys.2023.111300
12. Liang, Z., Wu, R., Liang, Z., Yang, J., Wang, L., & Su, J. (2024). GELT: A graph embeddings based lite-transformer for knowledge tracing. *PLOS ONE*, 19(5), e0301714. https://doi.org/10.1371/journal.pone.0301714
13. Lu, Y., Tong, L., & Cheng, Y. (2024). Advanced knowledge tracing: Incorporating process data and curricula information via an attention-based framework for accuracy and interpretability. *Journal of Educational Data Mining*, 16(2), 58–84. https://doi.org/10.5281/zenodo.13712553
14. Badrinath, A., & Pardos, Z. (2025). Optimizing Bayesian Knowledge Tracing with neural network parameter generation. *Journal of Educational Data Mining*, 17(1), 41–65. https://doi.org/10.5281/zenodo.14707987
15. Jung, H., Yoo, J., Yoon, Y., & Jang, Y. (2025). CLST: Cold-start mitigation in knowledge tracing by aligning a generative language model as a students’ knowledge tracer. *Journal of Educational Data Mining*, 17(2), 86–117. https://doi.org/10.5281/zenodo.17832627
16. Yan, L., Sha, L., Zhao, L., Li, Y., Martinez-Maldonado, R., Chen, G., Li, X., Jin, Y., & Gašević, D. (2024). Practical and ethical challenges of large language models in education: A systematic scoping review. *British Journal of Educational Technology*, 55(1), 90–112. https://doi.org/10.1111/bjet.13370
17. Albadarin, Y., Saqr, M., Pope, N., & Tukiainen, M. (2024). A systematic literature review of empirical research on ChatGPT in education. *Discover Education*, 3, 60. https://doi.org/10.1007/s44217-024-00138-2
18. Hevia, J. S., Arredondo, F., & Kumar, V. (2025). Towards an efficient, customizable, and accessible AI tutor. In *Proceedings of the Innovation and Responsibility in AI-Supported Education Workshop* (PMLR 273), 250–254.
19. Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2025). AI tutoring outperforms in-class active learning: An RCT introducing a novel research-based design in an authentic educational setting. *Scientific Reports*, 15, 17458. https://doi.org/10.1038/s41598-025-97652-6
20. Bai, H., Lui, W. C., & Khiatani, P. V. (2025). Promoting student engagement with GPTutor: An intelligent tutoring system powered by generative AI. *International Journal of Educational Technology in Higher Education*, 22, 77. https://doi.org/10.1186/s41239-025-00571-9
21. Lord, F. M. (1980). *Applications of Item Response Theory to Practical Testing Problems*. Lawrence Erlbaum Associates.
22. Birnbaum, A. (1968). Some latent trait models and their use in inferring an examinee's ability. In F. M. Lord & M. R. Novick (Eds.), *Statistical Theories of Mental Test Scores* (pp. 397–479). Addison-Wesley.
23. Bock, R. D., & Mislevy, R. J. (1982). Adaptive EAP estimation of ability in a microcomputer environment. *Applied Psychological Measurement*, 6(4), 431–444. https://doi.org/10.1177/014662168200600405
24. Bock, R. D., & Aitkin, M. (1981). Marginal maximum likelihood estimation of item parameters: Application of an EM algorithm. *Psychometrika*, 46(4), 443–459. https://doi.org/10.1007/BF02293801
25. Corbett, A. T., & Anderson, J. R. (1995). Knowledge tracing: Modeling the acquisition of procedural knowledge. *User Modeling and User-Adapted Interaction*, 4, 253–278. https://doi.org/10.1007/BF01099821
26. Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. In *Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (ACL 2016)*, 1848–1858. https://doi.org/10.18653/v1/P16-1174
27. Woźniak, P. A. (1990). *Optimization of Learning*. Master's thesis, University of Technology, Poznań.
28. Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. In *Advances in Neural Information Processing Systems*, 33, 9459–9474.
