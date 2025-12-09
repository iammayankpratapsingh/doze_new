import { useState, useEffect, useCallback } from "react";
import { Home, History, Cpu, PlusCircle, User, Settings2, HelpCircle, Info, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Tooltip } from "@mui/material";
import "./Sidebar.css";

function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // On mobile, always keep sidebar collapsed (non-expandable)
      if (mobile && isOpen) {
        onToggle?.(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isOpen, onToggle]);


  const handleToggle = useCallback(() => {
    // Prevent toggle on mobile
    if (isMobile) return;
    if (onToggle) {
      onToggle(!isOpen);
    }
  }, [isMobile, onToggle, isOpen]);

  // On mobile, always use collapsed state
  const effectiveIsOpen = isMobile ? false : isOpen;

  const iconSize = isMobile ? 18 : 22;
  
  const menuItems = [
    { name: "Dashboard", icon: <Home size={iconSize} />, path: "/dashboard" },
    { name: "History", icon: <History size={iconSize} />, path: "/history" },
    { name: "Devices", icon: <Cpu size={iconSize} />, path: "/my-devices" },
    { name: "Add Devices", icon: <PlusCircle size={iconSize} />, path: "/add-device" },
    { name: "Profile", icon: <User size={iconSize} />, path: "/profile" },
    { name: "Graph Settings", icon: <Settings2 size={iconSize} />, path: "/graph-settings" },
    { name: "Support", icon: <HelpCircle size={iconSize} />, path: "/support" },
    { name: "About Us", icon: <Info size={iconSize} />, path: "/about" },
  ];

  const logoutItem = { name: "Logout", icon: <LogOut size={iconSize} />, path: "/logout", isLogout: true };

  const handleItemClick = useCallback((item) => {
    if (item.isLogout) {
      logout();
      navigate("/login");
    } else {
      navigate(item.path);
    }
  }, [logout, navigate]);

  // Use CSS classes only - no inline styles to prevent re-renders
  const sidebarClass = isMobile 
    ? "sidebar-container is-mobile" 
    : effectiveIsOpen 
      ? "sidebar-container sidebar-open" 
      : "sidebar-container sidebar-collapsed";

  return (
    <div className={sidebarClass}>
      <div className="sidebar-header">
        {!isMobile && (
          <div
            className="sidebar-toggle"
            onClick={handleToggle}
          >
            <div className="sidebar-toggle-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9m-9 6h9m-9 6h9M4.5 6h.008v.008H4.5V6zm0 6h.008v.008H4.5V12zm0 6h.008v.008H4.5V18z" />
              </svg>
            </div>
            <span
              className={`sidebar-title ${effectiveIsOpen ? "visible" : "hidden"}`}
            >Menu</span>
          </div>
        )}
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const menuItemContent = (
            <div
              key={index}
              className={`sidebar-menu-item ${isActive ? "active" : ""}`}
              onClick={() => handleItemClick(item)}
            >
              <div className="sidebar-menu-icon">{item.icon}</div>
              <span
                className={`sidebar-menu-text ${effectiveIsOpen ? "visible" : "hidden"}`}
              >{item.name}</span>
            </div>
          );

          // Show tooltip only when sidebar is collapsed and not on mobile
          if (!effectiveIsOpen && !isMobile) {
            return (
              <Tooltip
                key={index}
                title={item.name}
                placement="right"
                arrow
                enterDelay={300}
                leaveDelay={0}
              >
                {menuItemContent}
              </Tooltip>
            );
          }

          return menuItemContent;
        })}
      </div>

      <div className="sidebar-footer">
        {!effectiveIsOpen && !isMobile ? (
          <Tooltip
            title={logoutItem.name}
            placement="right"
            arrow
            enterDelay={300}
            leaveDelay={0}
          >
            <div
              className="sidebar-logout-item"
              onClick={() => handleItemClick(logoutItem)}
            >
              <div className="sidebar-menu-icon">{logoutItem.icon}</div>
              <span
                className={`sidebar-menu-text ${effectiveIsOpen ? "visible" : "hidden"}`}
              >{logoutItem.name}</span>
            </div>
          </Tooltip>
        ) : (
          <div
            className="sidebar-logout-item"
            onClick={() => handleItemClick(logoutItem)}
          >
            <div className="sidebar-menu-icon">{logoutItem.icon}</div>
            <span
              className={`sidebar-menu-text ${effectiveIsOpen ? "visible" : "hidden"}`}
            >{logoutItem.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;

