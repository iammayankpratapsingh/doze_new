import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Phone as PhoneIcon, 
  Email as EmailIcon,
  Send as SendIcon,
  SupportAgent as SupportIcon,
  QuestionAnswer as FAQIcon,
  KeyboardArrowRight as ArrowIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
import './Support.css';

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    
    // Show success message
    setSnackbar({
      open: true,
      message: 'Your message has been sent! Our team will get back to you soon.',
      severity: 'success'
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  return (
    <Box className="support-wrapper">
      {/* Hero Section */}
      <Box className="support-hero">
        <Container maxWidth="lg">
          <Box className="hero-content">
            <Box className="hero-icon-wrapper">
              <SupportIcon className="hero-icon" />
            </Box>
            <Typography variant="h2" component="h1" className="hero-title">
              How Can We Help You?
            </Typography>
            <Typography variant="h6" className="hero-subtitle">
              Our dedicated support team is here to assist you with any questions or issues. 
              Get in touch with us through any of the channels below.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" className="support-container">
        {/* Contact Information Cards */}
        <Grid container spacing={2} className="contact-cards-section" justifyContent="center">
          <Grid item xs={4} sm={4} md={4}>
            <Card className="contact-card">
              <CardContent className="contact-card-content">
                <Box className="icon-box">
                  <Box className="icon-wrapper phone-icon-wrapper">
                    <PhoneIcon className="contact-icon" />
                  </Box>
                </Box>
                <Typography variant="h6" component="h2" align="center" className="contact-title">
                  Call Us
                </Typography>
                <Typography variant="body2" align="center" className="contact-text">
                  Our support team is available during business hours
                </Typography>
                <Typography variant="body1" align="center" className="contact-info">
                  <a href="tel:+919310035724" className="contact-link">(+91) 9310035724</a>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={4} sm={4} md={4}>
            <Card className="contact-card">
              <CardContent className="contact-card-content">
                <Box className="icon-box">
                  <Box className="icon-wrapper email-icon-wrapper">
                    <EmailIcon className="contact-icon" />
                  </Box>
                </Box>
                <Typography variant="h6" component="h2" align="center" className="contact-title">
                  Email Us
                </Typography>
                <Typography variant="body2" align="center" className="contact-text">
                  Send us an email and we'll respond as soon as possible
                </Typography>
                <Typography variant="body1" align="center" className="contact-info">
                  <a href="mailto:plawat@slimiot.com" className="contact-link">plawat@slimiot.com</a>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={4} sm={4} md={4}>
            <Card className="contact-card">
              <CardContent className="contact-card-content">
                <Box className="icon-box">
                  <Box className="icon-wrapper bug-icon-wrapper">
                    <BugIcon className="contact-icon" />
                  </Box>
                </Box>
                <Typography variant="h6" component="h2" align="center" className="contact-title">
                  Report Bug
                </Typography>
                <Typography variant="body2" align="center" className="contact-text">
                  Found a bug? Report it directly to our development team
                </Typography>
                <Typography variant="body1" align="center" className="contact-info">
                  <a href="mailto:hkchaurasia2@gmail.com" className="contact-link">hkchaurasia2@gmail.com</a>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Contact Form Section */}
        <Paper elevation={0} className="form-section">
          <Box className="form-header">
            <Box className="form-header-content">
              <SendIcon className="form-header-icon" />
              <Typography variant="h4" component="h2" className="form-title">
                Send Us a Message
              </Typography>
            </Box>
            <Typography variant="body1" className="form-description">
              Fill out the form below and we'll get back to you as soon as possible
            </Typography>
          </Box>
          
          <Divider className="section-divider" />
          
          <form onSubmit={handleSubmit} className="support-form">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  className="form-field"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  className="form-field"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  className="form-field"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  multiline
                  rows={1}
                  variant="outlined"
                  className="form-field message-field"
                />
              </Grid>
              <Grid item xs={12}>
                <Box className="submit-button-wrapper">
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    endIcon={<SendIcon />}
                    className="submit-button"
                  >
                    Send Message
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* FAQ Section */}
        <Paper elevation={0} className="faq-section">
          <Box className="faq-header">
            <Box className="faq-header-content">
              <FAQIcon className="faq-header-icon" />
              <Typography variant="h4" component="h2" className="faq-title">
                Frequently Asked Questions
              </Typography>
            </Box>
            <Typography variant="body1" className="faq-description">
              Find quick answers to common questions about our platform
            </Typography>
          </Box>
          
          <Divider className="section-divider" />
          
          <Box className="faq-list">
            <Box className="faq-item">
              <Box className="faq-number">01</Box>
              <Box className="faq-content">
                <Typography variant="h6" className="faq-question">
                  How do I add a new device?
                </Typography>
                <Typography variant="body1" className="faq-answer">
                  Navigate to the "My Devices" page and click on "Assign Device". Enter your device ID and click submit.
                </Typography>
              </Box>
            </Box>
            
            <Box className="faq-item">
              <Box className="faq-number">02</Box>
              <Box className="faq-content">
                <Typography variant="h6" className="faq-question">
                  How can I change my account information?
                </Typography>
                <Typography variant="body1" className="faq-answer">
                  Go to your profile page by clicking on your avatar in the top-right corner and selecting "Profile". You can edit your information there.
                </Typography>
              </Box>
            </Box>
            
            <Box className="faq-item">
              <Box className="faq-number">03</Box>
              <Box className="faq-content">
                <Typography variant="h6" className="faq-question">
                  What should I do if my device is not responding?
                </Typography>
                <Typography variant="body1" className="faq-answer">
                  First, check if the device is properly connected to power and network. If the issue persists, try removing and adding the device again.
                </Typography>
              </Box>
            </Box>

            <Box className="faq-item">
              <Box className="faq-number">04</Box>
              <Box className="faq-content">
                <Typography variant="h6" className="faq-question">
                  How do I report a bug or technical issue?
                </Typography>
                <Typography variant="body1" className="faq-answer">
                  If you encounter any bugs or technical issues, please email our development team directly at hkchaurasia2@gmail.com with detailed information about the problem, including steps to reproduce it.
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box className="faq-footer">
            <Button
              variant="outlined"
              endIcon={<ArrowIcon />}
              className="all-faqs-button"
            >
              View All FAQs
            </Button>
          </Box>
        </Paper>
      </Container>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        className="feedback-snackbar"
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          className="feedback-alert"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Support;