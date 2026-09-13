# Testing & Validation

## 1. Test Environment

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Persistence: JSON-backed repository
- Agent: Move Agent with deterministic fallback
- Browser: Chrome
- Environment: Local development

---

## 2. End-to-End Test Scenarios

| ID     | Scenario                              | Expected Result                           |
| ------ | ------------------------------------- | ----------------------------------------- |
| E2E-01 | Resident starts move-in               | Agent begins move-in workflow             |
| E2E-02 | Resident completes move-in details    | Required information is collected         |
| E2E-03 | Resident submits move-in              | Request becomes SUBMITTED                 |
| E2E-04 | Resident starts move-out              | Agent begins move-out workflow            |
| E2E-05 | Missing move-out information          | Agent asks contextual follow-up questions |
| E2E-06 | Invalid move date                     | Agent/rules identify the issue            |
| E2E-07 | Invalid move time                     | Agent/rules identify the issue            |
| E2E-08 | Admin starts review                   | Request becomes UNDER_REVIEW              |
| E2E-09 | Admin approves request                | Request becomes APPROVED                  |
| E2E-10 | Admin rejects request                 | Request becomes REJECTED with reason      |
| E2E-11 | Admin requests information            | Request becomes NEEDS_INFORMATION         |
| E2E-12 | Resident receives information request | Resident sees admin message               |
| E2E-13 | Resident provides information         | Request returns to UNDER_REVIEW           |
| E2E-14 | Backend restart                       | Persisted requests remain available       |

---

## 3. Agent Behavior

| ID    | Behavior                             | Expected Result                      |
| ----- | ------------------------------------ | ------------------------------------ |
| AG-01 | Understand move-in intent            | MOVE_IN selected                     |
| AG-02 | Understand move-out intent           | MOVE_OUT selected                    |
| AG-03 | Extract date                         | Date stored                          |
| AG-04 | Extract time                         | Time slot stored                     |
| AG-05 | Extract vehicle number               | Vehicle stored                       |
| AG-06 | Extract moving company               | Company stored                       |
| AG-07 | Handle missing information           | Ask only for missing information     |
| AG-08 | Handle invalid community rule        | Explain issue and request correction |
| AG-09 | Respond to admin information request | Update existing request              |
| AG-10 | Return request to admin review       | Status becomes UNDER_REVIEW          |

---

## 4. Workflow Validation

The following state transitions were validated:

SUBMITTED → UNDER_REVIEW

UNDER_REVIEW → APPROVED

UNDER_REVIEW → REJECTED

UNDER_REVIEW → NEEDS_INFORMATION

NEEDS_INFORMATION → UNDER_REVIEW

Invalid transitions are rejected by the workflow layer.

---

## 5. Business Rule Validation

Validated rules include:

- Required move details
- Community-specific allowed days
- Community-specific time windows
- Move-out inspection requirement
- Dues clearance requirement
- Access-card confirmation

Community rules are configuration-driven rather than embedded directly in the UI.

---

## 6. Persistence Validation

Requests were created and updated successfully.

After restarting the backend, persisted requests remained available from the JSON-backed repository.

---

## 7. Resident/Admin Feedback Loop

Validated complete loop:

Resident creates request

→ Agent collects information

→ Resident submits

→ Admin reviews

→ Admin requests additional information

→ Resident sees admin request

→ Resident responds

→ Agent updates request

→ Request returns to UNDER_REVIEW

→ Admin can continue review

---

## 8. Known Limitations

### Authentication

The prototype uses demo users rather than production authentication and authorization.

### Persistence

The prototype uses a JSON-backed repository. Production should use a transactional database.

### Notifications

The prototype does not send email, push, SMS, or in-app notifications.

### LLM Availability

The agent supports a deterministic fallback so the workflow remains demonstrable when an LLM provider is unavailable.

### File Uploads

Documents such as move-out inspection evidence are not implemented in this prototype.

### Concurrency

The JSON repository is intended for demonstration and does not provide production-grade concurrent-write guarantees.

---

## 9. Production Validation Next Steps

Before production deployment:

1. Add automated unit tests for rules and workflow transitions.
2. Add API integration tests.
3. Add frontend end-to-end tests.
4. Introduce a transactional database.
5. Add authentication and role-based authorization.
6. Add notification infrastructure.
7. Add structured audit/event storage.
8. Add observability and agent tracing.
9. Add rate limiting and security controls.
10. Run load and failure-recovery testing.
