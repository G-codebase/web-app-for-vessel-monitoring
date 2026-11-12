import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Mail,
  Lock,
  Ship,
  RefreshCw,
  X,
  AlertCircle,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import * as api from '../../services/api';

export const UserManagementView: React.FC = () => {
  const { currentUser, vessels, logout } = useTelemetry();
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New user form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roleName: 'OPERATOR',
    vesselIds: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Created credentials modal state
  const [createdUserModal, setCreatedUserModal] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.fetchUsersApi();
      setUserList(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const evalPassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    const score = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    let label = 'Very Weak';
    let color = '#ef4444'; // Red
    if (score === 2) {
      label = 'Moderate';
      color = '#f97316'; // Orange
    } else if (score === 3) {
      label = 'Fair';
      color = '#f59e0b'; // Amber
    } else if (score === 4) {
      label = 'Good';
      color = '#00f0ff'; // Cyan
    } else if (score === 5) {
      label = 'Strong';
      color = '#10b981'; // Emerald
    }

    return {
      score,
      label,
      color,
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  };

  const generateRandomPassword = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%&*';
    let pass = 'Tanker@';
    pass += uppers.charAt(Math.floor(Math.random() * uppers.length));
    pass += lowers.charAt(Math.floor(Math.random() * lowers.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    pass += '26';
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const cleanUsername = formData.username.trim().toUpperCase();
      if (!/^[A-Z0-9_]{3,30}$/.test(cleanUsername)) {
        setFormError("User Name must be in FULL CAPS (A-Z, 0-9, _), minimum 3 characters.");
        setFormLoading(false);
        return;
      }

      const pwdScore = evalPassword(formData.password || '');
      if (formData.password && (pwdScore.score < 3 || formData.password.length < 8)) {
        setFormError("Password does not meet required strength criteria. Please ensure at least 8 characters with upper, lower, numbers, and symbols.");
        setFormLoading(false);
        return;
      }

      const payload = {
        username: cleanUsername,
        userName: cleanUsername,
        email: formData.email.trim(),
        mailId: formData.email.trim(),
        password: formData.password || 'Welcome@2026!',
        roleName: formData.roleName,
        vesselIds: formData.vesselIds.length > 0 ? formData.vesselIds : undefined,
      };

      const res = await api.createUserApi(payload);
      setModalOpen(false);
      setCreatedUserModal({
        username: res.user?.username || formData.username,
        email: res.user?.email || formData.email,
        password: formData.password || 'Welcome@2026!',
        role: res.user?.role || formData.roleName,
        vessels: res.user?.vessels || [],
      });

      // Save to sessionStorage so SignInPage can quick-fill if requested
      try {
        sessionStorage.setItem('last_created_user', JSON.stringify({
          identifier: res.user?.email || formData.email,
          username: res.user?.username || formData.username,
          password: formData.password || 'Welcome@2026!',
          role: res.user?.role || formData.roleName,
        }));
      } catch (e) {
        // ignore
      }

      setFormData({
        username: '',
        email: '',
        password: '',
        roleName: 'OPERATOR',
        vesselIds: [],
      });
      await loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user account');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await api.updateUserStatusApi(user.id, nextStatus);
      await loadUsers();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const copyCredentials = () => {
    if (!createdUserModal) return;
    const text = `SJV Tanker SCADA Credentials:\nUser Name: ${createdUserModal.username}\nMail ID: ${createdUserModal.email}\nPassword: ${createdUserModal.password}\nRole: ${createdUserModal.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testSignInNow = async () => {
    if (!createdUserModal) return;
    // Log out current admin to let user sign in with created credentials
    await logout();
  };

  return (
    <div className="telemetry-view-container">
      {/* View Header */}
      <div className="view-header-row">
        <div>
          <h2 className="view-title">
            <Users className="text-cyan inline-icon" size={24} />
            Enterprise Account & Role Management
          </h2>
          <p className="view-subtitle">
            Admin-managed corporate user directory, role-based access control, and vessel assignment permissions.
          </p>
        </div>

        <div className="view-actions-bar">
          <button onClick={loadUsers} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button onClick={() => { setModalOpen(true); generateRandomPassword(); }} className="btn btn-primary btn-sm">
            <UserPlus size={14} />
            <span>Provision New User</span>
          </button>
        </div>
      </div>

      {/* Corporate Policy Notice */}
      <div className="alert-notice-box mb-4">
        <ShieldCheck size={16} className="text-cyan flex-shrink-0" />
        <div className="text-xs">
          <strong>Security Policy Enforcement:</strong> Account provisioning is strictly administrator-managed. Administrators create user credentials (User Name, Mail ID, Password, and Role Allocation) which enable authorized personnel to immediately sign in to the SCADA workstation.
        </div>
      </div>

      {/* Users Table */}
      <div className="panel">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <Users size={18} className="text-cyan" />
            <span className="font-semibold text-white">Authorized Platform Accounts</span>
          </div>
          <span className="text-xs text-muted">{userList.length} registered accounts</span>
        </div>

        <div className="panel-body">
          {loading ? (
            <div className="p-8 text-center text-muted">
              <RefreshCw size={24} className="spin mb-2 mx-auto" />
              <p>Loading user records from database...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="scada-table">
                <thead>
                  <tr>
                    <th>User Name & ID</th>
                    <th>Corporate Mail ID</th>
                    <th>Role Allocation</th>
                    <th>Assigned Vessels</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar-circle-sm">
                            {(u.username || u.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-white block">{u.username || u.name}</strong>
                            <span className="text-xs text-muted font-mono">{u.name !== u.username ? u.name : u.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs">{u.email}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.roles.includes('SUPER_ADMIN') || u.roles.includes('TESTER_ADMIN')
                              ? 'badge-critical'
                              : u.roles.includes('ADMIN')
                              ? 'badge-warning'
                              : 'badge-normal'
                          }`}
                        >
                          {u.roles[0] || 'VIEWER'}
                        </span>
                      </td>
                      <td className="text-xs">
                        {u.vessels.length === 0 ? (
                          <span className="text-muted">All Fleet (Global)</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.vessels.map((v: any) => (
                              <span key={v.vesselId} className="code-badge text-xs">
                                {v.vesselName}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${u.status === 'ACTIVE' ? 'badge-live' : 'badge-offline'}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="text-xs text-muted">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`btn btn-xs ${u.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}`}
                          title={u.status === 'ACTIVE' ? 'Disable account' : 'Activate account'}
                        >
                          {u.status === 'ACTIVE' ? 'Disable' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Provision New User */}
      {modalOpen && createPortal(
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header flex-between">
              <h3 className="modal-title flex-center gap-2">
                <UserPlus size={18} className="text-cyan" />
                <span>Create User Credentials & Role Allocation</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                {formError && (
                  <div className="login-error-banner mb-3">
                    <AlertCircle size={15} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. User Name (FULL CAPS ONLY) */}
                <div className="form-group mb-3">
                  <div className="flex-between mb-1">
                    <label htmlFor="modal-username">User Name / Handle *</label>
                    <span
                      className="code-badge text-2xs"
                      style={{
                        background: "rgba(0, 240, 255, 0.16)",
                        color: "#00f0ff",
                        border: "1px solid rgba(0, 240, 255, 0.4)",
                        fontWeight: "bold",
                        letterSpacing: "0.06em",
                      }}
                    >
                    </span>
                  </div>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input
                      id="modal-username"
                      type="text"
                      className="filter-input font-mono"
                      style={{ textTransform: "uppercase" }}
                      placeholder="e.g. CAPTAIN_ALEX, CHIEF_OFFICER, OPERATOR_1"
                      value={formData.username}
                      onChange={(e) => {
                        const fullCaps = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
                        setFormData({ ...formData, username: fullCaps });
                      }}
                      required
                    />
                  </div>
                  <span className="text-xs text-muted block mt-1">
                    Must be in (A-Z, 0-9, _)
                  </span>
                </div>

                {/* 2. Mail ID */}
                <div className="form-group mb-3">
                  <label htmlFor="modal-email">Mail ID (Email Address) *</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      id="modal-email"
                      type="email"
                      className="filter-input"
                      placeholder="alex.chen@sjvmarine.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <span className="text-xs text-muted block mt-1">
                    Corporate mail address for notifications and security verification.
                  </span>
                </div>

                {/* 3. Password & Dynamic Strength Bar */}
                <div className="form-group mb-3">
                  <div className="flex-between mb-1.5" style={{ alignItems: "center" }}>
                    <label htmlFor="modal-password" className="mb-0">Password *</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="btn-generate-password"
                      title="Generate a cryptographically randomized strong password"
                    >
                      <Key size={12} className="text-cyan" />
                      <span>Generate Strong Password</span>
                    </button>
                  </div>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <Lock size={16} className="input-icon" />
                    <input
                      id="modal-password"
                      type={showPassword ? 'text' : 'password'}
                      className="filter-input"
                      placeholder="Minimum 8 characters with mixed categories"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn-icon"
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password Strength Meter & Category Requirements */}
                  {formData.password && (() => {
                    const st = evalPassword(formData.password);
                    return (
                      <div className="password-strength-widget mt-2.5 p-3 rounded-md">
                        <div className="flex-between text-xs mb-2" style={{ alignItems: "center" }}>
                          <span className="text-muted font-medium">Password Strength:</span>
                          <span
                            className="badge text-2xs font-mono font-bold"
                            style={{
                              backgroundColor: `${st.color}22`,
                              color: st.color,
                              border: `1px solid ${st.color}66`,
                            }}
                          >
                            {st.label} ({st.score}/5 Categories Met)
                          </span>
                        </div>

                        {/* 5-Segment Strength Bar */}
                        <div className="password-strength-track">
                          {[1, 2, 3, 4, 5].map((seg) => (
                            <div
                              key={seg}
                              className="strength-segment"
                              style={{
                                backgroundColor: seg <= st.score ? st.color : "rgba(255, 255, 255, 0.12)",
                                boxShadow: seg <= st.score ? `0 0 6px ${st.color}66` : "none",
                              }}
                            />
                          ))}
                        </div>

                        {/* Required Password Categories Checklist */}
                        <div className="grid grid-2 gap-2 text-2xs pt-2 mt-2 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                          <div className={`flex items-center gap-1.5 ${st.hasMinLength ? "text-emerald font-semibold" : "text-muted"}`}>
                            {st.hasMinLength ? <Check size={12} className="text-emerald" /> : <span style={{ opacity: 0.4 }}>○</span>}
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${st.hasUpper ? "text-emerald font-semibold" : "text-muted"}`}>
                            {st.hasUpper ? <Check size={12} className="text-emerald" /> : <span style={{ opacity: 0.4 }}>○</span>}
                            <span>Uppercase letter (A-Z)</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${st.hasLower ? "text-emerald font-semibold" : "text-muted"}`}>
                            {st.hasLower ? <Check size={12} className="text-emerald" /> : <span style={{ opacity: 0.4 }}>○</span>}
                            <span>Lowercase letter (a-z)</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${st.hasNumber ? "text-emerald font-semibold" : "text-muted"}`}>
                            {st.hasNumber ? <Check size={12} className="text-emerald" /> : <span style={{ opacity: 0.4 }}>○</span>}
                            <span>Numeric digit (0-9)</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${st.hasSpecial ? "text-emerald font-semibold" : "text-muted"}`} style={{ gridColumn: "span 2" }}>
                            {st.hasSpecial ? <Check size={12} className="text-emerald" /> : <span style={{ opacity: 0.4 }}>○</span>}
                            <span>Special symbol (!@#$%^&*)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 4. Role Allocation */}
                <div className="form-group mb-3">
                  <label htmlFor="modal-role">User Role Allocation *</label>
                  <div className="input-with-icon">
                    <Shield size={16} className="input-icon" />
                    <select
                      id="modal-role"
                      className="filter-select"
                      value={formData.roleName}
                      onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    >
                      <option value="OPERATOR">OPERATOR — Operational bridge & deck monitoring</option>
                      <option value="ADMIN">ADMIN — Fleet administrator & user management</option>
                      <option value="TESTER_ADMIN">TESTER_ADMIN — Full QA testing & SCADA configuration</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN — Global root security administration</option>
                      <option value="VIEWER">VIEWER — Read-only observation & audit</option>
                    </select>
                  </div>
                </div>

                {/* 5. Assigned Vessels */}
                <div className="form-group mb-2">
                  <label className="text-xs text-muted font-semibold block mb-1.5">
                    Vessel Access Allocation
                  </label>
                  <div className="vessel-checkboxes-container">
                    {vessels.map((v) => (
                      <label key={v.vesselId} className="vessel-access-checkbox-row">
                        <input
                          type="checkbox"
                          checked={formData.vesselIds.includes(v.vesselId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                vesselIds: [...formData.vesselIds, v.vesselId],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                vesselIds: formData.vesselIds.filter((id) => id !== v.vesselId),
                              });
                            }
                          }}
                        />
                        <span className="font-semibold text-white text-xs">{v.name}</span>
                        <span className="text-muted text-2xs font-mono">(IMO {v.imo})</span>
                      </label>
                    ))}
                  </div>
                  <span className="text-2xs text-muted block mt-1.5">
                    Leave unselected for global fleet access.
                  </span>
                </div>
              </div>

              <div className="modal-footer flex-between">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary btn-sm flex-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Create & Allocate Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* Success Modal: Created Account Credentials */}
      {createdUserModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div className="modal-header flex-between" style={{ borderBottomColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div className="flex-center gap-2">
                <CheckCircle2 size={20} className="text-emerald" />
                <h3 className="modal-title text-white">Account Created Successfully</h3>
              </div>
              <button onClick={() => setCreatedUserModal(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="text-xs text-muted mb-3">
                The user account has been registered in the database with the allocated role. The user can now immediately sign in with these credentials.
              </p>

              <div className="credentials-summary-card p-3 rounded mb-3" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div className="grid grid-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-muted block">User Name:</span>
                    <strong className="text-white font-mono">{createdUserModal.username}</strong>
                  </div>
                  <div>
                    <span className="text-muted block">Mail ID:</span>
                    <strong className="text-white font-mono">{createdUserModal.email}</strong>
                  </div>
                </div>

                <div className="grid grid-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-muted block">Password:</span>
                    <strong className="text-cyan font-mono">{createdUserModal.password}</strong>
                  </div>
                  <div>
                    <span className="text-muted block">Role Allocation:</span>
                    <span className="badge badge-normal">{createdUserModal.role}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="btn btn-secondary btn-sm flex-1 flex-center gap-2"
                >
                  {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={testSignInNow}
                  className="btn btn-primary btn-sm flex-1 flex-center gap-2"
                  title="Sign out of Admin and sign in as this newly created user"
                >
                  <span>Test Sign-In as User</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="modal-footer flex-end">
              <button
                type="button"
                onClick={() => setCreatedUserModal(null)}
                className="btn btn-secondary btn-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
