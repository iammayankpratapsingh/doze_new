import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Divider
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

// About Us Content Component
export const AboutUsContent = () => {
  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Header Section */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <InfoIcon sx={{ color: '#667eea' }} />
          About SlimIoT Technologies
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Innovating for a healthier tomorrow
        </Typography>
        <Divider sx={{ mt: 2, mb: 3 }} />
      </Box>

      {/* Company Introduction */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InfoIcon sx={{ color: '#667eea', fontSize: '1.5rem' }} />
          Who We Are
        </Typography>
        <Typography variant="body2" paragraph sx={{ lineHeight: 1.8 }}>
          We are an innovative startup based in India, involved in the innovation and manufacturing of electronic devices mainly in the area of health. Our mission is to leverage technology to improve healthcare accessibility and outcomes.
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
          With a focus on Internet of Things (IoT) solutions, we develop products that connect the physical and digital worlds to provide meaningful health insights and interventions.
        </Typography>
      </Paper>

      {/* Core Competencies */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MindIcon sx={{ color: '#667eea', fontSize: '1.5rem' }} />
        Our Core Competencies
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
            <Box sx={{ bgcolor: '#667eea', color: 'white', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
              <HealthIcon />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Healthcare Devices</Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Innovative medical and health monitoring devices with patented technologies
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
            <Box sx={{ bgcolor: '#667eea', color: 'white', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
              <EngineeringIcon />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Hardware & Firmware</Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              End-to-end development of electronic hardware and embedded firmware solutions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
            <Box sx={{ bgcolor: '#667eea', color: 'white', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
              <InnovationIcon />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Software Development</Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Custom software solutions including web and mobile applications
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: '#f8f9fa', borderRadius: 2, textAlign: 'center' }}>
            <Box sx={{ bgcolor: '#667eea', color: 'white', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
              <BusinessIcon />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Strategic Partnerships</Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Collaborative approach with options for equity participation in promising ventures
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Contact Information */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
          Get In Touch
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <LocationIcon sx={{ color: '#667eea' }} />
            <Typography variant="body2">
              SlimIoT Technologies Private Limited | Faridabad, India
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <EmailIcon sx={{ color: '#667eea' }} />
            <Typography variant="body2">
              plawat[at]slimiot.com
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <PhoneIcon sx={{ color: '#667eea' }} />
            <Typography variant="body2">
              +91 9310035724
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

// Terms Content Component
export const TermsContent = () => {
  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Terms of Service
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Box
        sx={{
          '& h1': { fontSize: '1.5rem', marginTop: 0, fontWeight: 600 },
          '& h2': { fontSize: '1.25rem', marginTop: '1.5rem', fontWeight: 600 },
          '& p': { lineHeight: 1.8, margin: '0.75rem 0', fontSize: '0.9rem' },
          '& ol, & ul': { paddingLeft: '1.5rem', margin: '0.5rem 0 1rem' },
          '& li': { margin: '0.25rem 0', fontSize: '0.9rem', lineHeight: 1.6 },
          '& hr': { border: 0, height: 1, background: '#e2e8f0', margin: '1.5rem 0' },
          wordBreak: 'break-word',
          fontSize: '0.9rem',
        }}
        dangerouslySetInnerHTML={{
          __html: `
            <p><strong>LAST UPDATED:</strong> (insert date)</p>
            <p>
              THIS TERMS OF USE AGREEMENT (THE "AGREEMENT") ESTABLISHES THE TERMS AND CONDITIONS
              THAT APPLY TO YOU WHEN YOU USE THE SERVICE (AS DEFINED BELOW). BY USING THE SERVICE,
              YOU INDICATE YOUR ACCEPTANCE OF THIS AGREEMENT AND YOUR AGREEMENT TO BE BOUND BY ITS
              TERMS, AS WELL AS ALL APPLICABLE LAWS AND REGULATIONS. IF YOU DO NOT AGREE, DO NOT USE
              THE SERVICE. DOZEMATE PRIVATE LIMITED ("THE COMPANY", "WE", "OUR", OR "US") MAY MODIFY
              THIS AGREEMENT AT ANY TIME; WE WILL PUBLISH PRIOR NOTICE OF ANY MATERIAL CHANGES.
              YOUR CONTINUED USE OF THE SERVICE AFTER CHANGES MEANS YOU ACCEPT THEM.
            </p>
            <h2>1. Use of Website, Mobile Applications, and Our Service</h2>
            <p>
              The "Service" means Dozemate's mobile applications and the website located at
              <em>dozemate.com</em>, as each may be updated, relocated, or otherwise modified from time to time,
              including any networks, embeddable widgets, downloadable software, tablet applications,
              and all intellectual property contained therein. The Service provides GPS-GSM devices and
              related services that can provide locations (each, a "Location") to consumers.
            </p>
            <h2>2. Registration, Accounts, Passwords, and Security</h2>
            <p>
              To become a Dozemate Member, you must complete the registration process by providing current,
              complete, and accurate information as prompted. You represent and warrant that you are at least
              eighteen (18) years of age, have not been previously suspended or removed from the Service,
              and have the legal right and ability to enter into this Agreement.
            </p>
            <h2>3. Your Responsibilities</h2>
            <p>
              You may use the Service solely for lawful, non-commercial purposes as intended by its
              functionality. You agree not to damage, disable, overburden, or impair the Service or
              interfere with others' use.
            </p>
            <p>
              <strong>Dozemate Private Limited</strong><br/>
              429, Sector 11D, Faridabad, Haryana, India<br/>
              Email: <a href="mailto:info@dozemate.com">info@dozemate.com</a>
            </p>
          `
        }}
      />
    </Box>
  );
};

// Privacy Content Component
export const PrivacyContent = () => {
  return (
    <Box sx={{ maxWidth: '100%' }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
        Privacy Policy
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Box
        sx={{
          '& h1': { fontSize: '1.5rem', marginTop: 0, fontWeight: 600 },
          '& h2': { fontSize: '1.25rem', marginTop: '1.5rem', fontWeight: 600 },
          '& h3': { fontSize: '1.1rem', marginTop: '1.25rem', fontWeight: 600 },
          '& p': { lineHeight: 1.8, margin: '0.75rem 0', fontSize: '0.9rem' },
          '& ol, & ul': { paddingLeft: '1.5rem', margin: '0.5rem 0 1rem' },
          '& li': { margin: '0.25rem 0', fontSize: '0.9rem', lineHeight: 1.6 },
          wordBreak: 'break-word',
          fontSize: '0.9rem',
        }}
        dangerouslySetInnerHTML={{
          __html: `
            <p><strong>LAST UPDATED:</strong> (insert date)</p>
            <p>
              This Privacy Policy applies to users of the Dozemate™ products and applications.
              Dozemate Private Limited, an Indian company, is the developer and owner of commercial
              rights to applications and products sold under the Dozemate™ brand.
            </p>
            <h2>1) Categories of Personal Data We Process</h2>
            <h3>1.1 When you create a Dozemate account</h3>
            <p>
              When you create a Dozemate account, we ask for your email address and name. You may
              provide only a first name or nickname instead of your full name.
            </p>
            <h3>1.2 Social sign-in (if you choose)</h3>
            <p>
              You may sign in with social media credentials (e.g., Facebook). The first time, the social
              provider may offer to share information. Dozemate only retains and processes your email address.
            </p>
            <h2>2) Categories of Recipients</h2>
            <p>
              We use third-party cloud and logistics providers (e.g., for email delivery tracking,
              engagement analytics, and shipping). These providers process data on our behalf.
            </p>
            <h2>3) International Transfers</h2>
            <p>
              Dozemate is a global business. To provide products, apps, and services, we may transfer your
              personal data to other Dozemate entities in other countries. Depending on your device
              configuration, data may be stored on servers in India, the United States, or Europe.
            </p>
            <h2>4) Cookies and Similar Technologies</h2>
            <p>
              With help from third-party analytics providers, we collect certain information when you visit
              our sites: IP address, device location, browser type/language, request date/time, visit times,
              page views, and clicked elements.
            </p>
            <h2>5) Children</h2>
            <p>
              Dozemate devices are not intended to be purchased by anyone under 13. Where a parent/legal
              guardian purchases a device to locate a child, any personal information transmitted to
              Dozemate is deemed to be the parent's information.
            </p>
            <h2>6) Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy as we add products/apps, improve offerings, or when laws and
              technologies change. The "Last updated" date at the top indicates the latest revision.
            </p>
            <h2>7) Data Controller & Data Protection Officer</h2>
            <p>
              <strong>Dozemate Private Limited</strong><br/>
              429, Sector 11D, Faridabad, Haryana, India<br/>
              Email: <a href="mailto:info@dozemate.com">info@dozemate.com</a>
            </p>
          `
        }}
      />
    </Box>
  );
};

