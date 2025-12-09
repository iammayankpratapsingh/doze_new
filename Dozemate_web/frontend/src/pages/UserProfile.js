import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OutlinedInput } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Box,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';

import {
  Edit,
  Save,
  Delete,
  UploadFile,
  Person,
  Warning,
  MonitorWeight,
  Height,
  Straighten,
  Cake,
  Wc
} from '@mui/icons-material';

import './UserProfile.css';
const API_BASE = "/api";
const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(true);
  const [formData, setFormData] = useState({});
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const { setUser, bumpAvatarVersion } = useAuth();
  const inFlight = useRef(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const dobValue = formData.dateOfBirth
    ? (typeof formData.dateOfBirth === 'string'
      ? formData.dateOfBirth.slice(0, 10)
      : new Date(formData.dateOfBirth).toISOString().slice(0, 10))
    : '';

  const imgSrc = previewImage || (profile?.profileImage
    ? (profile.profileImage.startsWith('http')
      ? profile.profileImage
      : `https://admin.dozemate.com${profile.profileImage}`)
    : undefined);

  const fetchUserProfile = useCallback(async () => {
    if (inFlight.current) return;        // guard against double-call (StrictMode etc.)
    inFlight.current = true;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.data);
        setFormData({
          name: data.data.name,
          email: data.data.email,
          address: data.data.address,
          pincode: data.data.pincode,
          mobile: data.data.mobile,
          //bio: data.data.bio || "",
          dateOfBirth: data.data.dateOfBirth || null,
          gender: data.data.gender || "",
          waist: data.data.waist || "",
          weight: data.data.weight || "",
          height: data.data.height || ""
        });
        // IMPORTANT: don't call setUser here — it can remount the tree and retrigger the effect
      } else {
        setError(data.message || "Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      dateOfBirth: date
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ text: 'Please upload an image file (jpg, png, webp).', type: 'error' });
      setImage(null); setPreviewImage(null);
      return;
    }
    if (file.size > 1024 * 1024) { // 1MB
      setMessage({ text: 'Image must be 1MB or smaller.', type: 'error' });
      setImage(null); setPreviewImage(null);
      return;
    }
    setMessage({ text: '', type: 'info' });
    setImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };


  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // data:<mime>;base64,....
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadImage = async () => {
    if (!image) return;
    const token = localStorage.getItem("token");

    const logAttempt = async (res) => {
      const type = res.headers.get("content-type") || "";
      const body = type.includes("application/json")
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");
      console.log("UPLOAD →", res.url, res.status, res.statusText, body);
      return body;
    };

    // 1) Try common dedicated endpoints with FormData
    const endpoints = [
      "/user/profile/image",
      "/user/profile/avatar",
      "/user/profile/photo",
      "/user/avatar",
      "/user/photo",
      "/user/picture",
    ];
    const verbs = ["POST", "PUT", "PATCH"];
    const fieldNames = ["profileImage", "image", "avatar", "photo", "file"];

    for (const ep of endpoints) {
      for (const method of verbs) {
        for (const field of fieldNames) {
          const fd = new FormData();
          fd.append(field, image);
          try {
            const res = await fetch(`${API_BASE}${ep}`, {
              method,
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });
            const resBody = await logAttempt(res);
            if (res.ok) {
              setMessage({ text: "Profile image updated successfully", type: "success" });
              setImage(null); setPreviewImage(null);

              // If API returned the updated user, merge it; otherwise just bump version
              if (resBody && typeof resBody === "object" && resBody.data) {
                setUser?.(prev => ({ ...prev, ...resBody.data, avatarVersion: Date.now() }));
              } else {
                bumpAvatarVersion?.();
              }

              await fetchUserProfile();
              return;
            }
            if (res.status === 404) break; // try next endpoint
          } catch (e) {
            console.warn("Attempt failed:", method, ep, field, e);
          }
        }
      }
    }

    // 2) Fallback: send base64 JSON to /user/profile
    try {
      const dataUrl = await fileToBase64(image);
      const payloadCandidates = [
        { profileImage: dataUrl },
        { image: dataUrl },
        { avatar: dataUrl },
        { photo: dataUrl },
        { picture: dataUrl },
        { profileImageBase64: dataUrl },
      ];
      for (const payload of payloadCandidates) {
        const res = await fetch(`${API_BASE}/user/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const resBody = await logAttempt(res);
        if (res.ok) {
          setMessage({ text: "Profile image updated successfully", type: "success" });
          setImage(null); setPreviewImage(null);

          if (resBody && typeof resBody === "object" && resBody.data) {
            setUser?.(prev => ({ ...prev, ...resBody.data, avatarVersion: Date.now() }));
          } else {
            bumpAvatarVersion?.();
          }

          await fetchUserProfile();
          return;
        }
        if (res.status === 404) break;
      }
    } catch (e) {
      console.error("Base64 fallback failed:", e);
    }

    setMessage({
      text: "Upload failed (route not found or payload rejected). Check API docs for the correct endpoint/field.",
      type: "error",
    });
  };


  // helpers
  const safeTrim = (v) =>
    v === undefined || v === null ? undefined : String(v).trim();

  const numOrUndef = (v) =>
    v === '' || v === undefined || v === null ? undefined : Number(v);

  const saveProfile = async () => {
    const token = localStorage.getItem("token");

    // normalize payload safely
    const payload = {
      name: safeTrim(formData.name),
      email: safeTrim(formData.email),
      mobile: safeTrim(formData.mobile),        // <— no .trim() on a number
      address: safeTrim(formData.address),
      pincode: safeTrim(formData.pincode),
      dateOfBirth:
        formData.dateOfBirth && formData.dateOfBirth !== ''
          ? (typeof formData.dateOfBirth === 'string'
            ? formData.dateOfBirth.slice(0, 10)
            : new Date(formData.dateOfBirth).toISOString().slice(0, 10))
          : null,                                // send null to clear, or remove if you prefer
      gender: formData.gender ?? null,
      weight: numOrUndef(formData.weight),
      height: numOrUndef(formData.height),
      waist: numOrUndef(formData.waist),
    };

    // remove only undefined keys (keep nulls if you want to clear fields server-side)
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    try {
      const res = await fetch(`/api/user/profile`, {
        method: "PUT",                            // use PUT (not POST)
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const type = res.headers.get("content-type") || "";
      const body = type.includes("application/json")
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");

      if (res.ok) {
        setMessage({ text: "Profile updated successfully", type: "success" });
        setEditMode(false);
        await fetchUserProfile();
      } else {
        const msg =
          (typeof body === "object" && (body.message || body.error)) ||
          (typeof body === "string" && body) ||
          `HTTP ${res.status}`;
        console.log("SAVE →", res.status, res.statusText, body);
        setMessage({ text: `Failed to save profile: ${msg}`, type: "error" });
      }
    } catch (e) {
      console.error(e);
      setMessage({ text: "Failed to save profile (network error)", type: "error" });
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });


      if (response.ok) {
        // Clear localStorage and redirect to login page
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        const data = await response.json();
        setMessage({ text: data.message || "Failed to delete account", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setMessage({ text: "Failed to delete account", type: "error" });
    }
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <Box className="profile-loading">
        <CircularProgress className="loading-spinner" />
        <Typography variant="body1">Loading your profile...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" className="profile-container">
        <Alert severity="error" className="profile-alert">{error}</Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" className="profile-container">
        <Alert severity="error" className="profile-alert">Profile not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="profile-container">
      {/* Page Header */}
      <Box className="profile-page-header">
        <Box>
          <Typography variant="h4" component="h1" className="profile-page-title">
            Profile Settings
          </Typography>
          <Typography variant="body1" className="profile-page-subtitle">
            Manage your account information and preferences
          </Typography>
        </Box>
        {!editMode ? (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => setEditMode(true)}
            className="profile-edit-btn"
          >
            Edit Profile
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={saveProfile}
            className="profile-save-btn"
          >
            Save Changes
          </Button>
        )}
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          className="profile-alert"
          onClose={() => setMessage({ text: '', type: 'info' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Profile Hero Banner */}
      <Paper elevation={0} className="profile-hero-banner">
        <Box className="profile-banner-background" />
        <Box className="profile-hero-content">
          <Box className="profile-avatar-section">
            <Box className="profile-avatar-container">
              <Avatar src={imgSrc} alt={profile.name} className="profile-main-avatar" />
              {editMode && (
                <>
                  <input
                    type="file"
                    id="profile-image-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <label htmlFor="profile-image-input" className="profile-avatar-edit-btn">
                    <UploadFile fontSize="small" />
                  </label>
                </>
              )}
            </Box>
            {editMode && image && (
              <Box className="profile-upload-actions">
                <label htmlFor="profile-image-input">
                  <Button
                    variant="outlined"
                    component="span"
                    size="small"
                    startIcon={<UploadFile />}
                    className="profile-change-photo-btn"
                  >
                    Change Photo
                  </Button>
                </label>
                <Button
                  variant="contained"
                  size="small"
                  onClick={uploadImage}
                  className="profile-upload-btn"
                >
                  Upload
                </Button>
              </Box>
            )}
          </Box>
          
          <Box className="profile-hero-info">
            <Typography variant="h4" className="profile-display-name">
              {profile.name || "User"}
            </Typography>
            <Typography variant="body1" className="profile-display-email">
              {profile.email}
            </Typography>
            <Box className="profile-meta-info">
              <Chip
                label={profile.role || "User"}
                className="profile-role-badge"
                size="small"
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={3} className="profile-content-grid">
        {/* Personal Information Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} className="profile-section-paper">
            <Box className="profile-section-title-box">
              <Box className="profile-section-icon-wrapper">
                <Person className="profile-section-icon" />
              </Box>
              <Box>
                <Typography variant="h6" className="profile-section-title">
                  Personal Information
                </Typography>
                <Typography variant="body2" className="profile-section-description">
                  Your contact details and basic information
                </Typography>
              </Box>
            </Box>
            <Divider className="profile-section-divider" />
            <Box className="profile-form-container">
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    name="mobile"
                    value={formData.mobile || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={dobValue}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                    inputProps={{ max: todayStr }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Cake fontSize="small" /></InputAdornment> }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={!editMode} className="profile-select-field">
                    <InputLabel id="gender-select-label">Gender</InputLabel>
                    <Select
                      labelId="gender-select-label"
                      id="gender-select"
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleChange}
                      label="Gender"
                      input={
                        <OutlinedInput
                          startAdornment={
                            <InputAdornment position="start">
                              <Wc fontSize="small" />
                            </InputAdornment>
                          }
                        />
                      }
                    >
                      <MenuItem value=""><em>Select</em></MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                      <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    name="pincode"
                    value={formData.pincode || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                    multiline
                    minRows={1}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Health Information Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} className="profile-section-paper">
            <Box className="profile-section-title-box">
              <Box className="profile-section-icon-wrapper health">
                <MonitorWeight className="profile-section-icon" />
              </Box>
              <Box>
                <Typography variant="h6" className="profile-section-title">
                  Health Metrics
                </Typography>
                <Typography variant="body2" className="profile-section-description">
                  Track your physical measurements
                </Typography>
              </Box>
            </Box>
            <Divider className="profile-section-divider" />
            <Box className="profile-form-container">
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Weight (kg)"
                    name="weight"
                    type="number"
                    value={formData.weight || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                    inputProps={{ min: 5, step: "0.1" }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><MonitorWeight fontSize="small" /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Height (cm)"
                    name="height"
                    type="number"
                    value={formData.height || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                    inputProps={{ min: 25.4, step: "0.1" }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Height fontSize="small" /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Waist (cm)"
                    name="waist"
                    type="number"
                    value={formData.waist || ''}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="profile-text-field"
                    variant="outlined"
                    inputProps={{ min: 12.7, step: "0.1" }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Straighten fontSize="small" /></InputAdornment> }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Account Settings Section */}
      <Paper elevation={0} className="profile-section-paper profile-danger-section">
        <Box className="profile-section-title-box">
          <Box className="profile-section-icon-wrapper danger">
            <Warning className="profile-section-icon" />
          </Box>
          <Box>
            <Typography variant="h6" className="profile-section-title danger">
              Account Management
            </Typography>
            <Typography variant="body2" className="profile-section-description">
              Permanently delete your account and all associated data
            </Typography>
          </Box>
        </Box>
        <Divider className="profile-section-divider" />
        <Box className="profile-danger-content">
          <Typography variant="body2" className="profile-danger-warning">
            Once you delete your account, there is no going back. Please be certain. All your data, including sleep records, health metrics, and personal information will be permanently removed.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
            className="profile-delete-account-btn"
          >
            Delete Account
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle className="delete-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ marginRight: 1, color: '#dc2626' }} />
            Delete Account
          </Box>
        </DialogTitle>
        <DialogContent className="delete-dialog-content">
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="delete-dialog-actions">
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            className="cancel-dialog-button"
          >
            Cancel
          </Button>
          <Button
            onClick={deleteAccount}
            className="confirm-delete-button"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile;
