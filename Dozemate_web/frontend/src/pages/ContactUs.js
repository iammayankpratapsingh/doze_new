import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Divider,
  Button
} from '@mui/material';
import {
  Lightbulb as InnovationIcon,
  HealthAndSafety as HealthIcon,
  Build as EngineeringIcon,
  BusinessCenter as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Info as InfoIcon,
  Psychology as MindIcon,
  Handshake as PartnershipIcon
} from '@mui/icons-material';
import './ContactUs.css';
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/material/Link";


const contactChannels = [
  {
    id: 'visit',
    label: 'Visit our lab',
    value: 'SlimIoT Technologies Private Limited, Faridabad, India',
    meta: 'HQ & R&D Lab',
    icon: <LocationIcon />
  },
  {
    id: 'email',
    label: 'Write to us',
    value: 'plawat@slimiot.com',
    meta: '24/7 monitored inbox',
    icon: <EmailIcon />,
    href: 'mailto:plawat@slimiot.com'
  },
  {
    id: 'phone',
    label: 'Talk to a human',
    value: '+91 9310035724',
    meta: 'Mon - Fri · 9am to 7pm IST',
    icon: <PhoneIcon />,
    href: 'tel:+919310035724'
  }
];

const AboutUs = () => {
  return (
    <Box className="aboutus-wrapper">
      {/* Hero Section */}
      <Box className="aboutus-hero">
        <Container maxWidth="lg">
          <Box className="hero-content">
            <Box className="hero-icon-wrapper">
              <InfoIcon className="hero-icon" />
            </Box>
            <Typography variant="h2" component="h1" className="hero-title">
              About SlimIoT Technologies
            </Typography>
            <Typography variant="h6" className="hero-subtitle">
              Innovating for a healthier tomorrow through cutting-edge IoT solutions
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" className="aboutus-container">

        {/* Company Introduction */}
        <Paper elevation={0} className="content-section intro-section">
          <Box className="section-header-box">
            <Box className="section-icon-box">
              <InfoIcon className="section-icon" />
            </Box>
            <Typography variant="h4" gutterBottom className="section-title">
              Who We Are
            </Typography>
          </Box>
          <Box className="section-content">
            <Typography variant="body1" paragraph className="content-text">
              We are an innovative startup based in India, involved in the innovation and manufacturing of electronic devices mainly in the area of health. Our mission is to leverage technology to improve healthcare accessibility and outcomes.
            </Typography>
            <Typography variant="body1" className="content-text">
              With a focus on Internet of Things (IoT) solutions, we develop products that connect the physical and digital worlds to provide meaningful health insights and interventions.
            </Typography>
          </Box>
        </Paper>

        {/* Core Competencies */}
        <Box className="competencies-section">
          <Box className="competencies-header">
            <Box className="section-header-box">
              <Box className="section-icon-box">
                <MindIcon className="section-icon" />
              </Box>
              <Typography variant="h4" className="section-title">
                Our Core Competencies
              </Typography>
            </Box>
            <Typography variant="body1" className="section-description">
              We excel in multiple domains, bringing together hardware, software, and innovation to create comprehensive solutions.
            </Typography>
          </Box>
          <Grid container spacing={3} className="feature-grid" justifyContent="center">
            <Grid item xs={12} sm={6}>
              <Paper className="feature-box">
                <Box className="icon-container health-icon">
                  <HealthIcon className="feature-icon" />
                </Box>
                <Typography variant="h6" gutterBottom className="feature-title">
                  Healthcare Devices
                </Typography>
                <Typography variant="body2" className="feature-text">
                  Innovative medical and health monitoring devices with patented technologies
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper className="feature-box">
                <Box className="icon-container engineering-icon">
                  <EngineeringIcon className="feature-icon" />
                </Box>
                <Typography variant="h6" gutterBottom className="feature-title">
                  Hardware & Firmware
                </Typography>
                <Typography variant="body2" className="feature-text">
                  End-to-end development of electronic hardware and embedded firmware solutions
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper className="feature-box">
                <Box className="icon-container innovation-icon">
                  <InnovationIcon className="feature-icon" />
                </Box>
                <Typography variant="h6" gutterBottom className="feature-title">
                  Software Development
                </Typography>
                <Typography variant="body2" className="feature-text">
                  Custom software solutions including web and mobile applications
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper className="feature-box">
                <Box className="icon-container business-icon">
                  <BusinessIcon className="feature-icon" />
                </Box>
                <Typography variant="h6" gutterBottom className="feature-title">
                  Strategic Partnerships
                </Typography>
                <Typography variant="body2" className="feature-text">
                  Collaborative approach with options for equity participation in promising ventures
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Innovation and Patents */}
        <Paper elevation={0} className="content-section innovation-section">
          <Box className="section-header-box">
            <Box className="section-icon-box">
              <InnovationIcon className="section-icon" />
            </Box>
            <Typography variant="h4" gutterBottom className="section-title">
              Innovation & Intellectual Property
            </Typography>
          </Box>
          <Box className="section-content">
            <Typography variant="body1" paragraph className="content-text">
              Innovation is at the core of what we do. We hold patents for several of our healthcare devices and have additional patents in the pipeline. Our R&D team continuously works on developing novel solutions that address real-world health challenges.
            </Typography>
            <Typography variant="body1" className="content-text">
              We pride ourselves on creating unique technologies that combine hardware excellence with intelligent software to deliver seamless user experiences.
            </Typography>
          </Box>
        </Paper>

        {/* Project Approach */}
        <Paper elevation={0} className="content-section approach-section">
          <Box className="section-header-box">
            <Box className="section-icon-box">
              <PartnershipIcon className="section-icon" />
            </Box>
            <Typography variant="h4" gutterBottom className="section-title">
              Our Project Approach
            </Typography>
          </Box>
          <Box className="section-content">
            <Typography variant="body1" paragraph className="content-text">
              We are selective in the projects we undertake, focusing on initiatives that align with our expertise and vision. For projects of mutual interest, we offer flexible engagement models including:
            </Typography>
            <Box component="ul" className="approach-list">
              <Typography component="li" variant="body1" paragraph className="approach-list-item">
                Traditional service-based development
              </Typography>
              <Typography component="li" variant="body1" paragraph className="approach-list-item">
                Co-development partnerships
              </Typography>
              <Typography component="li" variant="body1" paragraph className="approach-list-item">
                Equity participation at mutually agreed terms
              </Typography>
            </Box>
            <Typography variant="body1" className="content-text">
              This approach allows us to be deeply invested in the success of the projects we work on, going beyond the typical client-vendor relationship.
            </Typography>
          </Box>
        </Paper>

        {/* Get In Touch Section */}
        <Box className="getintouch-section">
          <Box className="getintouch-grid">
            <Box className="getintouch-panel intro-panel">
              <Typography className="getintouch-eyebrow">Get in touch</Typography>
              <Typography variant="h4" className="getintouch-title">
                Build the future of connected care with us
              </Typography>
              <Typography variant="body1" className="getintouch-description">
                Whether you have a product query, partnership idea, or need technical guidance,
                our founding team reads every message personally.
              </Typography>
            </Box>

            <Box className="getintouch-panel channel-panel">
              {contactChannels.map((channel) => (
                <Box className="getintouch-channel" key={channel.id}>
                  <Box className="channel-icon">
                    {channel.icon}
                  </Box>
                  <Box className="channel-content">
                    <Typography className="channel-label">{channel.label}</Typography>
                    {channel.href ? (
                      <Link
                        href={channel.href}
                        className="channel-link"
                      >
                        {channel.value}
                      </Link>
                    ) : (
                      <Typography className="channel-value">{channel.value}</Typography>
                    )}
                    <Typography className="channel-meta">{channel.meta}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box className="getintouch-footer">
            <Typography className="getintouch-footer-text">
              Prefer talking to a person? Jump straight into a support conversation.
            </Typography>
            <Button
              variant="contained"
              className="getintouch-cta"
              onClick={() => (window.location.href = '/support')}
            >
              Talk to Support
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutUs;