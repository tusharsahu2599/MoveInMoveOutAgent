import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";

import {
  approveRequest,
  getAdminRequests,
  rejectRequest,
  requestMoreInformation,
  startReview,
  type AdminRequest,
} from "./services/admin.service";

function StatusBadge({
  status,
}: {
  status: AdminRequest["request"]["status"];
}) {
  const config = {
    SUBMITTED: {
      label: "Submitted",
      icon: Clock3,
    },
    UNDER_REVIEW: {
      label: "Under Review",
      icon: Clock3,
    },
    NEEDS_INFORMATION: {
      label: "Needs Information",
      icon: AlertCircle,
    },
    APPROVED: {
      label: "Approved",
      icon: CheckCircle2,
    },
    REJECTED: {
      label: "Rejected",
      icon: XCircle,
    },
  } as const;

  const item = config[status as keyof typeof config] ?? {
    label: status,
    icon: FileText,
  };

  const Icon = item.icon;

  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <Icon size={14} />
      {item.label}
    </span>
  );
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);

  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [decisionModal, setDecisionModal] = useState<{
    type: "REJECT" | "NEEDS_INFORMATION";
    requestId: string;
  } | null>(null);

  const [decisionNote, setDecisionNote] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminRequests();

      setRequests(data);

      if (selectedRequest) {
        const updated = data.find(
          (item) => item.request.id === selectedRequest.request.id,
        );

        setSelectedRequest(updated ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleReview(id: string) {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      const updated = await startReview(id);

      setSelectedRequest(updated);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start review");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove(id: string) {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      const updated = await approveRequest(id);

      setSelectedRequest(updated);
      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to approve request",
      );
    } finally {
      setActionLoading(false);
    }
  }

  const handleReject = async (id: string) => {
    setDecisionModal({
      type: "REJECT",
      requestId: id,
    });
    setDecisionNote("");
  };

  //   async function handleNeedInformation(id: string) {
  //     if (!selectedRequest) return;

  //     try {
  //       setActionLoading(true);

  //       const updated = await requestMoreInformation(id);

  //       setSelectedRequest(updated);
  //       await loadRequests();
  //     } catch (err) {
  //       setError(
  //         err instanceof Error ? err.message : "Unable to request information",
  //       );
  //     } finally {
  //       setActionLoading(false);
  //     }
  //   }

  const handleNeedInformation = async (id: string) => {
    setDecisionModal({
      type: "NEEDS_INFORMATION",
      requestId: id,
    });
    setDecisionNote("");
  };

  const handleDecisionSubmit = async () => {
    if (!decisionModal) return;

    const note = decisionNote.trim();

    if (!note) {
      setError(
        decisionModal.type === "REJECT"
          ? "Please provide a rejection reason."
          : "Please provide the information required from the resident.",
      );
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      let updatedRequest: AdminRequest;

      if (decisionModal.type === "REJECT") {
        updatedRequest = await rejectRequest(decisionModal.requestId, note);
      } else {
        updatedRequest = await requestMoreInformation(
          decisionModal.requestId,
          note,
        );
      }

      setSelectedRequest(updatedRequest);

      setRequests((current) =>
        current.map((item) =>
          item.request.id === updatedRequest.request.id ? updatedRequest : item,
        ),
      );

      setDecisionModal(null);
      setDecisionNote("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete admin action.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-shell">
        <header className="admin-page-header">
          <div>
            <div className="brand">ANACITY</div>
            <h1>Move Management</h1>
            <p>Review and manage resident move requests.</p>
          </div>

          <button
            className="secondary-button"
            onClick={loadRequests}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <main className="admin-layout">
          <section className="request-list">
            <div className="section-heading">
              <div>
                <h2>Requests</h2>
                <span>{requests.length} total</span>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <FileText size={36} />
                <h3>No move requests</h3>
                <p>Submitted resident requests will appear here.</p>
              </div>
            ) : (
              <div className="request-cards">
                {requests.map((item) => (
                  <button
                    key={item.request.id}
                    className={`request-card ${
                      selectedRequest?.request.id === item.request.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => setSelectedRequest(item)}
                  >
                    <div className="card-top">
                      <span className="move-type">
                        {item.request.type === "MOVE_IN"
                          ? "MOVE-IN"
                          : "MOVE-OUT"}
                      </span>

                      <StatusBadge status={item.request.status} />
                    </div>

                    <h3>{item.residentName}</h3>

                    <p>Unit {item.request.unitId}</p>

                    <p>
                      {item.request.details.moveDate ?? "Date pending"} ·{" "}
                      {item.request.details.slot ?? "Slot pending"}
                    </p>
                    <p>
                      {item.request.createdAt
                        ? new Date(item.request.createdAt).toLocaleString()
                        : "No date available"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="request-details">
            {!selectedRequest ? (
              <div className="details-placeholder">
                <FileText size={42} />
                <h2>Select a request</h2>
                <p>Choose a request from the list to review its details.</p>
              </div>
            ) : (
              <>
                <div className="details-header">
                  <div>
                    <span className="move-type">
                      {selectedRequest.request.type === "MOVE_IN"
                        ? "MOVE-IN REQUEST"
                        : "MOVE-OUT REQUEST"}
                    </span>

                    <h2>{selectedRequest.residentName}</h2>

                    <p>Request ID: {selectedRequest.request.id}</p>
                  </div>

                  <StatusBadge status={selectedRequest.request.status} />
                </div>

                <div className="workflow-timeline">
                  <div className="timeline-step completed">
                    <div className="timeline-dot">✓</div>
                    <span>Submitted</span>
                  </div>

                  <div className="timeline-line" />

                  <div
                    className={`timeline-step ${
                      [
                        "UNDER_REVIEW",
                        "APPROVED",
                        "REJECTED",
                        "NEEDS_INFORMATION",
                      ].includes(selectedRequest.request.status)
                        ? "completed"
                        : ""
                    }`}
                  >
                    <div className="timeline-dot">
                      {[
                        "UNDER_REVIEW",
                        "APPROVED",
                        "REJECTED",
                        "NEEDS_INFORMATION",
                      ].includes(selectedRequest.request.status)
                        ? "✓"
                        : "2"}
                    </div>

                    <span>Review</span>
                  </div>

                  <div className="timeline-line" />

                  <div
                    className={`timeline-step ${
                      ["APPROVED", "REJECTED"].includes(
                        selectedRequest.request.status,
                      )
                        ? "completed"
                        : ""
                    }`}
                  >
                    <div className="timeline-dot">
                      {["APPROVED", "REJECTED"].includes(
                        selectedRequest.request.status,
                      )
                        ? "✓"
                        : "3"}
                    </div>

                    <span>Decision</span>
                  </div>
                </div>

                <div className="info-section">
                  <h3>
                    <User size={18} />
                    Resident Context
                  </h3>

                  <div className="info-grid">
                    <div>
                      <span>Name</span>
                      <strong>{selectedRequest.residentName}</strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>{selectedRequest.residentEmail}</strong>
                    </div>

                    <div>
                      <span>Unit</span>
                      <strong>{selectedRequest.request.unitId}</strong>
                    </div>

                    <div>
                      <span>Community</span>
                      <strong>{selectedRequest.communityName}</strong>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>
                    <FileText size={18} />
                    Move Details
                  </h3>

                  <div className="info-grid">
                    <div>
                      <span>Move Date</span>
                      <strong>
                        {selectedRequest.request.details.moveDate ??
                          "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Time Slot</span>
                      <strong>
                        {selectedRequest.request.details.slot ?? "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Moving Company</span>
                      <strong>
                        {selectedRequest.request.details.movingCompany ??
                          "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Vehicle</span>
                      <strong>
                        {selectedRequest.request.details.vehicleNumber ??
                          "Not provided"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="ai-assessment">
                  <div className="admin-ai-card">
                    <div className="admin-ai-header">
                      <div className="admin-ai-icon">✦</div>

                      <div>
                        <span className="admin-eyebrow">AI ASSESSMENT</span>
                        <h3>Decision support</h3>
                        <p>
                          Context-aware recommendation based on request data and
                          community rules.
                        </p>
                      </div>
                    </div>

                    <div className="admin-ai-summary">
                      <p>{selectedRequest.summary}</p>
                    </div>

                    {selectedRequest.validation.issues.length === 0 ? (
                      <div className="admin-validation-success">
                        <span>✓</span>
                        <div>
                          <strong>All required information is valid</strong>
                          <p>
                            No blocking issues were detected against the
                            configured community rules.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="admin-validation-error">
                        <span>!</span>
                        <div>
                          <strong>Action required</strong>

                          {selectedRequest.validation.issues.map(
                            (issue, index) => (
                              <p key={index}>{issue}</p>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {selectedRequest.validation.warnings.length > 0 && (
                      <div className="admin-validation-warning">
                        <span>!</span>

                        <div>
                          <strong>Review recommended</strong>

                          {selectedRequest.validation.warnings.map(
                            (warning, index) => (
                              <p key={index}>{warning}</p>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <div className="admin-recommendation">
                      <div>
                        <span>Agent recommendation</span>

                        <strong
                          className={`recommendation-${selectedRequest.recommendation.toLowerCase()}`}
                        >
                          {selectedRequest.recommendation}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div className="action-bar">
                {selectedRequest.request.status === "SUBMITTED" && (
                  <button
                    className="secondary-button"
                    onClick={handleReview}
                    disabled={actionLoading}
                  >
                    Start Review
                  </button>
                )}

                {selectedRequest.request.status === "UNDER_REVIEW" && (
                  <>
                    <button
                      className="approve-button"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 size={17} />
                      Approve
                    </button>

                    <button
                      className="info-button"
                      onClick={handleNeedInformation}
                      disabled={actionLoading}
                    >
                      Request Information
                    </button>

                    <button
                      className="reject-button"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      <XCircle size={17} />
                      Reject
                    </button>
                  </>
                )}

                {selectedRequest.request.status === "APPROVED" && (
                  <div className="decision-message success">
                    <CheckCircle2 size={18} />
                    This request has been approved.
                  </div>
                )}

                {selectedRequest.request.status === "REJECTED" && (
                  <div className="decision-message rejected">
                    <XCircle size={18} />
                    This request has been rejected.
                  </div>
                )}

                {selectedRequest.request.status === "NEEDS_INFORMATION" && (
                  <div className="decision-message info">
                    <AlertCircle size={18} />
                    Additional information has been requested from the resident.
                  </div>
                )}
              </div> */}
                {selectedRequest.request.adminNote && (
                  <div className="admin-note-card">
                    <div className="admin-note-header">
                      <FileText size={16} />
                      <span>
                        {selectedRequest.request.status === "REJECTED"
                          ? "Rejection Reason"
                          : "Admin Note"}
                      </span>
                    </div>

                    <p>{selectedRequest.request.adminNote}</p>
                  </div>
                )}
                <div className="admin-actions">
                  {selectedRequest.request.status === "SUBMITTED" && (
                    <button
                      className="admin-button admin-button-secondary"
                      onClick={() => handleReview(selectedRequest.request.id)}
                      disabled={actionLoading}
                    >
                      Start review
                    </button>
                  )}

                  {selectedRequest.request.status === "UNDER_REVIEW" && (
                    <>
                      <button
                        className="admin-button admin-button-secondary"
                        onClick={() =>
                          handleNeedInformation(selectedRequest.request.id)
                        }
                        disabled={actionLoading}
                      >
                        Request information
                      </button>

                      <button
                        className="admin-button admin-button-danger"
                        onClick={() => handleReject(selectedRequest.request.id)}
                        disabled={actionLoading}
                      >
                        Reject
                      </button>

                      <button
                        className="admin-button admin-button-primary"
                        onClick={() =>
                          handleApprove(selectedRequest.request.id)
                        }
                        disabled={actionLoading}
                      >
                        Approve request
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
      {decisionModal && (
        <div
          className="decision-modal-overlay"
          onClick={() => {
            if (!actionLoading) {
              setDecisionModal(null);
              setDecisionNote("");
            }
          }}
        >
          <div
            className="decision-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="decision-modal-header">
              <div>
                <div className="admin-eyebrow">
                  {decisionModal.type === "REJECT"
                    ? "Reject request"
                    : "Request information"}
                </div>

                <h3>
                  {decisionModal.type === "REJECT"
                    ? "Why is this request being rejected?"
                    : "What information is required?"}
                </h3>
              </div>

              <button
                className="modal-close"
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setDecisionModal(null);
                  setDecisionNote("");
                }}
              >
                ×
              </button>
            </div>

            <p className="decision-modal-description">
              {decisionModal.type === "REJECT"
                ? "Provide a clear reason so the resident and community team understand the decision."
                : "Describe exactly what the resident needs to provide before the request can continue."}
            </p>

            <textarea
              className="decision-note-input"
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder={
                decisionModal.type === "REJECT"
                  ? "Example: The requested move date is outside the permitted community schedule."
                  : "Example: Please provide the updated vehicle number and confirm the inspection date."
              }
              rows={5}
              disabled={actionLoading}
              autoFocus
            />

            <div className="decision-modal-footer">
              <button
                type="button"
                className="admin-button secondary"
                disabled={actionLoading}
                onClick={() => {
                  setDecisionModal(null);
                  setDecisionNote("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  decisionModal.type === "REJECT"
                    ? "admin-button danger"
                    : "admin-button warning"
                }
                disabled={actionLoading || !decisionNote.trim()}
                onClick={handleDecisionSubmit}
              >
                {actionLoading
                  ? "Processing..."
                  : decisionModal.type === "REJECT"
                    ? "Reject request"
                    : "Request information"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
