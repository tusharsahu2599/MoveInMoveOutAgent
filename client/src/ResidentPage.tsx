import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  LogOut,
  PackageCheck,
} from "lucide-react";
import { sendAgentMessage } from "./services/agent.service";
import {
  getLatestResidentRequest,
  getResidentRequest,
} from "./services/resident.service";
import "./App.css";

type MoveType = "MOVE_IN" | "MOVE_OUT" | null;

interface AgentResponse {
  message: string;
  action: string;
  status?: string;
  extractedData?: Record<string, unknown>;
  missingFields?: string[];
  validationIssues?: string[];
  request?: any;
}

export default function ResidentPage() {
  const [moveType, setMoveType] = useState<MoveType>(null);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<
    { role: "user" | "assistant"; content: string; timestamp: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [adminRequestNote, setAdminRequestNote] = useState<string | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const checkRequestStatus = async () => {
    if (!currentRequest?.id) {
      return;
    }

    try {
      const request = await getResidentRequest(currentRequest.id);

      setCurrentRequest(request);

      if (request.status === "NEEDS_INFORMATION") {
        setAdminRequestNote(
          request.adminNote ??
            "The community admin has requested additional information for your move request.",
        );
      } else {
        setAdminRequestNote(null);
      }
    } catch (error) {
      console.error("Unable to check request status:", error);
    }
  };

  const startMoveRequest = (type: MoveType) => {
    if (!type) return;

    setMoveType(type);
    setResponse(null);
    setCurrentRequest(null);
    setConversationHistory([]);
    setMessage("");
  };

  const sendQuickMessage = async (quickMessage: string) => {
    setMessage(quickMessage);

    // Give React a moment to update the state,
    // then send the selected answer.
    setTimeout(() => {
      sendAgentMessageFromText(quickMessage);
    }, 0);
  };

  const sendAgentMessageFromText = async (userMessage: string) => {
    if (!userMessage.trim() || !moveType || loading) return;

    const newHistory = [
      ...conversationHistory,
      {
        role: "user" as const,
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ];

    setLoading(true);
    setMessage("");

    try {
      const result = await sendAgentMessage(userMessage, {
        residentId: "resident-001",
        communityId: "community-001",
        unitId: "A-1204",
        requestType: moveType,
        currentRequest: currentRequest ?? undefined,
        conversationHistory: newHistory,
      });

      const agentResponse = result;

      setResponse(agentResponse);

      setResponse(agentResponse);

      if (agentResponse.request) {
        setCurrentRequest(agentResponse.request);
      } else if (currentRequest && agentResponse.extractedData) {
        setCurrentRequest({
          ...currentRequest,
          details: {
            ...currentRequest.details,
            ...agentResponse.extractedData,
          },
          updatedAt: new Date().toISOString(),
        });
      } else if (agentResponse.extractedData) {
        setCurrentRequest({
          id: `LOCAL-${Date.now()}`,
          type: moveType,
          status: agentResponse.status ?? "INCOMPLETE",
          residentId: "resident-001",
          communityId: "community-001",
          unitId: "A-1204",
          details: {
            ...agentResponse.extractedData,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setConversationHistory([
        ...newHistory,
        {
          role: "assistant",
          content: agentResponse.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error(error);

      setResponse({
        message:
          "Something went wrong while processing your request. Please try again.",
        action: "VALIDATE",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    sendAgentMessageFromText(message.trim());
  };

  const resetFlow = () => {
    setMoveType(null);
    setResponse(null);
    setCurrentRequest(null);
    setConversationHistory([]);
    setMessage("");
  };

  useEffect(() => {
    const loadLatestRequest = async () => {
      try {
        const request = await getLatestResidentRequest("resident-001");

        if (!request) {
          return;
        }

        setCurrentRequest(request);

        if (request.type === "MOVE_IN" || request.type === "MOVE_OUT") {
          setMoveType(request.type);
        }

        if (request.status === "NEEDS_INFORMATION") {
          setAdminRequestNote(
            request.adminNote ??
              "The community admin has requested additional information for your move request.",
          );
        } else {
          setAdminRequestNote(null);
        }
      } catch (error) {
        console.error("Unable to load resident request:", error);
      }
    };

    loadLatestRequest();
  }, []);

  useEffect(() => {
    if (
      !currentRequest?.id ||
      currentRequest.status === "APPROVED" ||
      currentRequest.status === "REJECTED"
    ) {
      return;
    }

    checkRequestStatus();

    const interval = window.setInterval(() => {
      checkRequestStatus();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [currentRequest?.id, currentRequest?.status]);

  const getActionLabel = () => {
    if (!response) return null;

    switch (response.action) {
      case "ASK_QUESTION":
        return "Information needed";

      case "SHOW_SUMMARY":
        return "Ready for your review";

      case "VALIDATE":
        return "Please update your request";

      case "SUBMIT_REQUEST":
        return "Request submitted";

      case "UPDATE_REQUEST":
        return "Information submitted for review";

      default:
        return null;
    }
  };

  return (
    <div className="resident-page">
      {/* Header */}
      <header className="resident-header">
        <div className="resident-brand">
          <div className="brand-icon">
            <Home size={22} />
          </div>

          <div>
            <h1>ANACITY</h1>
            <span>Resident Portal</span>
          </div>
        </div>

        <div className="resident-profile">
          <div className="profile-avatar">RS</div>

          <div className="profile-info">
            <strong>Rahul Sharma</strong>
            <span>Unit A-1204</span>
          </div>
        </div>
      </header>

      <main className="resident-content">
        {/* Welcome */}
        <section className="welcome-section">
          <span className="eyebrow">GREEN VALLEY RESIDENCY</span>

          <h2>
            How can we help with
            <br />
            your move?
          </h2>

          <p>
            Our move assistant will guide you through the process, check
            community requirements, and prepare your request for submission.
          </p>
        </section>

        {/* Move type selection */}
        {!moveType && (
          <section className="move-options">
            <button
              className="move-card"
              onClick={() => startMoveRequest("MOVE_IN")}
            >
              <div className="move-card-icon">
                <PackageCheck size={26} />
              </div>

              <div className="move-card-content">
                <span className="move-card-label">MOVE IN</span>

                <h3>I'm moving into my unit</h3>

                <p>
                  Schedule your move-in, provide vehicle details and coordinate
                  with the community.
                </p>

                <span className="move-card-action">
                  Start move-in <ArrowRight size={17} />
                </span>
              </div>
            </button>

            <button
              className="move-card"
              onClick={() => startMoveRequest("MOVE_OUT")}
            >
              <div className="move-card-icon move-out-icon">
                <LogOut size={26} />
              </div>

              <div className="move-card-content">
                <span className="move-card-label">MOVE OUT</span>

                <h3>I'm moving out of my unit</h3>

                <p>
                  Schedule your move-out, inspection and clearance information
                  before leaving the community.
                </p>

                <span className="move-card-action">
                  Start move-out <ArrowRight size={17} />
                </span>
              </div>
            </button>
          </section>
        )}

        {/* Admin action card */}
        {currentRequest?.status === "NEEDS_INFORMATION" && (
          <div className="resident-admin-request">
            <div className="resident-admin-request-header">
              <div className="resident-admin-request-icon">!</div>

              <div>
                <div className="resident-admin-eyebrow">ACTION REQUIRED</div>

                <h3>Community admin needs more information</h3>
              </div>
            </div>

            <div className="resident-admin-request-body">
              <p>
                Your move request is waiting for additional information before
                the community team can continue the review.
              </p>

              <div className="resident-admin-message">
                <span>Admin message</span>

                <p>
                  {adminRequestNote ||
                    "The community admin has requested additional information for your move request."}
                </p>
              </div>

              <button
                type="button"
                className="resident-admin-action"
                onClick={() => {
                  const adminMessage =
                    adminRequestNote ||
                    "The community admin has requested additional information for your move request.";

                  setConversationHistory((history) => [
                    ...history,
                    {
                      role: "assistant",
                      content: `The community admin has requested additional information: ${adminMessage}`,
                      timestamp: new Date().toISOString(),
                    },
                  ]);

                  setMessage("");
                  messageInputRef.current?.focus();
                }}
              >
                Provide information
              </button>
            </div>
          </div>
        )}

        {/* Conversation */}
        {moveType && (
          <section className="agent-workspace">
            <div className="agent-header">
              <div>
                <span className="eyebrow">
                  {moveType === "MOVE_IN"
                    ? "MOVE-IN ASSISTANT"
                    : "MOVE-OUT ASSISTANT"}
                </span>

                <h2>
                  {moveType === "MOVE_IN"
                    ? "Let's prepare your move-in"
                    : "Let's prepare your move-out"}
                </h2>
              </div>

              <button className="secondary-button" onClick={resetFlow}>
                Start over
              </button>
            </div>

            {/* Conversation */}
            <div className="conversation-panel">
              {conversationHistory.length === 0 && (
                <div className="assistant-message">
                  <div className="assistant-avatar">AI</div>

                  <div className="message-bubble">
                    <strong>Move Assistant</strong>

                    <p>
                      {moveType === "MOVE_IN"
                        ? "I'll help you complete your move-in request. Tell me your preferred move date, time, moving company and vehicle number."
                        : "I'll help you complete your move-out request. I'll also check your inspection, dues clearance and access-card requirements."}
                    </p>
                  </div>
                </div>
              )}

              {conversationHistory.map((item, index) => (
                <div
                  key={`${item.timestamp}-${index}`}
                  className={
                    item.role === "user" ? "user-message" : "assistant-message"
                  }
                >
                  {item.role === "assistant" && (
                    <div className="assistant-avatar">AI</div>
                  )}

                  <div className="message-bubble">
                    {item.role === "assistant" && (
                      <strong>Move Assistant</strong>
                    )}

                    <p>{item.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="assistant-message">
                  <div className="assistant-avatar">AI</div>

                  <div className="message-bubble">
                    <strong>Move Assistant</strong>
                    <p className="typing-indicator">
                      Thinking<span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Agent status */}
            {response && (
              <div className="agent-result">
                <div className="agent-result-header">
                  <div>
                    <span className="eyebrow">ASSISTANT STATUS</span>
                    <h3>{getActionLabel()}</h3>
                  </div>

                  {response.status && (
                    <span className="status-pill">
                      {response.status.replaceAll("_", " ")}
                    </span>
                  )}
                </div>

                {/* Validation issues */}
                {response.validationIssues &&
                  response.validationIssues.length > 0 && (
                    <div className="validation-box">
                      <strong>Issues found</strong>

                      <ul>
                        {response.validationIssues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Request summary */}
                {response.request && (
                  <div className="request-summary">
                    <div className="summary-header">
                      <div>
                        <span className="eyebrow">REQUEST SUMMARY</span>
                        <h3>
                          {response.request.type === "MOVE_IN"
                            ? "Move-in request"
                            : "Move-out request"}
                        </h3>
                      </div>

                      <CheckCircle2 size={22} />
                    </div>

                    <div className="summary-grid">
                      <div>
                        <span>Move date</span>
                        <strong>
                          {response.request.details?.moveDate || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Time slot</span>
                        <strong>{response.request.details?.slot || "—"}</strong>
                      </div>

                      <div>
                        <span>Moving company</span>
                        <strong>
                          {response.request.details?.movingCompany || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Vehicle number</span>
                        <strong>
                          {response.request.details?.vehicleNumber || "—"}
                        </strong>
                      </div>

                      {response.request.type === "MOVE_OUT" && (
                        <>
                          <div>
                            <span>Inspection</span>
                            <strong>
                              {response.request.details?.inspectionScheduled
                                ? "Scheduled"
                                : "Not scheduled"}
                            </strong>
                          </div>

                          <div>
                            <span>Dues</span>
                            <strong>
                              {response.request.details?.duesCleared
                                ? "Cleared"
                                : "Not cleared"}
                            </strong>
                          </div>

                          <div>
                            <span>Access cards</span>
                            <strong>
                              {response.request.details?.accessCardsReturned
                                ? "Will return"
                                : "Not confirmed"}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="agent-input-area">
              {response?.action === "ASK_QUESTION" &&
                moveType === "MOVE_OUT" &&
                response.missingFields?.[0] === "inspectionScheduled" && (
                  <div className="quick-actions">
                    <button
                      onClick={() =>
                        sendQuickMessage(
                          "Yes, my move-out inspection is scheduled.",
                        )
                      }
                    >
                      Yes, inspection is scheduled
                    </button>

                    <button
                      onClick={() =>
                        sendQuickMessage(
                          "No, my move-out inspection is not scheduled.",
                        )
                      }
                    >
                      Not yet
                    </button>
                  </div>
                )}

              {response?.action === "ASK_QUESTION" &&
                moveType === "MOVE_OUT" &&
                response.missingFields?.[0] === "duesCleared" && (
                  <div className="quick-actions">
                    <button
                      onClick={() =>
                        sendQuickMessage("Yes, my dues are cleared.")
                      }
                    >
                      Yes, dues are cleared
                    </button>

                    <button
                      onClick={() =>
                        sendQuickMessage("No, my dues are not cleared.")
                      }
                    >
                      No, not yet
                    </button>
                  </div>
                )}

              {response?.action === "ASK_QUESTION" &&
                moveType === "MOVE_OUT" &&
                response.missingFields?.[0] === "accessCardsReturned" && (
                  <div className="quick-actions">
                    <button
                      onClick={() =>
                        sendQuickMessage(
                          "Yes, I will return all community access cards.",
                        )
                      }
                    >
                      Yes, I will return them
                    </button>

                    <button
                      onClick={() =>
                        sendQuickMessage(
                          "No, I cannot return the access cards.",
                        )
                      }
                    >
                      No
                    </button>
                  </div>
                )}

              <textarea
                ref={messageInputRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  moveType === "MOVE_IN"
                    ? "For example: I want to move in on September 18 at 2 PM..."
                    : "Tell me your move-out date, time, company or vehicle details..."
                }
                rows={3}
                disabled={loading}
              />

              <button
                className="primary-button"
                onClick={sendMessage}
                disabled={!message.trim() || loading}
              >
                {loading ? "Processing..." : "Send"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </div>

            <p className="input-hint">
              Press Enter to send · Shift + Enter for a new line
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
