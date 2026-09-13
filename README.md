# ANACITY Move-In / Move-Out Agentic Workflow

A scalable agentic workflow prototype for handling **resident move-in and move-out requests** for gated communities.

This project was built as a take-home assignment for ANACITY with a focus on:

- Resident experience
- Admin review experience
- Agentic workflow orchestration
- Community-specific configurable rules
- Human-in-the-loop decision making
- Workflow state management
- Validation and ambiguity handling
- Persistence
- Failure recovery
- Production scalability

---

## 1. Problem Overview

Move-in and move-out processes in residential communities involve multiple stakeholders and community-specific policies.

A resident needs to:

1. Start a move-in or move-out request
2. Provide the required information
3. Understand community-specific rules
4. Resolve missing or ambiguous information
5. Submit the request
6. Respond to additional information requests from the admin
7. Track the request status

A community admin needs to:

1. Receive the request
2. Understand the complete context
3. Validate the request against community rules
4. Identify missing or problematic information
5. Approve, reject, or request additional information
6. Provide a reason/note when necessary

The goal of this prototype is to use AI where it adds meaningful value while keeping critical business operations deterministic and controlled.

---

# 2. Core Design Principle

> **AI is the intelligent orchestration layer, not the source of truth.**

The AI agent is responsible for:

- Understanding natural language
- Extracting structured information
- Asking contextual questions
- Handling ambiguity
- Explaining requirements
- Summarizing requests
- Recommending actions
- Orchestrating controlled workflow actions

The deterministic application layer remains responsible for:

- Business rules
- Authorization
- Data persistence
- Validation
- Workflow transitions
- Final admin decisions
- Auditability
- Critical actions

This provides a balance between:

**AI flexibility + deterministic reliability**

---

# 3. Main Workflows

The application supports four primary workflows.

## Resident Workflows

### Move-In

```text
Resident
   ↓
Start Move-In
   ↓
AI gathers information
   ↓
Validate against community rules
   ↓
Ask for missing information
   ↓
Show summary
   ↓
Resident confirms
   ↓
Submit
   ↓
Admin Review
```

### Move-Out

```text
Resident
   ↓
Start Move-Out
   ↓
AI gathers information
   ↓
Validate move-out requirements
   ↓
Handle inspection / dues / access-card information
   ↓
Show summary
   ↓
Resident confirms
   ↓
Submit
   ↓
Admin Review
```

---

# 4. Admin Workflows

The admin receives submitted requests and can:

- Start review
- View resident details
- View unit details
- View move information
- View AI-generated summary
- View validation results
- View AI recommendation
- Approve
- Reject
- Request additional information

Admin decisions remain **human-controlled**.

The AI can recommend an action, but it does not silently approve or reject a resident request.

---

# 5. Feedback Loop

One important part of the prototype is the complete information-request loop.

```text
Resident submits
       ↓
Admin reviews
       ↓
Admin requests information
       ↓
Resident sees admin request
       ↓
Resident provides information
       ↓
Agent updates request
       ↓
Request returns to admin review
       ↓
Admin makes final decision
```

This allows the workflow to continue instead of forcing the resident to create a new request.

---

# 6. Agent Responsibilities

The agent has several responsibilities.

## 6.1 Natural Language Understanding

Residents do not need to fill every field manually.

For example:

```text
I want to move into my apartment on September 18
between 10 and 12. My moving company is Agarwal Movers
and the truck number is CG04AB1234.
```

The agent can extract:

```json
{
  "moveDate": "2026-09-18",
  "slot": "10:00-12:00",
  "movingCompany": "Agarwal Movers",
  "vehicleNumber": "CG04AB1234"
}
```

---

## 6.2 Contextual Questioning

Instead of asking every question at once, the agent identifies missing information.

Example:

```text
Agent:
I have the move date, time slot and moving company.

I still need your vehicle number.
```

This creates a conversational experience rather than a rigid form.

---

## 6.3 Validation

The agent works together with the deterministic rules engine.

For example:

```text
Move-in date:
Saturday

Community rule:
Monday-Friday only
```

The system responds:

```text
Saturday move-ins are not allowed in this community.

Please choose a weekday.
```

---

## 6.4 Ambiguity Handling

The agent should not blindly assume important information.

Example:

```text
Resident:
I want to move sometime next week.
```

Instead of selecting a random date:

```text
Agent:
Which date next week would you prefer?
```

---

## 6.5 Summarization

Before submission, the agent presents a concise summary.

Example:

```text
Move-In Summary

Unit: A-1204
Date: September 18, 2026
Time: 10:00-12:00
Moving Company: Agarwal Movers
Vehicle: CG04AB1234

Would you like me to submit this request?
```

---

# 7. Agent Boundaries

The agent does **not** have unrestricted authority.

## Agent Can

- Extract information
- Ask questions
- Validate information
- Explain community rules
- Prepare summaries
- Recommend admin actions
- Update request information
- Trigger controlled workflow operations

## Agent Cannot

- Override community rules
- Approve requests without admin authorization
- Reject requests without the configured workflow
- Modify arbitrary database records
- Bypass authorization
- Invent missing resident information
- Make uncontrolled financial decisions

---

# 8. Human-in-the-Loop

High-impact actions remain under human control.

```text
AI Recommendation
       ↓
Admin Review
       ↓
Admin Decision
       ↓
Deterministic Workflow
       ↓
Database Update
```

For example, the AI may recommend:

```text
Recommendation: APPROVE
Reason:
All required information is available and
the requested slot complies with community rules.
```

The admin still chooses:

```text
Approve
Reject
Request Information
```

---

# 9. Architecture

The prototype uses a modular architecture.

```text
                    ┌───────────────────────┐
                    │      React Client     │
                    │                       │
                    │ Resident UI           │
                    │ Admin Dashboard       │
                    └───────────┬───────────┘
                                │
                                │ HTTP / REST
                                ▼
                    ┌───────────────────────┐
                    │    Express Backend    │
                    │                       │
                    │ API Routes             │
                    │ Controllers            │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
       ┌────────────┐    ┌─────────────┐   ┌─────────────┐
       │ Agent      │    │ Workflow    │   │ Rules       │
       │ Layer      │    │ Service     │   │ Engine      │
       └─────┬──────┘    └──────┬──────┘   └──────┬──────┘
             │                  │                 │
             ▼                  ▼                 ▼
       ┌────────────┐    ┌─────────────┐   ┌─────────────┐
       │ LLM /      │    │ Request     │   │ Community   │
       │ Fallback   │    │ Service     │   │ Config      │
       └────────────┘    └──────┬──────┘   └─────────────┘
                                │
                                ▼
                         ┌────────────┐
                         │ Persistence│
                         │ requests   │
                         │ .json      │
                         └────────────┘
```

---

# 10. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Lucide React
- Tailwind CSS

## Backend

- Node.js
- Express
- TypeScript
- Zod
- dotenv
- OpenAI SDK

## Persistence

Prototype:

```text
JSON file
```

Production:

```text
PostgreSQL / managed database
```

## AI

The system supports an LLM-based extraction layer.

For development and demonstration, a deterministic fallback agent is available so that the prototype does not depend completely on API credits.

---

# 11. Project Structure

```text
anacity-move-agent/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── ResidentPage.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── ...
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── agents/
│   │   │   └── move-agents.ts
│   │   │
│   │   ├── controllers/
│   │   │
│   │   ├── data/
│   │   │   ├── community.ts
│   │   │   ├── requests.json
│   │   │   └── requests.ts
│   │   │
│   │   ├── rules/
│   │   │   └── move.rules.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── agent.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── resident.routes.ts
│   │   │
│   │   ├── services/
│   │   │   ├── admin.service.ts
│   │   │   ├── llm.service.ts
│   │   │   ├── request.service.ts
│   │   │   ├── submission.service.ts
│   │   │   └── workflow.service.ts
│   │   │
│   │   ├── tools/
│   │   ├── types/
│   │   │   ├── agent.ts
│   │   │   └── domain.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── anacity-explanation.md
│   └── testing.md
│
├── .gitignore
├── README.md
└── package.json
```

---

# 12. Prerequisites

Install:

- Node.js 20+
- npm
- Git
- VS Code recommended

Check installation:

```bash
node --version
npm --version
git --version
```

---

# 13. Clone the Repository

```bash
git clone https://github.com/tusharsahu2599/MoveInMoveOutAgent.git
```

Enter the project:

```bash
cd MoveInMoveOutAgent
```

---

# 14. Backend Setup

Open a terminal:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

The `.env` file should contain:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Important

Never commit the real API key.

Do NOT do:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

inside a committed file.

The `.env` file must remain local.

---

# 15. Backend Startup

From:

```text
server/
```

run:

```bash
npm run dev
```

The backend should start on:

```text
http://localhost:4000
```

---

# 16. Frontend Setup

Open another terminal.

From the project root:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start frontend:

```bash
npm run dev
```

Vite will provide a URL similar to:

```text
http://localhost:5173
```

Open that URL in your browser.

---

# 17. Running the Complete Application

You need two terminals.

### Terminal 1

```bash
cd server
npm install
npm run dev
```

### Terminal 2

```bash
cd client
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 18. Demo Users

The prototype contains demo users.

## Resident

```text
Name:
Rahul Sharma

Email:
rahul@example.com

Role:
RESIDENT

Community:
Green Valley Residency

Unit:
A-1204
```

## Admin

```text
Name:
Priya Admin

Email:
admin@example.com

Role:
ADMIN

Community:
Green Valley Residency
```

---

# 19. Recommended Demo Flow

For the ANACITY assignment demonstration, use the following flow.

---

## Demo 1 — Move-In

Start a move-in request.

Tell the agent:

```text
I want to move in on September 18 between 10 and 12.
My moving company is Agarwal Movers and my vehicle number
is CG04AB1234.
```

The agent should:

1. Detect move-in
2. Extract date
3. Extract time slot
4. Extract moving company
5. Extract vehicle number
6. Validate information
7. Show a summary
8. Ask for confirmation

Then confirm:

```text
Yes, submit it.
```

The request moves to:

```text
SUBMITTED
```

---

# 20. Demo 2 — Admin Review

Open the Admin Dashboard.

The admin should see:

- Resident
- Unit
- Move type
- Move date
- Time slot
- Moving company
- Vehicle number
- Validation result
- AI recommendation
- Request status

Admin starts review.

The request moves:

```text
SUBMITTED
      ↓
UNDER_REVIEW
```

---

# 21. Demo 3 — Request More Information

Instead of approving immediately, the admin can select:

```text
Request Information
```

Example note:

```text
Please confirm whether the moving vehicle will require
a second vehicle entry.
```

The request becomes:

```text
NEEDS_INFORMATION
```

---

# 22. Demo 4 — Resident Responds

The resident sees the admin request.

The resident can provide additional information.

Example:

```text
Only one vehicle will be entering the community.
```

The agent extracts the response and updates the request.

The workflow returns to:

```text
UNDER_REVIEW
```

The admin can now review the updated request.

---

# 23. Demo 5 — Admin Approval

Admin selects:

```text
Approve
```

The request becomes:

```text
APPROVED
```

The resident can see the updated status.

---

# 24. Demo 6 — Admin Rejection

For another request, the admin can select:

```text
Reject
```

Example reason:

```text
The requested move date is outside the permitted
community move-in schedule.
```

The request becomes:

```text
REJECTED
```

The rejection reason is visible to the resident.

---

# 25. Move-Out Workflow

Move-out has additional requirements.

The configured demo community requires:

```text
Move date
Time slot
Moving company
Vehicle number
Inspection
Dues clearance
Access card return
```

The agent can gather these conversationally.

Example:

```text
I want to move out on September 20 from 2 to 4.
The company is Agarwal Movers and vehicle number is CG04AB1234.
Inspection is scheduled, my dues are cleared and I will return
the access cards.
```

The agent extracts the available information and validates it.

---

# 26. Community Configuration

Community-specific rules are configuration-driven.

Example:

```ts
moveIn: {
  allowedDays: [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY"
  ],
  startTime: "09:00",
  endTime: "18:00",
  requiredFields: [
    "moveDate",
    "slot",
    "movingCompany",
    "vehicleNumber"
  ]
}
```

Move-out:

```ts
moveOut: {
  allowedDays: [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ],
  startTime: "09:00",
  endTime: "18:00",
  requiredFields: [
    "moveDate",
    "slot",
    "movingCompany",
    "vehicleNumber"
  ],
  inspectionRequired: true,
  duesClearanceRequired: true
}
```

---

# 27. Why Configuration Instead of Hardcoding?

Different communities may have different:

- Allowed move days
- Move timings
- Required information
- Inspection requirements
- Dues requirements
- Access-card requirements
- Vehicle restrictions
- Approval policies

Therefore:

```text
Core workflow logic
        +
Community configuration
        =
Scalable system
```

The workflow engine remains reusable while community configuration changes.

---

# 28. Workflow State Machine

The request lifecycle is explicitly modeled.

```text
DRAFT
  ↓
INCOMPLETE
  ↓
READY_FOR_SUBMISSION
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ├──→ APPROVED
  │
  ├──→ REJECTED
  │
  └──→ NEEDS_INFORMATION
             ↓
        UNDER_REVIEW
```

Terminal states:

```text
APPROVED
REJECTED
```

This prevents invalid workflow transitions.

---

# 29. Validation Rules

The rules engine checks:

## Required Fields

For move-in:

```text
moveDate
slot
movingCompany
vehicleNumber
```

For move-out:

```text
moveDate
slot
movingCompany
vehicleNumber
inspectionScheduled
duesCleared
accessCardsReturned
```

---

## Allowed Days

The requested date must fall on a configured community day.

---

## Allowed Time

The requested slot must fall within the community's configured operating hours.

Example:

```text
Community:
09:00 - 18:00

Resident:
20:00 - 22:00

Result:
Invalid
```

---

# 30. Persistence

The prototype uses:

```text
server/src/data/requests.json
```

This allows requests to survive backend restarts during local development.

Example:

```json
[
  {
    "id": "request-123",
    "type": "MOVE_IN",
    "status": "UNDER_REVIEW"
  }
]
```

---

# 31. Production Persistence

The JSON persistence layer should be replaced with a database in production.

Recommended:

```text
PostgreSQL
```

Possible schema:

```text
users
communities
community_rules
units
move_requests
move_request_events
admin_actions
agent_sessions
```

---

# 32. Agent State

The agent maintains context through:

```text
AgentContext
```

Important information includes:

```text
residentId
communityId
unitId
requestId
requestType
currentRequest
conversationHistory
```

This allows the agent to reason about the current workflow instead of treating every message as an isolated interaction.

---

# 33. AI + Deterministic Architecture

The system intentionally separates AI inference from business logic.

```text
User Message
     ↓
Agent
     ↓
Information Extraction
     ↓
Structured Data
     ↓
Rules Engine
     ↓
Workflow Service
     ↓
Persistence
```

The LLM should not directly write arbitrary database values.

Instead:

```text
LLM
 ↓
Structured output
 ↓
Validation
 ↓
Controlled tool/service
 ↓
Database
```

---

# 34. LLM Fallback

The prototype supports a deterministic fallback path.

This is useful when:

- API key is unavailable
- API quota is exhausted
- LLM request fails
- Network is unavailable
- Development needs deterministic behavior

The application can still demonstrate the agentic workflow without depending completely on external AI infrastructure.

In production, the fallback can be retained as a resilience mechanism.

---

# 35. Failure Recovery

The system should fail safely.

## LLM Failure

If the LLM fails:

```text
LLM
 ↓
Failure
 ↓
Deterministic fallback
```

---

## Invalid Workflow Transition

The workflow service rejects invalid transitions.

Example:

```text
APPROVED → UNDER_REVIEW
```

is rejected.

---

## Request Not Found

The API returns an appropriate error instead of creating an invalid request.

---

## Invalid Community Rule

The request remains unresolved until the resident provides a valid option.

---

## Admin Information Request

The request enters:

```text
NEEDS_INFORMATION
```

and waits for the resident.

---

# 36. Admin Recommendation

The admin view contains an AI-assisted recommendation.

Possible values:

```text
APPROVE
REVIEW
REJECT
```

Example:

```text
Recommendation: APPROVE

Reason:
All required information is present and the request
complies with the configured community rules.
```

The recommendation is advisory.

The admin remains responsible for the final decision.

---

# 37. Why This Is Agentic

The system is not simply a chatbot.

The agent:

1. Understands the user's intent
2. Maintains workflow context
3. Extracts structured information
4. Identifies missing information
5. Asks follow-up questions
6. Validates against external rules
7. Produces a recommendation
8. Updates workflow state
9. Handles admin feedback
10. Returns the request to the appropriate workflow stage

The agent therefore participates in a **stateful multi-step workflow**.

---

# 38. Tools / Actions

The agent can orchestrate controlled actions such as:

```text
VALIDATE
UPDATE_REQUEST
SUBMIT_REQUEST
SHOW_SUMMARY
ASK_QUESTION
RECOMMEND
HANDOFF_TO_ADMIN
```

The underlying services remain responsible for enforcing the actual operation.

---

# 39. Scalability Strategy

The architecture is intentionally divided into:

```text
Core Logic
+
Configuration
+
AI Layer
```

## Core Logic

Reusable across communities:

- Workflow
- Validation framework
- Request lifecycle
- Authorization
- Persistence
- Agent orchestration

## Configuration

Community-specific:

- Required fields
- Allowed days
- Operating hours
- Inspection requirement
- Dues requirement
- Other policies

## AI Layer

Can evolve independently:

```text
Deterministic Agent
        ↓
LLM Extraction
        ↓
Tool Calling
        ↓
Multi-Agent Architecture
```

---

# 40. Prototype vs Production

## Current Prototype

```text
React
+
Express
+
JSON persistence
+
Single agent orchestration layer
+
Configurable community rules
```

## Production Evolution

```text
React / Mobile
        ↓
API Gateway
        ↓
Auth Service
        ↓
Move Workflow Service
        ↓
Agent Orchestrator
        ↓
Rules Service
        ↓
PostgreSQL
        ↓
Event Bus
        ↓
Notifications
```

---

# 41. Production Improvements

The following would be added before production deployment.

## Authentication

Use:

```text
OAuth / SSO / JWT
```

---

## Authorization

Enforce:

```text
Resident → Own requests only
Admin → Community requests only
```

---

## Database

Move from JSON to PostgreSQL.

---

## Audit Trail

Persist:

- Agent actions
- Admin actions
- State transitions
- Resident responses
- Validation results

---

## Notifications

Add:

- Email
- Push notification
- SMS
- In-app notification

---

## File Uploads

Potentially support:

- Move documents
- ID documents
- Vehicle documents
- Inspection evidence

---

## Observability

Add:

```text
Logging
Metrics
Tracing
Error monitoring
```

---

# 42. Security Considerations

Never commit secrets.

The following files should be ignored:

```text
.env
server/.env
client/.env
```

Example `.gitignore`:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
server/.env
client/.env
```

---

# 43. `.env.example`

The committed example file must contain only a placeholder:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Never put a real key inside:

```text
README.md
.env.example
source code
Git history
screenshots
```

---

# 44. GitHub Secret Scanning Issue

If GitHub reports:

```text
GH013: Repository rule violations
Push cannot contain secrets
OpenAI API Key
```

do NOT bypass the protection by approving the secret.

Remove the secret from Git history.

---

## Step 1 — Check `.env.example`

From project root:

```bash
cat server/.env.example
```

If it contains a real API key, replace it with:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

---

## Step 2 — Check `.gitignore`

Make sure it contains:

```gitignore
.env
.env.*
!.env.example

server/.env
client/.env

node_modules/
dist/
```

---

## Step 3 — Remove Secret From Git History

If the secret was committed in an earlier commit, simply editing the current file is not enough.

Install `git-filter-repo`.

On macOS:

```bash
brew install git-filter-repo
```

Then:

```bash
git filter-repo --path server/.env.example --invert-paths
```

This removes the problematic file from previous commits.

---

## Step 4 — Recreate Safe `.env.example`

Create:

```text
server/.env.example
```

with:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

---

## Step 5 — Commit the Safe Version

```bash
git add .
git commit -m "Remove secret from git history"
```

---

## Step 6 — Push

Because the history was rewritten:

```bash
git push --force-with-lease origin main
```

---

# 45. IMPORTANT: If a Real API Key Was Exposed

If the leaked value was a real API key, revoke/rotate it immediately.

Do not paste the API key into ChatGPT, GitHub issues, README files, or screenshots.

Create a new key and keep it only in:

```text
server/.env
```

---

# 46. Testing Checklist

Before submission, verify:

## Resident

- [ ] Start Move-In
- [ ] Start Move-Out
- [ ] Agent detects request type
- [ ] Information extraction works
- [ ] Missing fields are identified
- [ ] Follow-up questions work
- [ ] Summary is displayed
- [ ] Confirmation submits request
- [ ] Request status is visible
- [ ] Admin information request appears
- [ ] Resident can respond
- [ ] Request returns to admin review

## Rules

- [ ] Required fields validated
- [ ] Invalid dates rejected
- [ ] Invalid slots rejected
- [ ] Move-out requirements validated

## Admin

- [ ] Submitted requests visible
- [ ] Request details visible
- [ ] AI recommendation visible
- [ ] Start review works
- [ ] Approve works
- [ ] Reject works
- [ ] Reject reason is stored
- [ ] Request information works
- [ ] Admin note is visible to resident

## Persistence

- [ ] Requests survive server restart
- [ ] Status remains consistent
- [ ] Updated details are persisted

---

# 47. Recommended Manual Test

Use this scenario for the final demo.

### Step 1

Resident:

```text
I want to move in on September 18 between 10 and 12.
My moving company is Agarwal Movers and vehicle number is CG04AB1234.
```

### Step 2

Agent extracts the details.

### Step 3

Agent validates them.

### Step 4

Resident confirms.

### Step 5

Request becomes:

```text
SUBMITTED
```

### Step 6

Admin starts review.

```text
UNDER_REVIEW
```

### Step 7

Admin requests additional information.

```text
NEEDS_INFORMATION
```

### Step 8

Resident provides the information.

### Step 9

Request returns to:

```text
UNDER_REVIEW
```

### Step 10

Admin approves.

```text
APPROVED
```

This demonstrates the complete end-to-end agentic workflow.

---

# 48. Troubleshooting

## Backend does not start

Run:

```bash
cd server
npm install
npm run dev
```

Check:

```bash
node --version
```

Node.js 20+ is recommended.

---

## Frontend does not start

Run:

```bash
cd client
npm install
npm run dev
```

---

## API request fails

Make sure the backend is running:

```text
http://localhost:4000
```

---

## Port already in use

Find the process using the port.

macOS/Linux:

```bash
lsof -i :4000
```

or:

```bash
lsof -i :5173
```

---

## OpenAI API error

If you see:

```text
insufficient_quota
```

or:

```text
credit_balance_exhausted
```

the LLM service cannot make the API call.

The prototype can still use the deterministic fallback agent.

---

# 49. Development Philosophy

The implementation intentionally avoids making the LLM the central source of truth.

Instead:

```text
LLM
 ↓
Intent / Information
 ↓
Structured Representation
 ↓
Deterministic Validation
 ↓
Controlled Workflow
 ↓
Persistence
```

This makes the system easier to:

- Test
- Debug
- Audit
- Secure
- Scale
- Replace with another model

---

# 50. Key Trade-offs

## JSON vs Database

### Chosen

JSON persistence for prototype speed.

### Production

PostgreSQL.

---

## Modular Monolith vs Microservices

### Chosen

Modular monolith.

Reason:

- Faster implementation
- Easier local setup
- Clear module boundaries
- Appropriate for take-home prototype

### Production

Modules can be separated into services when scale requires it.

---

## LLM vs Deterministic Agent

### Chosen

Hybrid.

LLM provides natural-language intelligence while deterministic logic protects critical workflow behavior.

---

## AI Approval vs Human Approval

### Chosen

Human-in-the-loop.

This reduces risk around high-impact administrative decisions.

---

# 51. Limitations

The current prototype intentionally has limitations.

Examples:

- Demo authentication
- JSON persistence
- Limited community configuration
- Simplified notification model
- No production database
- No production-grade authorization
- No real document processing
- No real calendar/slot reservation integration
- Deterministic fallback for environments without LLM credits
- Limited agent memory
- Limited observability

These are deliberate prototype trade-offs rather than hidden assumptions.

---

# 52. Future Enhancements

Potential next iterations:

### Agentic

- Tool calling
- Better structured extraction
- Confidence scores
- Agent memory
- Retrieval-augmented community policy lookup
- Specialized validation agents
- Admin recommendation agent

### Product

- Real slot availability
- Document upload
- Digital approvals
- Notifications
- Resident timeline
- Admin analytics

### Platform

- Multi-community tenancy
- PostgreSQL
- Redis
- Event-driven architecture
- Queue-based processing
- Observability
- Role-based access control

---

# 53. Submission Documents

The project includes supporting documentation.

```text
docs/
├── anacity-explanation.md
└── testing.md
```

`anacity-explanation.md` contains the detailed explanation of:

- Problem interpretation
- User journeys
- Architecture
- Agent behavior
- Tools
- State
- Inference
- Autonomy boundaries
- Scalability
- Assumptions
- Decisions
- Testing
- Limitations
- Production considerations

---

# 54. What This Prototype Demonstrates

The prototype demonstrates a complete workflow rather than only an AI chatbot.

### Resident Side

```text
Natural Language
      ↓
Agent
      ↓
Information Gathering
      ↓
Validation
      ↓
Summary
      ↓
Submission
```

### Admin Side

```text
Submitted Request
      ↓
Context
      ↓
Validation
      ↓
AI Recommendation
      ↓
Human Decision
```

### Feedback

```text
Admin Request
      ↓
Resident Response
      ↓
Agent Update
      ↓
Admin Review
```

---

# 55. Final Architecture Principle

The most important architectural decision is:

> **Keep AI flexible, but keep business-critical behavior deterministic.**

The agent should help users navigate the workflow naturally, while the application remains responsible for correctness, policy enforcement, persistence, authorization, and final decisions.

This approach allows the system to evolve from a prototype into a production-grade community operations platform without rebuilding the core workflow.

---

# 56. Quick Start

For reviewers who only want to run the project:

```bash
git clone https://github.com/tusharsahu2599/MoveInMoveOutAgent.git

cd MoveInMoveOutAgent

cd server
npm install
cp .env.example .env
npm run dev
```

Open another terminal:

```bash
cd MoveInMoveOutAgent/client
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 57. Repository

GitHub:

```text
https://github.com/tusharsahu2599/MoveInMoveOutAgent
```

---

# 58. Assignment Alignment

This prototype is designed around the ANACITY assignment requirements:

- Complete resident move-in experience
- Complete resident move-out experience
- Admin review workflow
- AI-assisted information gathering
- Context maintenance
- Ambiguity handling
- Recommendations
- Controlled workflow actions
- Configurable community rules
- Scalable architecture
- Testing considerations
- Failure recovery
- Production evolution

---

# 59. Final Demo Recommendation

For the final presentation, do not spend most of the time explaining code.

Show the workflow.

Recommended presentation:

```text
1. Resident starts Move-In
             ↓
2. Agent gathers information
             ↓
3. Agent validates
             ↓
4. Resident submits
             ↓
5. Admin receives request
             ↓
6. Admin reviews AI recommendation
             ↓
7. Admin requests information
             ↓
8. Resident responds
             ↓
9. Request returns to admin
             ↓
10. Admin approves/rejects
```

Then explain:

```text
AI handles understanding and orchestration.
Deterministic services handle rules and state.
Humans retain control over consequential decisions.
Community configuration makes the workflow scalable.
```

---

## Built for the ANACITY Move-In / Move-Out Agentic Workflow Assignment