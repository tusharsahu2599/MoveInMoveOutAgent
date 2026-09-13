# ANACITY Move-in / Move-out Agentic Workflow

An agentic workflow prototype for managing resident move-in and move-out requests in a community.

The system supports both sides of the experience:

- Residents create and complete move requests with assistance from an AI agent.
- Community admins review requests, validate the provided information, and make decisions.
- The agent handles information extraction, contextual questions, validation guidance, and resident/admin handoffs.
- Community-specific rules are configuration-driven rather than hardcoded into the UI.

---

## 1. Problem

Move-in and move-out processes involve multiple pieces of information and community-specific policies.

Residents need help understanding what information is required and whether their requested date/time is valid.

Community admins need enough context to confidently review and act on a request.

The goal of this prototype is therefore not simply to add a chatbot, but to create an intelligent workflow where the agent assists with information gathering and orchestration while deterministic business rules and human decisions remain authoritative.

---

## 2. Key Capabilities

### Resident

- Start a move-in request
- Start a move-out request
- Provide information using natural language
- Agent extracts relevant move details
- Agent asks for missing information
- Agent validates community rules
- Agent identifies invalid dates/times
- Agent provides a request summary
- Submit completed request
- See request status
- Receive additional-information requests from admins
- Respond to admin requests
- Request returns to admin review after resident response

### Admin

- View submitted requests
- View resident and unit context
- View request details
- View validation results
- View AI-generated recommendation
- Start review
- Approve request
- Reject request with reason
- Request additional information
- Review updated requests after resident response
- View workflow/activity history

---

## 3. End-to-End Workflow

```text
Resident
   |
   v
Start Move-in / Move-out
   |
   v
Move Agent
   |
   +---- Extract information
   |
   +---- Ask missing questions
   |
   +---- Validate community rules
   |
   v
Request Summary
   |
   v
Resident Submission
   |
   v
Admin Review
   |
   +----------------------+
   |                      |
   v                      v
Approve                Reject
   |
   |
   +---- OR ----+
               |
               v
       Request Information
               |
               v
          Resident
               |
               v
          Agent updates
          existing request
               |
               v
          UNDER_REVIEW
               |
               v
          Admin Review
```
