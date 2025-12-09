import React, { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiUrl } from "../../config/api";
import logo from "../../assets/images/logo.png";
import "./Header.css";

const Header = memo(() => {
  const navigate = useNavigate();
  const { user: authUser, role } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Try to get user from /api/manage/users/me first (for admin/superadmin)
        let res = await fetch(apiUrl("/api/manage/users/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const json = await res.json();
          const user = json?.user || json?.data || json;
          if (user && (user.name || user.email)) {
            console.log("Header: Fetched user data from /api/manage/users/me:", user);
            setUserData(user);
            setLoading(false);
            return;
          }
        }

        // Fallback to /api/user/profile for regular users
        res = await fetch(apiUrl("/api/user/profile"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const json = await res.json();
          const user = json?.data || json?.user || json;
          if (user && (user.name || user.email)) {
            console.log("Header: Fetched user data from /api/user/profile:", user);
            setUserData(user);
            setLoading(false);
            return;
          }
        }

        // If authUser exists from context, use it
        if (authUser && (authUser.name || authUser.email)) {
          setUserData(authUser);
        }
      } catch (e) {
        console.error("Failed to fetch user data:", e);
        // Fallback to authUser from context if available
        if (authUser && (authUser.name || authUser.email)) {
          setUserData(authUser);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [authUser]);

  const initials = (str = "") => {
    const parts = str.trim().split(/\s+/);
    return (
      (parts[0]?.[0] || "").toUpperCase() +
      (parts[1]?.[0] || "").toUpperCase()
    );
  };

  const getUserName = () => {
    const fullName = userData?.name || userData?.fullName || userData?.email?.split("@")[0] || "User";
    // Extract only the first name
    const firstName = fullName.trim().split(/\s+/)[0] || fullName;
    return firstName;
  };

  const getUserRole = () => {
    // Get role from userData first, then from context
    const userRole = userData?.role || role || "user";
    
    console.log("Header - getUserRole:", { userRole, userDataRole: userData?.role, contextRole: role });
    
    if (userRole === "admin") return "Administrator";
    if (userRole === "superadmin") return "Super Administrator";
    if (userRole === "user") return "User";
    
    // Return the role as-is if it's something else, or default to User
    return userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "User";
  };

  const getProfilePath = () => {
    if (role === "admin") return "/admin/profile";
    if (role === "superadmin") return "/superadmin/profile";
    return "/profile";
  };

  const handleProfileClick = () => {
    const path = getProfilePath();
    navigate(path);
  };

  const handleAddClick = () => {
    if (role === "admin" || role === "superadmin") {
      // Admin can add devices/users based on context
      navigate("/add-device");
    } else {
      navigate("/add-device");
    }
  };

  const renderActions = (mobileLayout = false) => (
    <div className={`doze-header-actions ${mobileLayout ? "mobile" : ""}`}>
      <button
        className="doze-add-btn"
        onClick={handleAddClick}
      >
        + Add
      </button>
      <button className="doze-icon-btn" type="button">
        <Bell size={16} />
      </button>
      <button
        type="button"
        className="doze-user-profile"
        onClick={handleProfileClick}
      >
        {loading ? (
          <div className="doze-user-avatar-loading">...</div>
        ) : (
          <>
            <div className="doze-user-avatar">
              {initials(getUserName())}
            </div>
            <div className="doze-user-info">
              <div className="doze-user-name">{getUserName()}</div>
              <div className="doze-user-role">{getUserRole()}</div>
            </div>
          </>
        )}
      </button>
    </div>
  );

  const renderLogo = () => (
    <div className="doze-header-logo">
      <img src={logo} alt="Dozemate Logo" className="doze-logo-img" />
    </div>
  );

  return (
    <header className={`doze-header ${isMobile ? "is-mobile" : ""}`}>
      <div className={`doze-header-content ${isMobile ? "is-mobile" : ""}`}>
        {isMobile ? (
          <div className="doze-header-top-row">
            {renderLogo()}
            {renderActions(true)}
          </div>
        ) : (
          <>
            {renderLogo()}
            {renderActions()}
          </>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
