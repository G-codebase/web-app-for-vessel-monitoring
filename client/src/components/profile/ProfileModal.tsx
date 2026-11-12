import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Shield,
  Key,
  LogOut,
  X,
  Laptop,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Lock,
  Globe,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import * as api from "../../services/api";

export const ProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, logout } = useTelemetry();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ type: "SUCCESS" | "ERROR"; msg: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
      setPasswordStatus(null);
    }
  }, [isOpen]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.fetchUserSessionsApi();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeSessionApi(sessionId);
      await loadSessions();
    } catch (err: any) {
      alert(`Revoke failed: ${err.message}`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "ERROR", msg: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ type: "ERROR", msg: "Password must be at least 8 characters long." });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch(`${api.API_BASE}/api/v1/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api.getAuthToken()}`,
        },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(api.extractErrorMessage(data, "Failed to update password"));

      setPasswordStatus({ type: "SUCCESS", msg: "Password updated successfully!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordStatus({ type: "ERROR", msg: err.message || "Password update failed." });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayName = currentUser.username || currentUser.name || "OPERATOR";
  const initial = displayName.charAt(0).toUpperCase();
  const roleName = currentUser.role || (currentUser.roles && currentUser.roles[0]) || "OPERATOR";

  return createPortal(
    <div className="modal-backdrop animate-fadeIn" style={{ zIndex: 9999 }}>
      <div className="modal-content modal-lg profile-modal-container">
        {/* Header */}
        <div className="modal-header flex-between" style={{ alignItems: "center" }}>
          <div className="flex items-center gap-2.5">
            <div className="account-avatar-sm" style={{ width: "30px", height: "30px", fontSize: "13px" }}>
              {initial}
            </div>
            <div>
              <h3 className="modal-title leading-tight">Operator Profile & Security Sessions</h3>
              <p className="text-2xs text-muted mb-0">Identity access management & session credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body profile-modal-body">
          {/* Identity Summary Card */}
          <div className="profile-identity-card flex-between mb-4">
            <div className="flex items-center gap-3.5">
              <div className="account-avatar-lg" style={{ width: "48px", height: "48px", fontSize: "20px" }}>
                {initial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-white text-base font-bold font-mono tracking-wide mb-0">
                    {displayName.toUpperCase()}
                  </h4>
                  <span className="badge badge-critical text-2xs font-bold">
                    <Shield size={11} className="mr-0.5" />
                    {roleName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted mt-1">
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-cyan" />
                    <span>{currentUser.email || "tester.admin@sjvmarine.com"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock size={11} className="text-emerald" />
                    <span className="text-emerald">TLS 1.3 Active</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}
              title="Terminate active session and sign out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="grid grid-2 gap-4">
            {/* Column 1: Active Login Sessions */}
            <div className="panel profile-sub-panel">
              <div className="panel-header flex-between" style={{ alignItems: "center", padding: "10px 14px" }}>
                <div className="flex items-center gap-2">
                  <Laptop size={15} className="text-cyan" />
                  <span className="font-semibold text-white text-xs">Active Login Sessions</span>
                </div>
                <button
                  type="button"
                  onClick={loadSessions}
                  className="btn-icon btn-xs"
                  title="Refresh active sessions"
                >
                  <RefreshCw size={12} className={loadingSessions ? "spin text-cyan" : ""} />
                </button>
              </div>

              <div className="panel-body p-2.5 max-h-64 overflow-y-auto">
                {sessions.length > 0 ? (
                  sessions.map((s) => (
                    <div key={s.id} className="session-card-item flex-between p-2.5 mb-2 rounded border">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe size={13} className="text-cyan shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">
                            {s.userAgent?.includes("Mac") ? "macOS Browser Client" : s.userAgent?.includes("Windows") ? "Windows SCADA Station" : "Workstation Client"}
                          </span>
                          {s.isCurrent && (
                            <span className="badge badge-live text-2xs py-0.5 px-1.5 font-bold">CURRENT</span>
                          )}
                        </div>
                        <div className="text-2xs text-muted font-mono flex items-center gap-2">
                          <span>IP: {s.ipAddress}</span>
                          <span>•</span>
                          <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {!s.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.id)}
                          className="btn btn-secondary btn-xs text-danger hover:border-danger shrink-0"
                          title="Revoke session token"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted text-xs">
                    <CheckCircle2 size={24} className="text-emerald mx-auto mb-2 opacity-60" />
                    <span>Active session authenticated securely</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Update Access Password */}
            <div className="panel profile-sub-panel">
              <div className="panel-header flex items-center gap-2" style={{ padding: "10px 14px" }}>
                <Key size={15} className="text-cyan" />
                <span className="font-semibold text-white text-xs">Update Access Password</span>
              </div>

              <div className="panel-body p-3">
                {passwordStatus && (
                  <div
                    className={`alert-notice-box mb-3 text-xs flex items-center gap-2 p-2 rounded ${
                      passwordStatus.type === "SUCCESS" ? "border-cyan text-cyan" : "border-danger text-danger"
                    }`}
                    style={{ background: passwordStatus.type === "SUCCESS" ? "rgba(0, 240, 255, 0.08)" : "rgba(239, 68, 68, 0.08)" }}
                  >
                    {passwordStatus.type === "SUCCESS" ? (
                      <CheckCircle2 size={14} className="shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="shrink-0" />
                    )}
                    <span>{passwordStatus.msg}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <div className="form-group mb-2.5">
                    <label className="text-xs text-muted block mb-1">Current Password</label>
                    <input
                      type="password"
                      className="filter-input"
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-2.5">
                    <label className="text-xs text-muted block mb-1">New Password (min 8 chars)</label>
                    <input
                      type="password"
                      className="filter-input"
                      placeholder="Enter strong new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3.5">
                    <label className="text-xs text-muted block mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      className="filter-input"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn btn-primary btn-sm btn-block flex-center justify-center gap-2 w-full"
                  >
                    <Key size={13} />
                    <span>{passwordLoading ? "Updating Password..." : "Save New Password"}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer flex-end" style={{ padding: "10px 18px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
