# SixSafety System - Brownfield Architecture Analysis

**Project Name:** SixSafety - Toronto Police MCI Safety Recommendation System
**Analysis Date:** 2025-11-05
**Analyzed By:** BMad Master
**Purpose:** Major refactoring and modernization planning

---

## Executive Summary

SixSafety is a three-tier AI-powered safety recommendation system designed for Toronto residents. The system combines an interactive survey interface with a RAG (Retrieval-Augmented Generation) pipeline to generate personalized neighborhood safety plans based on Toronto Police Service resources.

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SIXSAFETY SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  TIER 1: WiseNeighbourhood (Frontend)                   │  │
│  │  Repository: ./WiseNeighbourhood/                       │  │
│  │  Technology: Streamlit + LangChain + OpenAI/Gemini      │  │
│  │  Purpose: Interactive survey with dual LLM agents       │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │ HTTP POST                            │
│                         │ JSON Payload                         │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  TIER 2: Node.js API Server (Middleware) ⚠️             │  │
│  │  Location: https://api.ai-fundamentals.live/api2/       │  │
│  │  Repository: NOT IN LOCAL CODEBASE                      │  │
│  │  Endpoints: /plan, /getPlan                             │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │ Triggers                             │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  TIER 3: MMAI5040_TP (Backend RAG Pipeline)             │  │
│  │  Repository: ./MMAI5040_TP/                             │  │
│  │  Technology: LangChain + Pinecone + OpenAI + RAGAS      │  │
│  │  Purpose: Generate personalized safety plans            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Critical Finding: Missing Component

**⚠️ WARNING:** The Node.js middleware API server that orchestrates communication between the frontend and backend is **NOT present in the local repositories**. This component exists at `https://api.ai-fundamentals.live/api2/` but its source code is not available for analysis.

---

## Part 1: WiseNeighbourhood - Frontend Survey System

### Repository Structure

```
WiseNeighbourhood/
├── main.py                      # Streamlit application entry point
├── requirements.txt             # Python dependencies
├── Assets/                      # CSV data and images
│   └── Safety Risks by Neighbourhood & Offence.csv
├── configs/                     # LLM prompt configurations
│   ├── config.json             # Conversational & UI agent prompts
│   ├── few_shot_examples.json  # Few-shot learning examples
│   ├── reasoning_examples.json
│   └── acting_examples.json
├── llm_utils/                   # LLM interaction utilities
│   ├── agents.py               # ConversationalAgent & UIAgent
│   ├── conversation.py         # Conversation orchestrator
│   ├── prompt_assembly.py      # Prompt construction
│   ├── pydantic_models.py      # UI element data models
│   ├── stream_handler.py       # Streaming response handler
│   ├── config_loader.py        # Configuration loader
│   └── maps.py                 # Neighborhood mapping
└── streamlit_utils/             # Streamlit-specific utilities
    ├── initialization.py       # Session state initialization
    └── ui_creator.py           # Dynamic UI generation
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Streamlit | 1.30.0 | Web UI framework |
| LLM Framework | LangChain | 0.1.5 | Agent orchestration |
| LLM Providers | OpenAI, Google Gemini | - | Conversational AI |
| Data Processing | Pandas, GeoPandas | 2.1.0 | Neighborhood data handling |
| Validation | Pydantic | 2.4.2 | UI model validation |
| Visualization | Matplotlib, Seaborn | - | Data visualization |

### Architecture Details

#### Dual-Agent System

The frontend employs a sophisticated dual-agent architecture:

**1. ConversationalAgent** (`llm_utils/agents.py:38-76`)
- **Model:** GPT-4-turbo or Gemini-pro (configurable)
- **Streaming:** Enabled
- **Memory:** Maintains conversation history
- **Prompts:** Uses few-shot learning with examples from 3 JSON files
- **Purpose:** Conducts dynamic Q&A to gather safety context

**2. UIAgent** (`llm_utils/agents.py:78-118`)
- **Model:** GPT-4-turbo or Gemini-pro (configurable)
- **Streaming:** Disabled
- **Output:** Structured JSON validated by Pydantic
- **Purpose:** Converts conversation responses into interactive UI elements
- **Retry Logic:** 3 attempts with validation error handling

#### UI Element Types

The system generates dynamic UI elements based on conversation flow:

```python
# Pydantic Models (llm_utils/pydantic_models.py)
- RadioButtons: Multiple choice questions
- MultiSelect: Multiple selection options
- Slider: Numeric range inputs
- Checkbox: Yes/No questions
```

#### Data Flow - Frontend

```
1. User selects neighbourhood → loads crime statistics from CSV
   (main.py:166-183)

2. Initial neighbourhood data sent as first message
   Format: "Neighbourhood: {name} - {crime_type}: {risk_level}, ..."

3. Conversational loop (3 exchanges):
   a. ConversationalAgent generates question with special delimiter ␃
   b. Text before ␃ → displayed to user
   c. Text after ␃ → sent to UIAgent
   d. UIAgent creates structured JSON with UI elements
   e. UI rendered dynamically via ui_creator.py
   f. User responses collected and assembled

4. Survey completion (after 6+ messages):
   a. get_survey_respond() extracts structured data (main.py:118-155)
   b. Data formatted as JSON:
      {
        "Neighbourhood": "string",
        "Crime Type": ["type: level", ...],
        "user-context": ["Q: ...", "A: ...", ...]
      }

5. HTTP POST to middleware API (main.py:88-102):
   URL: https://api.ai-fundamentals.live/api2/plan
   Payload: { inputData: JSON, id: UUID }

6. Polling for results (main.py:105-115):
   URL: https://api.ai-fundamentals.live/api2/getPlan
   Displays progress bar (70-90 seconds)
   Retrieves and displays generated safety plan
```

### Security & Configuration

#### API Key Management (`streamlit_utils/initialization.py`)

```python
# Priority order:
1. Streamlit secrets (st.secrets)
2. Manual input via sidebar (password field)

# Supported providers:
- OpenAI (openai_api_key)
- Google (google_api_key)
```

#### Configuration Files

**config.json** - Contains system prompts for both agents:
- `conversational_prompt`: Guides conversation flow for 3 exchanges
- `ui_prompt`: Instructions for JSON generation with UI elements

**Key constraints:**
- Must collect crime types in first exchange
- Minimum 3 UI elements per exchange
- No text inputs allowed
- No illegal devices (pepper spray) suggested
- Canadian legal compliance

### Key Files & Entry Points

| File | Lines | Purpose | Critical Functions |
|------|-------|---------|-------------------|
| `main.py` | 379 | Application entry point | `main()`, `handle_submission()`, `final_submission()` |
| `llm_utils/conversation.py` | 65 | Orchestrates dual agents | `Conversation.__call__()` |
| `llm_utils/agents.py` | 118 | Defines agent behavior | `ConversationalAgent.__call__()`, `UIAgent.__call__()` |
| `streamlit_utils/initialization.py` | 60 | Session state setup | `initialize_session()` |

### Integration Points

**Outbound:**
- **Endpoint:** `POST https://api.ai-fundamentals.live/api2/plan`
- **Payload:** JSON with neighbourhood, crime types, user context
- **Authentication:** None (public endpoint)
- **Error Handling:** Basic `requests.exceptions.RequestException` (main.py:100)

**Inbound:**
- **Endpoint:** `POST https://api.ai-fundamentals.live/api2/getPlan`
- **Response:** `{ success: boolean, plan: string }`
- **Polling:** Synchronous with 70-90 second progress bar

---

## Part 2: MMAI5040_TP - Backend RAG Pipeline

### Repository Structure

```
MMAI5040_TP/
├── main.py                      # RAG pipeline entry point
├── requirements.txt             # Python dependencies
├── pipeline_initialization_code/ # One-time setup scripts
│   ├── Original pipeline/
│   │   ├── 1_informationretreival.py  # Firecrawl scraper
│   │   ├── 2_ingestion.py             # Pinecone ingestion
│   │   └── torontopublicsafetycorpus.json  # Scraped data
│   └── non_copyright pipeline/
│       ├── filter_corpus.py
│       └── modified_ingestion.py
├── evals_LLMOutput_V3.py       # LLM output evaluation
├── evals_precision_recall_V3.py # Retrieval metrics
├── evals_generate_test_set.py  # Test set generation
├── evals_run_all.py            # Evaluation orchestrator
├── generated_answers.json       # Evaluation results
├── rag_results.csv             # RAG metrics
├── precision_recall_results.csv # Retrieval metrics
├── test_sets/                   # Evaluation test sets
├── completed_evaluation_results/ # Historical results
├── prompt_engineering_main/     # Prompt experiments
└── tagging_main/               # LangSmith tagging experiments
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| LLM Framework | LangChain | Latest | RAG orchestration |
| Vector Store | Pinecone | 2.2.4+ | Semantic search |
| Embeddings | OpenAI text-embedding-3-large | - | Document embeddings |
| LLM | GPT-4 | gpt-4 | Safety plan generation |
| Web Scraping | Firecrawl | - | Data collection |
| Evaluation | RAGAS | 0.0.22 | RAG metrics |
| Observability | LangSmith | - | Tracing & monitoring |

### Architecture Details

#### RAG Pipeline - Two-Stage Chain

The backend implements a sophisticated two-stage LLM chain using LangChain Expression Language (LCEL):

**Stage 1: Analysis Chain** (`main.py:412-419`)

```python
analysis_chain = create_retrieval_chain(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 10}),
    combine_docs_chain=create_stuff_documents_chain(
        llm=ChatOpenAI(model="gpt-4", temperature=0.0),
        prompt=FIRST_SAFETY_PROMPT
    )
)
```

**Purpose:** Analyze safety concerns and resources
- Retrieves top 10 relevant documents from Pinecone
- Evaluates public safety needs
- Performs critical analysis of risk factors
- Verifies evidence and citations
- Identifies information gaps

**Stage 2: Plan Generation Chain** (`main.py:421-432`)

```python
plan_chain = (
    {
        "input": lambda x: x["input"],
        "analysis": lambda x: x["analysis"],
        "example_safety_plans": lambda x: x["example_safety_plans"]
    } |
    plan_prompt |
    chat |
    StrOutputParser()
)
```

**Purpose:** Transform analysis into actionable safety plan
- Uses analysis from Stage 1
- Leverages one-shot examples (Trinity-Bellwoods)
- Generates 4-section structured safety plan

**Complete Pipeline** (`main.py:448-484`)

```python
safety_plan_chain = (
    analysis_chain |          # Stage 1: Analyze
    transform |               # Extract analysis
    plan_chain |              # Stage 2: Generate
    add_headers_and_sources   # Format final output
)
```

#### Core Function: `generate_safety_plan()`

**Location:** `main.py:113-517`

**Signature:**
```python
def generate_safety_plan(
    neighbourhood: str,
    crime_type: List[str],
    user_context: List[str]
) -> str
```

**Input Example:**
```python
{
    "neighbourhood": "York University Heights (27)",
    "crime_type": ["Assault: Low", "Robbery: Low"],
    "user_context": [
        "Q: Do you carry a fully charged phone?",
        "A: Yes",
        "Q: Do you have planned safe routes?",
        "A: No",
        ...
    ]
}
```

**Output Format:**
```
CITY OF TORONTO SERVICE SAFETY PLAN
Neighbourhood: {neighbourhood}
Primary Concerns: {crime_types}

1. NEIGHBOURHOOD-SPECIFIC ASSESSMENT:
   [Analysis of neighbourhood characteristics and risks]

2. TARGETED SAFETY RECOMMENDATIONS:
   [For each crime type:]
   - Prevention Strategies
   - Warning Signs
   - Immediate Actions
   - Community Resources

3. PERSONAL SAFETY PROTOCOL:
   - Daily Safety Habits
   - Essential Safety Tools
   - Emergency Contact Information
   - Community Support Services

4. PREVENTIVE MEASURES:
   - Home/Property Security Recommendations
   - Personal Safety Technology Suggestions
   - Community Engagement Opportunities
   - Reporting Procedures

Sources Consulted:
[List of Toronto Police Service resources with URLs]

----
Note: [Emergency contact information]
```

#### Vector Store Configuration

**Pinecone Setup** (`pipeline_initialization_code/Original pipeline/2_ingestion.py`)

```python
# Chunking Strategy:
RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", " ", ""],
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)

# Metadata Structure:
{
    'source': 'https://...',     # Toronto Police Service URL
    'title': 'Document Title',
    'text': 'Preview (1000 chars)'
}

# Embeddings:
OpenAIEmbeddings(model="text-embedding-3-large")

# Retrieval:
search_kwargs={"k": 10}  # Top 10 most relevant chunks
```

#### Data Sources

**Toronto Public Safety Corpus** (`pipeline_initialization_code/`)

**Collection Method:** Firecrawl web scraping (`1_informationretreival.py`)
- Toronto Police Service crime prevention articles
- City of Toronto safety resources
- Government safety guidelines

**Data Format:** JSON with markdown content
```json
{
  "data": [
    {
      "markdown": "...",
      "metadata": {
        "sourceURL": "https://...",
        "title": "...",
        "url": "..."
      }
    }
  ]
}
```

**Corpus Variants:**
1. `torontopublicsafetycorpus.json` - Full corpus
2. `non_copyrighted_torontopublicsafetycorpus.json` - Filtered version

#### Prompt Engineering

**FIRST_SAFETY_PROMPT** (`main.py:280-333`)
- Role: City of Toronto safety advisor
- Methodology: 3-step analysis
  1. Understanding Public Safety Needs
  2. Critical Analysis
  3. Evidence Verification
- Output: 4-section analysis with citations

**SECOND_SAFETY_PROMPT** (`main.py:335-393`)
- Role: Safety plan generator
- Input: User request + analysis + examples
- Constraints:
  - No headers about city/neighbourhood
  - Start with assessment
  - Address ALL safety concerns (low/medium/high)
  - No legal/medical/financial advice
  - Acknowledge information gaps

**Example Plans:**
- Trinity-Bellwoods (included in every request)
- York University Heights (available but commented out)
- Annex (available but commented out)

*Note: Only one example used to reduce token costs*

### Evaluation Framework

The system includes comprehensive evaluation using RAGAS:

**Evaluation Scripts:**

| Script | Purpose | Metrics |
|--------|---------|---------|
| `evals_generate_test_set.py` | Generate test sets from LangSmith traces | - |
| `evals_LLMOutput_V3.py` | Evaluate LLM response quality | Faithfulness, Answer Relevancy |
| `evals_precision_recall_V3.py` | Evaluate retrieval quality | Context Precision, Context Recall |
| `evals_run_all.py` | Orchestrate all evaluations | Combined metrics |

**Test Set Structure:**
```json
{
  "user_input": "...",
  "reference": "...",
  "reference_contexts": ["..."],
  "retrieved_contexts": ["..."],
  "response": "..."
}
```

**Evaluation Results Storage:**
- `rag_results.csv` - RAG metrics over time
- `precision_recall_results.csv` - Retrieval metrics
- `generated_answers.json` - LLM responses
- `completed_evaluation_results/` - Historical results

### LangSmith Integration

**Tracing Configuration** (`main.py:502-509`)

```python
config={
    "tags": [
        "application_example",
        "one_shot_example",
        "trinity_bellwoods_york_examples",
        f"model_{chat.model_name}"
    ]
}
```

**Purpose:**
- Track chain execution
- Monitor token usage
- Debug prompt performance
- Generate evaluation datasets
- Compare model versions

### Key Files & Entry Points

| File | Lines | Purpose | Critical Functions |
|------|-------|---------|-------------------|
| `main.py` | 545 | RAG pipeline entry | `generate_safety_plan()` |
| `pipeline_initialization_code/1_informationretreival.py` | - | Web scraping | Firecrawl integration |
| `pipeline_initialization_code/2_ingestion.py` | ~150 | Vector store setup | `load_json_data()`, `text_splitter()` |
| `evals_run_all.py` | - | Evaluation orchestrator | Runs all eval scripts |

### Integration Points

**Inbound:**
- **Trigger:** Unknown (Node.js middleware)
- **Input:** Function call with neighbourhood, crime_type, user_context
- **Expected Format:** Lists of strings

**Outbound:**
- **Dependencies:**
  - Pinecone API (vector search)
  - OpenAI API (embeddings + GPT-4)
  - LangSmith API (tracing)

---

## Integration Architecture

### Data Flow - Complete System

```
┌──────────────────────────────────────────────────────────────────┐
│                      COMPLETE DATA FLOW                          │
└──────────────────────────────────────────────────────────────────┘

[1] User Input Phase (WiseNeighbourhood)
    ├── User selects neighbourhood from dropdown
    ├── System loads crime statistics from CSV
    │   Assets/Safety Risks by Neighbourhood & Offence.csv
    └── Initial message formatted:
        "Neighbourhood: {name} - Crime1: Risk1, Crime2: Risk2, ..."

[2] Conversational Survey (WiseNeighbourhood)
    ├── ConversationalAgent asks dynamic questions (3 exchanges)
    ├── UIAgent generates interactive form elements
    ├── User provides context via UI elements
    └── Responses collected in session state

[3] Data Preparation (WiseNeighbourhood)
    ├── get_survey_respond() extracts structured data
    ├── Format:
    │   {
    │     "Neighbourhood": "string",
    │     "Crime Type": ["type: level", ...],
    │     "user-context": ["Q: ...", "A: ...", ...]
    │   }
    └── Generate unique UUID for request tracking

[4] API Request (WiseNeighbourhood → Node.js)
    ├── POST https://api.ai-fundamentals.live/api2/plan
    ├── Payload: { inputData: JSON, id: UUID }
    └── Headers: Content-Type: application/json

[5] Middleware Processing (Node.js) ⚠️ UNKNOWN
    ├── Receive survey data
    ├── ??? How does it trigger MMAI5040_TP ???
    │   Possibilities:
    │   - Direct Python subprocess
    │   - Queue system (Redis, RabbitMQ)
    │   - HTTP endpoint to Python FastAPI
    │   - AWS Lambda invocation
    └── Store result with UUID

[6] RAG Pipeline Execution (MMAI5040_TP)
    ├── generate_safety_plan() called with structured input
    ├── Format input for LangChain:
    │   LOCATION: {neighbourhood}
    │   SAFETY CONCERNS: {crime_types}
    │   ADDITIONAL USER CONTEXT: {qa_pairs}
    │
    ├── Stage 1: Analysis Chain
    │   ├── Query Pinecone with input (k=10)
    │   ├── Retrieve Toronto Police Service documents
    │   ├── GPT-4 analyzes with FIRST_SAFETY_PROMPT
    │   └── Output: Detailed analysis with citations
    │
    ├── Stage 2: Plan Generation Chain
    │   ├── Take analysis output
    │   ├── Add Trinity-Bellwoods example
    │   ├── GPT-4 generates with SECOND_SAFETY_PROMPT
    │   └── Output: Structured safety plan
    │
    ├── Post-processing
    │   ├── Add headers (neighbourhood, concerns)
    │   ├── Extract and format sources
    │   ├── Add emergency contact footer
    │   └── Return formatted string
    │
    └── Result stored via middleware

[7] Plan Retrieval (WiseNeighbourhood ← Node.js)
    ├── Display progress bar (70-90 seconds)
    ├── Poll POST https://api.ai-fundamentals.live/api2/getPlan
    ├── Payload: { id: UUID }
    ├── Response: { success: boolean, plan: string }
    └── Display plan to user

[8] User Actions (WiseNeighbourhood)
    ├── View complete safety plan
    ├── Option: Restart session (clear state)
    └── Option: Download/export (not implemented)
```

### API Contract

#### Request to Middleware

**Endpoint:** `POST https://api.ai-fundamentals.live/api2/plan`

**Request:**
```json
{
  "inputData": "{\"Neighbourhood\":\"York University Heights (27)\",\"Crime Type\":[\"Assault: Low\",\"Robbery: Low\"],\"user-context\":[\"Q: Do you carry a fully charged phone?\",\"A: Yes\",\"Q: Do you have planned safe routes?\",\"A: No\"]}",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan generation started"
}
```

#### Retrieve from Middleware

**Endpoint:** `POST https://api.ai-fundamentals.live/api2/getPlan`

**Request:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "plan": "CITY OF TORONTO SERVICE SAFETY PLAN\n..."
}
```

### Missing Components Analysis

#### ⚠️ Critical Gap: Node.js Middleware

**What we know:**
- Hosted at `https://api.ai-fundamentals.live`
- Endpoints: `/api2/plan`, `/api2/getPlan`
- Accepts and returns JSON
- Stores plans with UUID keys
- Processing takes 70-90 seconds

**What we DON'T know:**
- Source code location
- How it triggers MMAI5040_TP
- Data persistence mechanism (database?)
- Error handling and retry logic
- Rate limiting or authentication
- Deployment configuration
- Scaling strategy
- Logging and monitoring

**Questions for User:**
1. Where is the Node.js middleware source code?
2. Is MMAI5040_TP deployed as a service, or invoked directly?
3. What database stores the plan results?
4. Are there any authentication mechanisms?
5. How is the system deployed in production?

---

## Technology Stack Summary

### Frontend (WiseNeighbourhood)

```yaml
Runtime:
  - Python 3.x
  - Streamlit 1.30.0

Core Dependencies:
  - langchain==0.1.5
  - langchain-community==0.0.17
  - langchain-core==0.1.17
  - langchain-google-genai==0.0.6
  - langchain-openai==0.0.5
  - openai==1.10.0
  - google-generativeai==0.3.2

LLM Providers:
  - OpenAI (gpt-3.5-turbo, gpt-4-turbo)
  - Google (gemini-pro)

Data Processing:
  - pandas==2.1.0
  - geopandas
  - pydantic==2.4.2

Visualization:
  - matplotlib
  - seaborn

Database:
  - pymongo==4.5.0 (not actively used in main.py)
```

### Backend (MMAI5040_TP)

```yaml
Runtime:
  - Python 3.x

Core Dependencies:
  - langchain
  - langchain-openai
  - langchain-pinecone
  - langchain-community
  - langgraph
  - langchainhub
  - langchain-core

Vector Store:
  - pinecone-client>=2.2.4

LLM Provider:
  - OpenAI GPT-4
  - text-embedding-3-large

Evaluation:
  - ragas==0.0.22
  - datasets>=2.16.1
  - evaluate>=0.4.0

Web Scraping:
  - firecrawl-py
  - beautifulsoup4
  - html2text

Data Processing:
  - pandas
  - pypdf, PyPDF2, PyPDF4
  - pdfplumber
  - unstructured
  - nltk

Observability:
  - langsmith
  - torch (for RAGAS)
```

### Middleware (Unknown)

```yaml
Runtime:
  - Node.js (version unknown)

Suspected Dependencies:
  - Express.js (web framework)
  - axios/node-fetch (HTTP client)
  - Database driver (unknown DB)
  - Possibly: bull/bee-queue (job queue)
```

---

## Security Analysis

### Authentication & Authorization

#### Frontend
**Status:** ⚠️ Limited security

- **API Keys:** Managed via Streamlit secrets or sidebar input
- **Storage:** Session-based (not persisted)
- **Providers:** OpenAI, Google
- **Transmission:** HTTPS to external APIs

**Concerns:**
- No user authentication in the application
- API keys stored in Streamlit secrets (server-side)
- No rate limiting visible
- Public access to application (if deployed)

#### Backend
**Status:** ⚠️ Environment-based security

- **API Keys:** Loaded from `.env` file
- **Required Keys:**
  - `OPENAI_API_KEY`
  - `PINECONE_API_KEY`
  - `PINECONE_INDEX_NAME`
  - `LANGSMITH_API_KEY` (for tracing)

**Concerns:**
- No authentication on generate_safety_plan() function
- Assumes trusted caller (middleware)
- Direct access to OpenAI and Pinecone

#### Middleware
**Status:** ⚠️ UNKNOWN

- **Endpoints:** Public HTTPS (no auth observed in frontend)
- **Data Validation:** Unknown
- **Rate Limiting:** Unknown
- **CORS:** Likely configured for frontend origin

**Concerns:**
- No visible authentication mechanism
- Potential for abuse without rate limiting
- UUID-only access control for plan retrieval

### Data Privacy

**User Data Collected:**
- Neighbourhood location
- Crime concerns
- Personal safety habits (via survey)

**Data Flow:**
- Transmitted to external API (unencrypted JSON over HTTPS)
- Stored temporarily (unknown duration)
- Processed by OpenAI (subject to OpenAI privacy policy)
- Embedded in Pinecone (subject to Pinecone privacy policy)

**GDPR/Privacy Concerns:**
- No explicit user consent mechanism
- No data retention policy visible
- No data deletion mechanism
- No privacy policy displayed
- Toronto Police data potentially sensitive

### Recommendations

1. **Implement Authentication:**
   - Add user authentication to frontend
   - Secure middleware endpoints with API keys or JWT
   - Rate limiting on public endpoints

2. **Data Privacy:**
   - Add privacy policy and terms of service
   - Implement data retention policy
   - Add user consent mechanism
   - Consider on-premise LLM for sensitive data

3. **API Security:**
   - Add request validation
   - Implement rate limiting
   - Add logging and monitoring
   - Consider API gateway (AWS API Gateway, Kong)

4. **Secret Management:**
   - Use proper secret management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate API keys regularly
   - Implement least-privilege access

---

## Deployment Architecture

### Current State (Inferred)

**Frontend (WiseNeighbourhood):**
- **Platform:** Unknown (likely Streamlit Cloud or custom hosting)
- **Dependencies:** Requires Python 3.x runtime
- **Secrets:** Managed via Streamlit secrets
- **Static Assets:** CSV file bundled with application

**Backend (MMAI5040_TP):**
- **Platform:** Unknown
- **Invocation:** Triggered by middleware (mechanism unknown)
- **Dependencies:** Requires Python 3.x runtime, OpenAI/Pinecone access
- **State:** Stateless (vector store is external)

**Middleware (Node.js):**
- **Platform:** Hosted at `api.ai-fundamentals.live`
- **Type:** Unknown (VM, container, serverless?)
- **Database:** Unknown
- **Storage:** Requires persistent storage for plans (70-90 sec processing)

### Deployment Gaps

**Missing Configuration Files:**
- No Dockerfile or docker-compose.yml
- No Kubernetes manifests
- No deployment scripts
- No CI/CD configuration
- No infrastructure-as-code (Terraform, CloudFormation)
- No environment variable templates

**Questions for User:**
1. How is the frontend currently deployed?
2. How is the backend currently deployed?
3. What is the middleware deployment architecture?
4. What database stores the generated plans?
5. Are there any containerization or orchestration tools used?
6. What is the production infrastructure (AWS, GCP, Azure, on-prem)?

### Recommended Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  PROPOSED ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

[Frontend - Containerized]
  ├── Platform: AWS ECS / GCP Cloud Run / Azure Container Apps
  ├── Image: Docker (Python 3.11 + Streamlit)
  ├── Secrets: AWS Secrets Manager / GCP Secret Manager
  ├── CDN: CloudFront / Cloud CDN for static assets
  └── Scaling: Auto-scaling based on CPU/memory

[API Gateway]
  ├── Service: AWS API Gateway / GCP API Gateway
  ├── Features: Rate limiting, API keys, CORS
  ├── Endpoints: /plan, /getPlan
  └── Integration: Lambda/Cloud Functions

[Middleware - Serverless/Containerized]
  ├── Option 1: AWS Lambda + SQS
  │   ├── /plan → Lambda → SQS → Backend Lambda
  │   └── /getPlan → Lambda → DynamoDB
  │
  ├── Option 2: Containerized API (ECS/Cloud Run)
  │   ├── Express.js API
  │   ├── Redis for job queue
  │   └── PostgreSQL for plan storage
  │
  └── Monitoring: CloudWatch / Cloud Logging

[Backend - Serverless/Containerized]
  ├── Option 1: AWS Lambda (90s timeout)
  │   ├── Triggered by SQS
  │   ├── Store result in DynamoDB
  │   └── Warm start optimization required
  │
  ├── Option 2: ECS/Cloud Run (long-running)
  │   ├── Process jobs from queue
  │   ├── Store results in database
  │   └── Auto-scaling based on queue depth
  │
  └── External Services:
      ├── Pinecone (managed)
      ├── OpenAI API
      └── LangSmith

[Database]
  ├── Option 1: DynamoDB / Firestore (NoSQL)
  │   └── Store plans by UUID
  │
  ├── Option 2: RDS PostgreSQL / Cloud SQL
  │   └── Store users, plans, audit logs
  │
  └── Backup: Automated daily backups

[Monitoring & Observability]
  ├── Application: LangSmith (LLM tracing)
  ├── Infrastructure: CloudWatch / Cloud Monitoring
  ├── Logging: Centralized logging (ELK, CloudWatch Logs)
  ├── Alerting: PagerDuty / SNS / Cloud Monitoring
  └── Cost Monitoring: AWS Cost Explorer / GCP Billing
```

---

## Refactoring & Modernization Recommendations

Based on the analysis and your goal of major refactoring/modernization, here are strategic recommendations:

### 1. Unify the Architecture

**Current Issue:** Fragmented three-tier system with missing middleware

**Recommendation:**
```
Option A: Unified Monolith
  ├── Combine frontend and backend into single application
  ├── Use FastAPI for backend API + Streamlit for frontend
  ├── Eliminate middleware complexity
  └── Pros: Simpler deployment, easier development
  └── Cons: Tight coupling, harder to scale independently

Option B: Proper Microservices
  ├── Frontend: Next.js/React (modern web framework)
  ├── API Layer: FastAPI/Node.js (RESTful or GraphQL)
  ├── RAG Service: Python service (FastAPI)
  ├── Message Queue: Redis/RabbitMQ (async processing)
  └── Pros: Independent scaling, better separation
  └── Cons: Higher complexity, more infrastructure
```

**Recommended:** Option B with API Gateway for production-grade system

### 2. Improve Data Flow

**Current Issue:** Synchronous 90-second HTTP request (poor UX)

**Recommendation:**
```
Async Architecture:
  [Frontend]
    ├── Submit request → receive job ID
    ├── WebSocket connection for real-time updates
    └── Display progress updates from backend

  [Backend Queue]
    ├── Job queued with status: pending
    ├── Status updates: processing → analyzing → generating
    └── Final status: completed (with plan) or failed

  [Benefits]
    ├── Better UX (real-time feedback)
    ├── Frontend doesn't timeout
    ├── Can handle long-running jobs (5+ minutes)
    └── Retry failed jobs automatically
```

### 3. Modernize Frontend

**Current Issue:** Streamlit limitations (not production-grade for complex apps)

**Recommendation:**
```
Replace Streamlit with:
  ├── Framework: Next.js (React) or SvelteKit
  ├── UI Library: shadcn/ui, Material-UI, or Chakra UI
  ├── State Management: Redux Toolkit or Zustand
  ├── Real-time: WebSocket or Server-Sent Events
  └── Benefits:
      ├── Better performance and UX
      ├── Full control over UI/UX
      ├── Production-ready features (auth, routing, SEO)
      └── Better mobile responsiveness
```

### 4. Enhance RAG Pipeline

**Current Issue:** Simple retrieval, no advanced RAG techniques

**Recommendation:**
```
Advanced RAG Techniques:
  ├── Hybrid Search: Combine semantic + keyword search (BM25)
  ├── Reranking: Add Cohere/Claude reranker for better relevance
  ├── Query Rewriting: Use LLM to rephrase user query
  ├── HyDE: Generate hypothetical answers for better retrieval
  ├── Parent-Child Chunking: Retrieve child, return parent context
  └── Agent-based: Use ReAct or function calling for dynamic retrieval

Evaluation Improvements:
  ├── Automated RAGAS runs on every deployment
  ├── A/B testing framework for prompt changes
  ├── User feedback collection (thumbs up/down)
  └── Continuous monitoring of quality metrics
```

### 5. Implement Proper Caching

**Current Issue:** No caching layer (expensive repeated queries)

**Recommendation:**
```
Multi-Layer Caching:
  ├── Redis Cache:
  │   ├── Cache generated plans by (neighbourhood, crime_types, context_hash)
  │   ├── TTL: 24 hours (plans don't change frequently)
  │   └── Reduce OpenAI costs significantly
  │
  ├── Vector Store Cache:
  │   ├── Cache common queries → document mappings
  │   ├── Reduce Pinecone query costs
  │   └── Faster response times
  │
  └── CDN:
      ├── Cache static assets (CSS, JS, images)
      └── Reduce server load
```

### 6. Add Analytics & Monitoring

**Current Issue:** Limited observability, no user analytics

**Recommendation:**
```
Observability Stack:
  ├── Application Monitoring:
  │   ├── LangSmith (LLM tracing) ✓ Already implemented
  │   ├── Sentry (error tracking)
  │   └── DataDog/New Relic (APM)
  │
  ├── User Analytics:
  │   ├── PostHog or Mixpanel (product analytics)
  │   ├── Track: completions, dropoffs, popular neighbourhoods
  │   └── A/B testing framework
  │
  ├── Business Metrics:
  │   ├── Dashboard: Plans generated, costs, response times
  │   ├── Alerting: Error rates, high costs, slow responses
  │   └── Cost Attribution: Track OpenAI/Pinecone spend per request
  │
  └── Logging:
      ├── Structured logging (JSON format)
      ├── Centralized: ELK stack or CloudWatch
      └── Retention: 30 days minimum
```

### 7. Implement Testing Strategy

**Current Issue:** Manual testing only, no automated tests

**Recommendation:**
```
Testing Pyramid:
  ├── Unit Tests (pytest):
  │   ├── Test prompt assembly logic
  │   ├── Test data parsing functions
  │   ├── Test UI element generation
  │   └── Target: 80%+ code coverage
  │
  ├── Integration Tests:
  │   ├── Test RAG pipeline end-to-end (with mock LLM)
  │   ├── Test API endpoints
  │   ├── Test database operations
  │   └── Target: Critical paths covered
  │
  ├── E2E Tests (Playwright):
  │   ├── Test complete user journey
  │   ├── Test different neighbourhoods and crime types
  │   └── Target: Happy path + error scenarios
  │
  ├── LLM Evaluation (RAGAS):
  │   ├── Automated runs on every deployment ✓ Already implemented
  │   ├── Regression testing for prompt changes
  │   └── Quality gates: Minimum scores required
  │
  └── CI/CD:
      ├── GitHub Actions or GitLab CI
      ├── Run tests on every PR
      ├── Block merges if tests fail
      └── Automated deployment on main branch
```

### 8. Security Hardening

**Current Issue:** No authentication, public endpoints, API keys in code

**Recommendation:**
```
Security Enhancements:
  ├── Authentication:
  │   ├── User auth: Auth0, Clerk, or Supabase Auth
  │   ├── API keys for service-to-service
  │   └── JWT tokens for session management
  │
  ├── Authorization:
  │   ├── Rate limiting: 10 requests/hour per user
  │   ├── Quota management: Track usage per user
  │   └── Admin panel for user management
  │
  ├── Data Protection:
  │   ├── Encrypt sensitive data at rest
  │   ├── Use HTTPS everywhere
  │   ├── Implement data retention policy (30 days)
  │   └── Add GDPR compliance (consent, right to deletion)
  │
  ├── Secret Management:
  │   ├── Use AWS Secrets Manager / HashiCorp Vault
  │   ├── Rotate keys quarterly
  │   └── Never commit secrets to Git
  │
  ├── Vulnerability Scanning:
  │   ├── Dependabot for dependency updates
  │   ├── Snyk or Trivy for container scanning
  │   └── OWASP ZAP for API security testing
  │
  └── Compliance:
      ├── Add privacy policy and terms of service
      ├── Cookie consent (if tracking users)
      ├── Data processing agreements for LLM providers
      └── Regular security audits
```

### 9. Cost Optimization

**Current Issue:** Unoptimized LLM usage, no cost tracking

**Recommendation:**
```
Cost Reduction Strategy:
  ├── LLM Optimization:
  │   ├── Use GPT-4-turbo instead of GPT-4 (cheaper)
  │   ├── Consider Claude 3.5 Sonnet (better performance/cost)
  │   ├── Use GPT-3.5-turbo for less critical tasks
  │   └── Implement semantic caching (reduce 50%+ of calls)
  │
  ├── Vector Store Optimization:
  │   ├── Reduce chunk size if retrieval quality allows
  │   ├── Lower k from 10 to 7-8 (test impact on quality)
  │   └── Consider self-hosted Qdrant or Weaviate
  │
  ├── Prompt Engineering:
  │   ├── Reduce prompt length (every token costs)
  │   ├── Use system prompts instead of few-shot (cheaper)
  │   └── Remove redundant instructions
  │
  ├── Monitoring:
  │   ├── Track cost per request
  │   ├── Set budget alerts ($X/day threshold)
  │   ├── Dashboard: Daily/weekly/monthly spend
  │   └── Attribution: Cost by neighbourhood, user, etc.
  │
  └── Alternative Models:
      ├── Fine-tune smaller model (GPT-3.5) for specific task
      ├── Consider open-source (Llama 3, Mistral) for privacy
      └── Use RAG to reduce context size needed
```

### 10. Database & State Management

**Current Issue:** No database, plans stored ephemerally in middleware

**Recommendation:**
```
Database Design:
  ├── Primary Database: PostgreSQL (RDS/Cloud SQL)
  │   ├── Tables:
  │   │   ├── users (id, email, created_at)
  │   │   ├── plans (id, user_id, neighbourhood, crime_types, plan_text, created_at)
  │   │   ├── surveys (id, user_id, responses_json, created_at)
  │   │   └── feedback (id, plan_id, rating, comments)
  │   └── Benefits:
  │       ├── Historical data for analytics
  │       ├── User dashboard (view past plans)
  │       ├── Feedback collection
  │       └── A/B testing data
  │
  ├── Cache Layer: Redis
  │   ├── Generated plans (24hr TTL)
  │   ├── Session data
  │   └── Rate limiting counters
  │
  └── Vector Store: Pinecone (keep as-is)
      └── Consider migration to Qdrant/Weaviate for cost savings
```

---

## Development Roadmap

### Phase 1: Stabilization (Weeks 1-2)

**Goal:** Document and stabilize existing system

- [ ] Locate and analyze Node.js middleware source code
- [ ] Document complete deployment architecture
- [ ] Set up proper version control and branching strategy
- [ ] Add environment variable templates (`.env.example`)
- [ ] Implement basic logging across all components
- [ ] Set up error tracking (Sentry)
- [ ] Create runbooks for common issues

### Phase 2: Testing Foundation (Weeks 3-4)

**Goal:** Establish testing infrastructure

- [ ] Add unit tests for critical functions (target: 60% coverage)
- [ ] Implement integration tests for RAG pipeline
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Automate RAGAS evaluation on every deploy
- [ ] Add smoke tests for production deployments
- [ ] Document test execution procedures

### Phase 3: Security & Authentication (Weeks 5-6)

**Goal:** Harden security posture

- [ ] Implement user authentication (Auth0/Clerk)
- [ ] Add API key authentication for middleware
- [ ] Implement rate limiting
- [ ] Add secret management (AWS Secrets Manager)
- [ ] Implement data retention policy
- [ ] Add privacy policy and terms of service
- [ ] Security audit and penetration testing

### Phase 4: Monitoring & Observability (Weeks 7-8)

**Goal:** Full visibility into system behavior

- [ ] Set up comprehensive logging (structured JSON)
- [ ] Implement cost tracking dashboard
- [ ] Add user analytics (PostHog/Mixpanel)
- [ ] Set up alerting (PagerDuty/SNS)
- [ ] Create operational dashboards
- [ ] Implement SLOs and SLIs

### Phase 5: Performance Optimization (Weeks 9-10)

**Goal:** Reduce costs and improve UX

- [ ] Implement Redis caching layer
- [ ] Optimize RAG pipeline (hybrid search, reranking)
- [ ] Reduce LLM token usage (prompt optimization)
- [ ] Implement async architecture (WebSocket updates)
- [ ] Add CDN for static assets
- [ ] Load testing and performance tuning

### Phase 6: Architecture Modernization (Weeks 11-14)

**Goal:** Migrate to production-grade architecture

**Option A: Incremental (Lower Risk)**
- [ ] Containerize existing applications (Docker)
- [ ] Set up Kubernetes/ECS deployment
- [ ] Migrate to proper database (PostgreSQL)
- [ ] Unify middleware into FastAPI service
- [ ] Keep Streamlit but improve UX

**Option B: Full Rebuild (Higher Risk, Better Outcome)**
- [ ] Build new Next.js frontend
- [ ] Build FastAPI backend with message queue
- [ ] Implement WebSocket for real-time updates
- [ ] Migrate users from old to new system
- [ ] A/B test old vs new architecture

### Phase 7: Advanced Features (Weeks 15-16)

**Goal:** Enhance product capabilities

- [ ] User dashboard (view history, saved plans)
- [ ] Plan comparison (different neighbourhoods)
- [ ] Feedback collection and ratings
- [ ] Multi-language support (French for Quebec)
- [ ] Export to PDF functionality
- [ ] Email delivery of plans
- [ ] Neighborhood comparison tools
- [ ] Crime trend analysis

### Phase 8: Scale & Optimize (Ongoing)

**Goal:** Prepare for production scale

- [ ] Load testing (1000+ concurrent users)
- [ ] Auto-scaling configuration
- [ ] Disaster recovery plan
- [ ] Multi-region deployment (if needed)
- [ ] Cost optimization review
- [ ] Performance benchmarking
- [ ] Documentation updates

---

## Technical Debt Analysis

### Critical Technical Debt

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Missing middleware source code | 🔴 Blocker | Unknown | P0 |
| No authentication | 🔴 Security | Medium | P0 |
| Synchronous 90s HTTP request | 🟡 UX | High | P1 |
| No database persistence | 🟡 Features | Medium | P1 |
| No automated tests | 🟡 Stability | High | P1 |
| Hardcoded API URLs | 🟡 Flexibility | Low | P2 |
| No error handling in frontend | 🟡 UX | Low | P2 |
| Streamlit scalability limits | 🟡 Scale | Very High | P2 |

### Moderate Technical Debt

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| No caching layer | 💰 Cost | Medium | P2 |
| No monitoring/alerting | 🟡 Operations | Medium | P2 |
| Evaluation code not in CI/CD | 🟡 Quality | Low | P2 |
| No user analytics | 📊 Product | Low | P3 |
| Commented-out code in main.py | 🧹 Maintenance | Low | P3 |
| Multiple evaluation script versions | 🧹 Maintenance | Low | P3 |

### Low-Priority Technical Debt

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| CSV data source (not database) | 🟡 Maintenance | Low | P3 |
| No API versioning | 🟡 Compatibility | Low | P3 |
| Mixed naming conventions | 🧹 Maintenance | Low | P4 |
| No code formatting standards | 🧹 Maintenance | Low | P4 |

---

## Risk Assessment

### High-Risk Areas

1. **Missing Middleware Component**
   - **Risk:** Cannot fully understand or modify system
   - **Impact:** Blocks refactoring efforts
   - **Mitigation:** Locate source code or reverse-engineer behavior

2. **No Authentication**
   - **Risk:** Abuse, unauthorized access, cost overruns
   - **Impact:** Financial and security
   - **Mitigation:** Implement auth ASAP

3. **External API Dependencies**
   - **Risk:** OpenAI, Pinecone outages block entire system
   - **Impact:** Service downtime
   - **Mitigation:** Add fallback mechanisms, circuit breakers

4. **Tight Coupling**
   - **Risk:** Cannot modify one component without breaking others
   - **Impact:** Development velocity
   - **Mitigation:** Define clear contracts, add tests

5. **Unmonitored Costs**
   - **Risk:** Unexpected high bills from LLM usage
   - **Impact:** Financial
   - **Mitigation:** Implement cost tracking and alerts

### Medium-Risk Areas

1. **Streamlit Limitations**
   - **Risk:** Cannot scale to production needs
   - **Impact:** UX and performance at scale
   - **Mitigation:** Plan migration to modern framework

2. **Single-Region Deployment** (assumed)
   - **Risk:** Regional outages affect all users
   - **Impact:** Availability
   - **Mitigation:** Multi-region deployment if needed

3. **No Backup Strategy**
   - **Risk:** Data loss if systems fail
   - **Impact:** User trust, compliance
   - **Mitigation:** Implement automated backups

---

## Appendix

### A. Key File Reference

**WiseNeighbourhood (Frontend):**
```
main.py:88-102          send_plan_request() - API integration
main.py:105-115         get_plan() - Plan retrieval
main.py:118-155         get_survey_respond() - Data extraction
main.py:186-212         handle_submission() - Conversation flow
main.py:245-293         final_submission() - Survey completion
llm_utils/agents.py:38-76       ConversationalAgent
llm_utils/agents.py:78-118      UIAgent
llm_utils/conversation.py:29-37 Conversation.__call__()
streamlit_utils/initialization.py:38-60 initialize_session()
```

**MMAI5040_TP (Backend):**
```
main.py:113-517         generate_safety_plan() - Main RAG pipeline
main.py:280-333         FIRST_SAFETY_PROMPT - Analysis prompt
main.py:335-393         SECOND_SAFETY_PROMPT - Generation prompt
main.py:412-419         analysis_chain - Stage 1
main.py:421-432         plan_chain - Stage 2
main.py:448-484         safety_plan_chain - Complete pipeline
pipeline_initialization_code/1_informationretreival.py - Web scraping
pipeline_initialization_code/2_ingestion.py - Vector store ingestion
evals_run_all.py        Evaluation orchestrator
```

### B. Environment Variables

**WiseNeighbourhood:**
```bash
# Streamlit Secrets (recommended)
openai_api_key="sk-..."
google_api_key="..."

# Or via sidebar input (fallback)
```

**MMAI5040_TP:**
```bash
# Required in .env file
OPENAI_API_KEY="sk-..."
PINECONE_API_KEY="..."
PINECONE_INDEX_NAME="..."
LANGSMITH_API_KEY="..."  # Optional, for tracing

# Firecrawl (for data scraping)
FIRECRAWL_API_KEY="..."  # Only needed for data updates
```

### C. API Endpoints

**Production Middleware:**
```
POST https://api.ai-fundamentals.live/api2/plan
POST https://api.ai-fundamentals.live/api2/getPlan
```

**External Services:**
```
OpenAI: https://api.openai.com/v1/
Pinecone: https://<index>.svc.<environment>.pinecone.io/
LangSmith: https://api.smith.langchain.com/
```

### D. Data Models

**Survey Response:**
```python
{
  "Neighbourhood": str,                    # "York University Heights (27)"
  "Crime Type": List[str],                 # ["Assault: Low", "Robbery: Low"]
  "user-context": List[str]                # ["Q: ...", "A: ...", ...]
}
```

**UI Element:**
```python
{
  "title": str,
  "text": str,                             # Text before ␃ delimiter
  "ui_elements": [
    {
      "type": "RadioButtons" | "MultiSelect" | "Slider" | "Checkbox",
      "label": str,
      "options": List[str]                 # For RadioButtons, MultiSelect
      # or
      "range": Tuple[int, int]             # For Slider
    }
  ]
}
```

**Safety Plan Output:**
```
String format with 4 sections:
1. NEIGHBOURHOOD-SPECIFIC ASSESSMENT
2. TARGETED SAFETY RECOMMENDATIONS
3. PERSONAL SAFETY PROTOCOL
4. PREVENTIVE MEASURES
+ Sources + Footer
```

### E. Evaluation Metrics

**RAGAS Metrics (from evaluation code):**
- **Faithfulness:** Is the response grounded in the retrieved context?
- **Answer Relevancy:** Does the answer address the user's question?
- **Context Precision:** Are the retrieved documents relevant?
- **Context Recall:** Are all relevant documents retrieved?

**Target Scores (recommended):**
- Faithfulness: > 0.8
- Answer Relevancy: > 0.7
- Context Precision: > 0.6
- Context Recall: > 0.7

---

## Next Steps & Questions

### Immediate Actions Required

1. **Locate Middleware Source Code**
   - Search project repositories
   - Check deployment servers
   - Contact original developers

2. **Document Current Deployment**
   - Where is each component hosted?
   - What is the infrastructure setup?
   - What are the access credentials?

3. **Establish Baseline Metrics**
   - Current API usage (requests/day)
   - Current costs (OpenAI + Pinecone)
   - Current error rates
   - Current response times

4. **Prioritize Roadmap**
   - Review Phase 1-8 recommendations
   - Identify must-haves vs nice-to-haves
   - Allocate resources and timeline

### Questions for Stakeholders

**Technical Questions:**
1. Where is the Node.js middleware source code located?
2. How is MMAI5040_TP currently invoked (subprocess, API, queue)?
3. What database stores the generated plans?
4. What is the current production infrastructure?
5. Are there any containerization or IaC configurations?

**Business Questions:**
1. What is the current user base and growth expectations?
2. What is the acceptable downtime SLA?
3. What is the budget for infrastructure and LLM costs?
4. Are there any compliance requirements (PIPEDA, GDPR)?
5. What is the timeline for refactoring completion?

**Product Questions:**
1. Are there planned feature additions?
2. What are the most common user complaints?
3. What analytics do we need to track?
4. Should we support multiple languages?
5. What is the target response time (currently 70-90 seconds)?

---

## Conclusion

The SixSafety system is a functional three-tier AI-powered safety recommendation platform with significant technical debt and architectural gaps. The most critical issue is the missing middleware component, which blocks comprehensive refactoring efforts.

**Key Strengths:**
- ✅ Functional RAG pipeline with good prompt engineering
- ✅ Dual-agent architecture for dynamic conversation
- ✅ Evaluation framework (RAGAS) already implemented
- ✅ LangSmith tracing for observability
- ✅ Clean separation of concerns (frontend/backend)

**Key Weaknesses:**
- ❌ Missing middleware source code
- ❌ No authentication or authorization
- ❌ Poor UX (90-second synchronous wait)
- ❌ No caching or cost optimization
- ❌ No automated testing
- ❌ Limited observability and monitoring
- ❌ Streamlit scalability limitations

**Recommended Approach:**
1. **Short-term (0-2 months):** Stabilize and secure existing system
2. **Mid-term (2-4 months):** Add testing, monitoring, caching
3. **Long-term (4-6 months):** Modernize architecture (async, new frontend)

The system has a solid foundation but requires significant investment to reach production-grade quality suitable for public deployment and scale.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Author:** BMad Master
**Status:** Complete - Ready for Review
