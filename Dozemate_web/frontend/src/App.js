import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { createContext, useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddDevice from "./pages/AddDevice";
import MyDevices from "./pages/MyDevices";
import UserProfile from "./pages/UserProfile";
import Support from "./pages/Support";
import AboutUs from "./pages/ContactUs";
import History from "./pages/History";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AdminManagement from "./pages/superadmin/AdminManagement";
import Organizations from "./pages/superadmin/Organizations";
import AdminProfile from "./pages/admin/AdminProfile";
import UserManagement from "./pages/superadmin/UserManagement";
import Devices from "./pages/superadmin/Devices";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminDeviceManagement from "./pages/admin/AdminDeviceManagement";
import AdminHistory from "./pages/admin/AdminHistory";
import DownloadReport from "./pages/admin/DownloadReport";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from './pages/ForgotPassword';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import GraphSettings from "./pages/superadmin/GraphSettings";  // ⬅ add this
import OAuthCallback from './pages/OAuthCallback';
import LandingPage from "./pages/LandingPage";

// Split contexts to prevent unnecessary re-renders
const ThemeContext = createContext();
const SidebarContext = createContext();

// Keep MyContext for backward compatibility (only themeMode)
const MyContext = createContext();

// Memoized Routes component to prevent re-renders
const AppRoutes = memo(() => {
    const { isAuthenticated, role } = useAuth();
    const routerLocation = useLocation();

    const ProtectedRoute = ({ children }) => {
        const { isAuthenticated, authChecked } = useAuth();
        const location = useLocation();

        if (!authChecked) {
            return (
                <div className="auth-loading-container">
                    <div className="auth-loading-spinner"></div>
                </div>
            );
        }

        if (!isAuthenticated) {
            if (location.pathname !== "/login" && location.pathname !== "/signup") {
                return <Navigate to="/login" replace />;
            }
        }
        return children;
    };

    return (
        <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/oauth/success" element={<OAuthCallback />} />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/add-device" element={<ProtectedRoute><AddDevice /></ProtectedRoute>} />
                        <Route path="my-devices" element={<ProtectedRoute><MyDevices /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                        <Route path="/about" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
                        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        <Route path="/graph-settings" element={<ProtectedRoute><GraphSettings /></ProtectedRoute>} />


                        {/* Admin Routes */}
                        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
                        <Route path="/admin/devices" element={<ProtectedRoute><AdminDeviceManagement /></ProtectedRoute>} />
                        <Route path="/admin/history" element={<ProtectedRoute><AdminHistory /></ProtectedRoute>} />
                        <Route path="/admin/report" element={<ProtectedRoute><DownloadReport /></ProtectedRoute>} />

                        {/* Super Admin Routes */}
                        <Route path="/superadmin/dashboard" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
                        <Route path="/superadmin/admins" element={<ProtectedRoute><AdminManagement /></ProtectedRoute>} />
                        <Route path="/superadmin/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
                        <Route path="/superadmin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
                        <Route path="/superadmin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                        <Route path="/superadmin/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
                        <Route
                            path="/superadmin/graph-settings"
                            element={role === "superadmin" ? <GraphSettings /> : <Navigate to="/dashboard" />}
                        />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* Redirect unknown routes to Dashboard if logged in, else to landing page */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} />
        </Routes>
    );
});

AppRoutes.displayName = 'AppRoutes';

// Layout component that handles sidebar state - isolated to prevent Routes re-renders
const AppLayout = memo(({ sidebarOpen, onSidebarToggle, isHideSidebarAndHeader }) => {
    const mainContentRef = useRef(null);
    
    // Update main content margin via ref to avoid Routes re-renders
    useEffect(() => {
        if (mainContentRef.current) {
            const marginLeft = isHideSidebarAndHeader ? 0 : (sidebarOpen ? 240 : 70);
            mainContentRef.current.style.marginLeft = `${marginLeft}px`;
            mainContentRef.current.className = `app-main-content ${
                isHideSidebarAndHeader 
                    ? "no-chrome" 
                    : sidebarOpen 
                        ? "sidebar-open" 
                        : "sidebar-collapsed"
            }`;
        }
    }, [sidebarOpen, isHideSidebarAndHeader]);

    return (
        <div className="app-layout">
            {!isHideSidebarAndHeader && <Sidebar isOpen={sidebarOpen} onToggle={onSidebarToggle} />}
            <div ref={mainContentRef} className="app-main-content">
                {!isHideSidebarAndHeader && <Header />}
                <div className="app-content-wrapper">
                    <AppRoutes />
                </div>
            </div>
        </div>
    );
});

AppLayout.displayName = 'AppLayout';

// New component to contain the main application logic
const AppContent = () => {
    const { token, isAuthenticated, role } = useAuth();
    const routerLocation = useLocation();
    const navigate = useNavigate();
    const [themeMode, setThemeMode] = useState(localStorage.getItem("themeMode") || "light");
    const [openUnauthorizedPopup, setOpenUnauthorizedPopup] = useState(false);

    const isHideSidebarAndHeader = routerLocation.pathname === "/login" || routerLocation.pathname === "/signup" || routerLocation.pathname === "/";

    useEffect(() => {
        if (themeMode === "light") {
            document.body.classList.remove("dark");
            document.body.classList.add("light");
        } else {
            document.body.classList.remove("light");
            document.body.classList.add("dark");
        }
    }, [themeMode]);

    const handleClosePopup = () => {
        setOpenUnauthorizedPopup(false);
    };

    const handleLoginRedirect = () => {
        setOpenUnauthorizedPopup(false);
        navigate("/login");
    };

    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Memoize context values separately to prevent unnecessary re-renders
    const themeValue = useMemo(() => ({
        themeMode,
        setThemeMode,
    }), [themeMode]);

    const sidebarValue = useMemo(() => ({
        sidebarOpen,
        setSidebarOpen,
    }), [sidebarOpen]);

    // Backward compatibility: MyContext only provides themeMode
    const myContextValue = useMemo(() => ({
        themeMode,
        setThemeMode,
    }), [themeMode]);

    // Memoize toggle handler to prevent function recreation
    const handleSidebarToggle = useCallback((newValue) => {
        if (typeof newValue === 'boolean') {
            setSidebarOpen(newValue);
        } else {
            setSidebarOpen(prev => !prev);
        }
    }, []);

    return (
        <ThemeContext.Provider value={themeValue}>
            <SidebarContext.Provider value={sidebarValue}>
                <MyContext.Provider value={myContextValue}>
                    <AppLayout 
                        sidebarOpen={sidebarOpen} 
                        onSidebarToggle={handleSidebarToggle}
                        isHideSidebarAndHeader={isHideSidebarAndHeader}
                    />

                    {/* Unauthorized Access Popup */}
                    <Dialog open={
                        openUnauthorizedPopup &&
                        !['/login', '/signup'].includes(routerLocation.pathname) &&
                        !routerLocation.state?.loggedOut
                    }
                        onClose={handleClosePopup} >
                        <DialogTitle>Unauthorized Access</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                You are not logged in. Please log in to access this page.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClosePopup} color="primary">Cancel</Button>
                            <Button onClick={handleLoginRedirect} color="primary" variant="contained">Login</Button>
                        </DialogActions>
                    </Dialog>
                </MyContext.Provider>
            </SidebarContext.Provider>
        </ThemeContext.Provider>
    );
}

// The main App component now wraps everything with AuthProvider
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
export { MyContext, ThemeContext, SidebarContext };