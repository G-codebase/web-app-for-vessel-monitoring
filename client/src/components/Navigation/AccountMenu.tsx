import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Shield,
  FileSpreadsheet,
  Users,
  LogOut,
  ChevronDown,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import { ProfileModal } from "../profile/ProfileModal";

interface AccountMenuProps {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onNavigateToHistory?: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  onNavigateToUsers,
  onNavigateToAudit,
  onNavigateToHistory,
}) => {
  const { currentUser, logout } = useTelemetry();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const rawUsername = currentUser.username || currentUser.name || "TESTER_ADMIN";
  const displayUsername = rawUsername.toUpperCase();
  const initial = displayUsername.charAt(0);
  const userRole = (currentUser.role || (currentUser.roles && currentUser.roles[0]) || "OPERATOR").toUpperCase();
  const isSuperOrAdmin =
    currentUser.isSuperOrAdmin ||
    (currentUser.roles &&
      currentUser.roles.some((r) =>
        ["SUPER_ADMIN", "ADMIN", "TESTER_ADMIN"].includes(r)
      ));

  return (
    <>
      <div className="account-menu-wrapper" ref={menuRef}>
        {/* Top-Right Account Trigger Pill */}
        <button
          id="btn-topbar-account"
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`account-trigger-btn flex-center gap-2 ${
            dropdownOpen ? "active" : ""
          }`}
          title="Account Management & Active Session Profile"
        >
          {/* Avatar with status indicator */}
          <div className="avatar-status-container">
            <div className="account-avatar-sm">{initial}</div>
            <span className="account-status-dot online" title="SCADA Session Active" />
          </div>

          {/* User Details */}
          <div className="text-left hidden-mobile">
            <div className="account-name-label font-mono font-bold leading-tight">
              {displayUsername}
            </div>
            <div className="account-role-tag uppercase">
              {userRole}
            </div>
          </div>

          <ChevronDown
            size={13}
            className={`text-muted transition-transform duration-200 ${
              dropdownOpen ? "rotate-180 text-cyan" : ""
            }`}
          />
        </button>

        {/* Dropdown Popover */}
        {dropdownOpen && (
          <div className="account-dropdown-panel animate-fadeIn">
            {/* Header Identity Card */}
            <div className="account-dropdown-header">
              <div className="flex items-center gap-3">
                <div className="account-avatar-lg">{initial}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white font-mono truncate">
                    {displayUsername}
                  </div>
                  <div className="text-xs text-muted truncate">
                    {currentUser.email || "tester.admin@sjvmarine.com"}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`badge text-2xs ${
                        isSuperOrAdmin ? "badge-critical" : "badge-normal"
                      }`}
                    >
                      {userRole}
                    </span>
                    <span className="text-2xs text-muted flex items-center gap-1">
                      <Lock size={10} className="text-emerald" />
                      <span>TLS 1.3 Active</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="account-dropdown-body">
              <button
                type="button"
                className="account-menu-item"
                onClick={() => {
                  setDropdownOpen(false);
                  setProfileModalOpen(true);
                }}
              >
                <div className="account-item-icon">
                  <User size={14} className="text-cyan" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-xs font-semibold text-white">
                    Profile &amp; Credentials
                  </div>
                  <div className="text-2xs text-muted">
                    Session details &amp; password change
                  </div>
                </div>
              </button>

              {isSuperOrAdmin && onNavigateToUsers && (
                <button
                  type="button"
                  className="account-menu-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigateToUsers();
                  }}
                >
                  <div className="account-item-icon">
                    <Users size={14} className="text-cyan" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-xs font-semibold text-white">
                      User Management &amp; Roles
                    </div>
                    <div className="text-2xs text-muted">
                      Provision accounts &amp; allocate RBAC
                    </div>
                  </div>
                </button>
              )}

              {onNavigateToAudit && (
                <button
                  type="button"
                  className="account-menu-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigateToAudit();
                  }}
                >
                  <div className="account-item-icon">
                    <Shield size={14} className="text-cyan" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-xs font-semibold text-white">
                      Immutable Audit Trail
                    </div>
                    <div className="text-2xs text-muted">
                      Security records &amp; operational logs
                    </div>
                  </div>
                </button>
              )}

              {onNavigateToHistory && (
                <button
                  type="button"
                  className="account-menu-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigateToHistory();
                  }}
                >
                  <div className="account-item-icon">
                    <FileSpreadsheet size={14} className="text-cyan" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-xs font-semibold text-white">
                      Export CSV Telemetry
                    </div>
                    <div className="text-2xs text-muted">
                      Historical parameter archives
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Footer / Logout */}
            <div className="account-dropdown-footer">
              <button
                id="btn-account-logout"
                type="button"
                className="account-logout-btn flex-center gap-2 w-full"
                onClick={async () => {
                  setDropdownOpen(false);
                  await logout();
                }}
              >
                <LogOut size={13} />
                <span>Sign Out of SCADA Station</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile & Session Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
};
