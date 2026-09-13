```
ANACITY Move-in / Move-out Agentic Workflow

1. Executive Summary

This prototype designs an end-to-end agentic workflow for resident move-in and move-out experiences within a community.

The workflow supports two primary personas:

Resident — initiates and completes a move-in or move-out request.
Community Admin — reviews the request, understands the context, requests additional information when necessary, and makes the final decision.

The central design principle is:

AI handles ambiguity and orchestration; deterministic services handle rules and workflow state; humans retain control over consequential decisions.

The agent is therefore not implemented as a standalone chatbot. It operates as an intelligent layer over a structured workflow.

The prototype demonstrates:

Natural-language information collection
Context-aware follow-up questions
Community-specific rule validation
Request summarization
Admin recommendations
Admin approval/rejection
Admin requests for additional information
Resident feedback and response
Request re-entry into the admin review workflow
Persistent request state
Explicit workflow transitions 2. Problem Interpretation

The move-in/move-out process appears simple from a resident's perspective but contains several sources of complexity:

Different communities can have different policies.
Different information is required for move-in and move-out.
Residents may provide information in natural language.
Required information may be missing.
Requested dates or times may violate community rules.
Move-out can introduce additional operational requirements such as inspection, dues clearance, and access-card return.
Admins need sufficient context to make a confident decision.
Requests may require multiple interactions between residents and admins.

A simple form-based workflow can enforce required fields, but it can create friction when residents do not know exactly what is required or provide information conversationally.

A simple chatbot can make the experience more natural, but allowing the LLM to directly control business state introduces reliability and safety concerns.

The proposed solution combines both approaches.

3. Design Goals

The prototype was designed around the following goals.

3.1 Resident simplicity

Residents should be able to explain their move naturally rather than navigating a large form.

For example:

"I want to move out on September 19 at 2 PM with ABC Movers. My vehicle is CG04AB1234."

The agent should extract the relevant information and identify what is still missing.

3.2 Context-aware assistance

The agent should understand what information has already been provided and ask only for missing information.

3.3 Community-specific behavior

Different communities should be able to configure:

Allowed move days
Move windows
Required fields
Move-out requirements

without requiring changes to the core workflow.

3.4 Admin confidence

Admins should receive:

Resident information
Unit information
Request details
Validation results
Warnings
AI recommendation
Request history/context

before making a decision.

3.5 Safe AI boundaries

The AI should assist with interpretation and recommendations but should not become the authority for critical business decisions.

3.6 Recoverability

A temporary AI failure should not destroy the underlying request or workflow state.

4. Personas
   4.1 Resident

The resident wants to:

Start a move request
Understand what information is required
Complete the request with minimal friction
Know whether their requested schedule is valid
Submit the request
Understand the current status
Respond when the admin needs more information
4.2 Community Admin

The admin wants to:

See incoming requests
Understand the resident's intent and details quickly
Identify rule violations
Understand warnings
Request additional information
Approve or reject requests confidently
Leave a reason when rejecting or requesting information 5. Resident Journey
5.1 Start

The resident chooses:

Move-in
Move-out

The selected type determines the workflow and required information.

5.2 Information Collection

The resident can provide information naturally.

Example:

"I want to move in on September 18 at 2 PM with ABC Movers. Vehicle number is CG04AB1234."

The agent extracts:

Move date: September 18
Time: 14:00
Moving company: ABC Movers
Vehicle: CG04AB1234
5.3 Missing Information

If required information is missing, the agent asks a targeted question.

For move-out, additional questions can include:

Is the inspection scheduled?
Are dues cleared?
Will access cards be returned?

The agent maintains the conversation context so the resident does not need to repeat information.

5.4 Validation

The extracted information is passed through deterministic community rules.

Examples:

Is the requested day allowed?
Is the requested time within the community's move window?
Are required fields present?

If a rule is violated, the resident receives an explanation and can provide a corrected value.

5.5 Summary

Once sufficient information is available, the system presents a structured request summary.

Example:

Move-out request

Date: September 19
Time: 2:00 PM
Moving company: ABC Movers
Vehicle: CG04AB1234
Inspection: Scheduled
Dues: Cleared
Access cards: Will return

The resident can then submit the request.

6. Admin Journey

After submission:

SUBMITTED
↓
UNDER_REVIEW

The admin receives a structured view of the request.

The admin can see:

Request type
Resident
Email
Unit
Community
Move date
Time slot
Moving company
Vehicle
Move-out-specific information
Validation results
Warnings
AI recommendation 7. Admin Decision Flow

The admin has three primary options.

Approve
UNDER_REVIEW → APPROVED
Reject
UNDER_REVIEW → REJECTED

The admin can provide a reason.

Request Information
UNDER_REVIEW → NEEDS_INFORMATION

The admin provides a message explaining what is required.

For example:

"Please confirm your updated vehicle number."

The resident then sees an explicit action-required message.

8. Resident ↔ Admin Feedback Loop

This is one of the most important parts of the prototype.

The complete loop is:

Resident
↓
Agent
↓
Request Submitted
↓
Admin Review
↓
Admin Needs Information
↓
NEEDS_INFORMATION
↓
Resident Portal
↓
Admin Message
↓
Resident Response
↓
Agent
↓
Existing Request Updated
↓
UNDER_REVIEW
↓
Admin Review

This prevents the workflow from becoming a one-way submission system.

The resident can continue an existing request after an admin asks for additional information.

9. Agent Design

The Move Agent is responsible for conversational intelligence.

Its responsibilities include:

Intent understanding

Determine whether the resident is discussing:

Move-in
Move-out
Information extraction

Extract structured fields from natural language.

Context management

Maintain:

Existing request
Conversation history
Request type
Community
Unit
Previously collected details
Missing-information detection

Determine which required fields have not yet been supplied.

Follow-up questioning

Ask focused questions instead of requesting the entire form again.

Validation guidance

Explain problems detected by the rules engine.

Summarization

Convert the collected information into a structured request summary.

Request update

When an admin has requested information, the agent can update the existing request with the resident's response.

10. Agent Boundaries

The agent intentionally does not own critical workflow state.

The following operations remain deterministic:

Request persistence
Status transitions
Business-rule validation
Request creation
Request updates
Admin approval
Admin rejection

This creates a clear separation:

AI
↓
Interpretation
↓
Recommendation / Orchestration
↓
Deterministic Services
↓
State / Rules / Persistence 11. Why This Boundary Matters

LLMs are probabilistic.

Business workflows should be predictable.

For example, an LLM should not be allowed to arbitrarily produce:

status = APPROVED

and have the database accept that transition.

Instead:

Agent recommendation
↓
Admin action
↓
Workflow Service
↓
Validate transition
↓
Persist state

This makes the workflow auditable and testable.

12. Workflow State Machine

The system explicitly models request state.

DRAFT
|
v
INCOMPLETE
|
v
READY_FOR_SUBMISSION
|
v
SUBMITTED
|
v
UNDER_REVIEW
|
+----------------+----------------+
| | |
v v v
APPROVED REJECTED NEEDS_INFORMATION
|
v
UNDER_REVIEW

Invalid transitions are rejected.

For example:

APPROVED → UNDER_REVIEW

is not allowed.

This prevents accidental or AI-generated invalid state changes.

13. Rules Engine

Community-specific rules are separated from the agent.

The rules engine evaluates:

Move-in
Required fields
Allowed days
Allowed time range
Move-out
Required fields
Allowed days
Allowed time range
Inspection requirement
Dues clearance
Access-card confirmation

The result contains:

valid
issues
warnings

This allows the agent to explain deterministic results without being responsible for determining the rules itself.

14. Configuration vs Core Logic

A major scalability decision is separating configuration from core workflow logic.

Configurable

Community-specific information such as:

Allowed days
Move window
Required fields
Inspection requirement
Dues requirement
Core

Shared system behavior such as:

Request lifecycle
Agent orchestration
State machine
Validation framework
Admin review workflow
Persistence interface
Audit model

This means adding a new community should primarily involve configuration rather than creating another custom workflow.

15. Architecture

The prototype uses a modular monolith.

                  React Frontend
                         |
              +----------+----------+
              |                     |
        Resident UI             Admin UI
              |                     |
              +----------+----------+
                         |
                    Express API
                         |
          +--------------+--------------+
          |                             |
     Move Agent                    Admin Service
          |                             |
          +--------------+--------------+
                         |
                   Rules Engine
                         |
                  Workflow Service
                         |
                Request Repository
                         |
                  Persistent Store

The modular monolith was selected because the prototype needs to demonstrate behavior quickly without introducing unnecessary distributed-system complexity.

The internal modules still have clear responsibilities, making future extraction into services possible.

16. Data and State

The system maintains request state containing information such as:

Request ID
Request type
Status
Resident
Community
Unit
Move details
AI summary
AI recommendation
Admin note
Created timestamp
Updated timestamp

Conversation context is separately provided to the agent.

This separation allows the request to remain durable even if the conversational session ends.

17. Persistence

The prototype uses a JSON-backed repository.

This was intentionally selected to keep the prototype:

Easy to run
Easy to inspect
Easy to demonstrate
Free from external infrastructure dependencies

The persistence layer is isolated from the rest of the application so it can later be replaced with a database.

A production implementation should use a transactional database such as PostgreSQL.

18. Failure Recovery

The design considers several failure scenarios.

LLM unavailable

The prototype supports deterministic fallback behavior for the core move workflow.

This allows the system to continue demonstrating:

Extraction
Required-field handling
Validation
Workflow transitions

without making the LLM provider a single point of failure.

Invalid workflow transition

The workflow service rejects the transition.

Invalid business data

The rules engine returns validation issues.

Admin needs more information

The request enters:

NEEDS_INFORMATION

and remains persistent until the resident responds.

Backend restart

The request can be recovered from persistent storage.

19. Admin Recommendation Model

The admin view derives a recommendation from deterministic validation results.

Conceptually:

No issues + no warnings
↓
APPROVE

Warnings present
↓
REVIEW

Validation issues
↓
REJECT

This recommendation is advisory.

The admin remains responsible for the final action.

This distinction is important because the system should not imply that the AI has authority to make community decisions.

20. Scalability

The architecture is designed to scale along multiple dimensions.

More communities

Add configuration rather than duplicate workflows.

Community A
Community B
Community C
|
v
Shared Move Workflow
More request types

The workflow can introduce additional request types while sharing common services.

More integrations

Tools can be added for:

Calendar/slot availability
Payment/dues systems
Inspection scheduling
Notification services
Resident management systems
Larger traffic

The modular monolith can eventually be decomposed into services:

API Gateway
|
+---- Request Service
|
+---- Workflow Service
|
+---- Agent Service
|
+---- Rules Service
|
+---- Notification Service
|
+---- Audit Service

The prototype does not require this distributed architecture yet.

21. Tool-Oriented Agent Evolution

The current prototype focuses on the core workflow.

In production, the agent could use controlled tools such as:

get_community_rules()
get_available_move_slots()
validate_move_request()
get_dues_status()
get_inspection_status()
update_move_request()
submit_move_request()
request_admin_review()

The agent should not directly manipulate the database.

Instead:

Agent
↓
Tool
↓
Validated Service
↓
Database

This provides stronger guardrails and observability.

22. Assumptions

The prototype makes the following assumptions:

A resident belongs to a community.
A resident has a unit.
Community move policies can be represented as configuration.
Move-in and move-out have different requirements.
Admins remain responsible for final decisions.
Requests have a persistent lifecycle.
Residents may need to respond after an admin review.
AI is primarily valuable for natural-language interaction and ambiguity handling.
Deterministic validation is preferable for explicit business rules. 23. Key Product and Engineering Decisions
Decision 1 — Agent instead of a static form

Natural-language interaction reduces friction when residents do not know exactly how to structure their information.

Decision 2 — Deterministic rules

Community policy should not depend on probabilistic model output.

Decision 3 — Human-in-the-loop approval

Admins retain control of consequential decisions.

Decision 4 — Configuration-driven communities

Community differences should not require separate implementations.

Decision 5 — Modular monolith

Appropriate for the prototype while maintaining production-oriented module boundaries.

Decision 6 — Persistent workflow state

Requests should survive conversational interruptions and backend restarts.

24. Testing

The prototype was tested across the primary workflow paths.

Resident
Move-in
Move-out
Missing information
Invalid date
Invalid time
Submission
Admin information request
Resident response
Admin
Request listing
Start review
Approve
Reject
Request information
Review updated request
System
Workflow transitions
Business-rule validation
Persistence
Backend restart recovery

Detailed scenarios are documented in:

docs/testing.md 25. Known Limitations

This is a prototype rather than a production system.

Authentication

Demo users are used instead of production identity management.

Persistence

JSON storage does not provide production-grade transactions or concurrency handling.

Notifications

There is no email, push, or SMS notification infrastructure.

Documents

Move-in/move-out document uploads are not implemented.

LLM

The prototype supports deterministic fallback behavior rather than depending exclusively on a live LLM provider.

Authorization

Production-grade community and role-level authorization would need to be implemented.

Observability

Production agent tracing, metrics, and distributed tracing are not yet implemented.

26. Production Roadmap
    Phase 1 — Production Data Layer
    PostgreSQL
    Database migrations
    Transaction handling
    Optimistic locking
    Repository abstraction
    Phase 2 — Identity and Security
    Authentication
    Role-based authorization
    Community-level access control
    Secrets management
    Rate limiting
    Phase 3 — Agent Platform
    Production LLM integration
    Structured tool calling
    Prompt versioning
    Agent evaluation
    Guardrails
    Agent execution tracing
    Phase 4 — Integrations
    Community management system
    Dues/payment system
    Inspection scheduling
    Calendar availability
    Notification services
    Phase 5 — Reliability and Observability
    Metrics
    Structured logs
    Distributed tracing
    Error monitoring
    Retry mechanisms
    Queue-based processing
    Phase 6 — Multi-community Platform
    Community configuration management
    Policy versioning
    Community-specific workflows
    Feature flags
    Tenant isolation
27. What the Prototype Demonstrates

The prototype demonstrates that an agentic workflow can improve the move-in/move-out experience without turning the entire workflow over to an LLM.

The agent adds value where ambiguity exists:

Natural language
↓
Understanding
↓
Information extraction
↓
Contextual questions
↓
Guidance

Deterministic systems handle certainty:

Business rules
↓
Workflow state
↓
Persistence
↓
Authorization

Humans retain control where judgment matters:

Admin context
↓
Recommendation
↓
Human decision
↓
Workflow action 28. Final Design Principle

The most important architectural principle of this solution is:

AI should make the workflow easier to navigate, not make the workflow unpredictable.

The resident gets a conversational experience.

The community gets configurable policies.

The admin gets sufficient context to make a confident decision.

The platform retains deterministic state, validation, persistence, and auditability.

This creates a foundation that can evolve from a prototype into a scalable multi-community move management platform.
```
