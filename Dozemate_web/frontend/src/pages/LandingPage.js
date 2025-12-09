import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FiHeart, FiActivity, FiThermometer, FiWind,
    FiMoon, FiAlertCircle, FiAirplay, FiMonitor,
    FiTrendingUp, FiShield, FiSmartphone, FiBarChart2,
    FiCheckCircle, FiArrowRight, FiMail, FiMapPin,
    FiFacebook, FiTwitter, FiLinkedin, FiInstagram, FiGlobe
} from 'react-icons/fi';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import HealthFlow from '../components/HealthFlow';
import Modal from '../components/Modal';
import { AboutUsContent, TermsContent, PrivacyContent } from '../components/ModalContent';
import logo from '../assets/images/logo_new-removebg-preview.png';
import ElectricBorder from '../components/ElectricBorder';
import videoSrc from '../assets/images/vdo_3.mp4';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [modalType, setModalType] = useState(null);

    const handleGetStarted = () => {
        navigate('/login');
    };

    const openModal = (type) => {
        setModalType(type);
    };

    const closeModal = () => {
        setModalType(null);
    };

    const features = [
        {
            icon: <FiHeart />,
            title: 'Heart Rate',
            description: 'Continuous heart rate monitoring with real-time alerts'
        },
        {
            icon: <FiWind />,
            title: 'Respiration',
            description: 'Track breathing patterns and respiratory health'
        },
        {
            icon: <FiThermometer />,
            title: 'Temperature',
            description: 'Monitor core and skin temperature variations'
        },
        {
            icon: <FiMoon />,
            title: 'Sleep Quality',
            description: 'Comprehensive sleep analysis and quality metrics'
        },
        {
            icon: <FiAlertCircle />,
            title: 'Stress Levels',
            description: 'HRV-based stress monitoring and management'
        },
        {
            icon: <FiMonitor />,
            title: 'Device Management',
            description: 'Multi-device support with centralized monitoring'
        }
    ];

    const benefits = [
        { icon: <FiTrendingUp />, text: '24/7 Health Monitoring' },
        { icon: <FiAlertCircle />, text: 'Real-Time Alerts' },
        { icon: <FiBarChart2 />, text: 'Comprehensive Analytics' },
        { icon: <FiSmartphone />, text: 'Multi-Device Support' },
        { icon: <FiShield />, text: 'Secure & Private' }
    ];

    const steps = [
        {
            number: '01',
            title: 'Connect Your Device',
            description: 'Pair your DozeMATE device or compatible health monitoring device with the platform',
            lottieUrl: 'https://lottie.host/0f547380-b5e5-44af-86ea-0082863aa662/MiDY7C9tVA.lottie'
        },
        {
            number: '02',
            title: 'Real-Time Monitoring',
            description: 'Start receiving live health data including heart rate, respiration, temperature, and more',
            lottieUrl: 'https://lottie.host/7af2db6f-264d-44c5-b457-05d502395dc9/tcovhBHXvn.lottie'
        },
        {
            number: '03',
            title: 'Analytics & Insights',
            description: 'View detailed charts, trends, and personalized health insights on your dashboard',
            lottieUrl: 'https://lottie.host/eeb133f4-912c-4526-a510-e4badc8c1ea8/1cF4jDjE8p.lottie'
        }
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="nav-logo">
                        <img src={logo} alt="DozeMATE" className="nav-logo-img" />
                    </div>
                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <button className="nav-cta" onClick={handleGetStarted}>
                            Login
                        </button>
                    </div>
                </div>
            </nav>

            {/* Video Section */}
            <section className="video-section">
                <div className="video-section-container">
                    <div className="video-wrapper">
                        <video 
                            className="landing-video" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                        >
                            <source src={videoSrc} type="video/mp4" />
                        </video>
                        <div className="video-overlay"></div>
                    </div>
                    <div className="video-content">
                        <h2 className="video-section-title">Experience DozeMATE in Action</h2>
                        <p className="video-section-description">
                            See how DozeMATE transforms your health monitoring experience
                        </p>
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="healthflow-wrapper">
                    <HealthFlow />
                </div>
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Monitor Your Health in{' '}
                            <span className="gradient-text">Real-Time</span>
                        </h1>
                        <p className="hero-description">
                            Comprehensive health tracking and wellness analytics platform.
                            Track vital signs, environmental factors, and sleep quality with
                            industry-leading precision and real-time insights.
                        </p>
                        <div className="hero-buttons">
                            <button className="btn-primary" onClick={handleGetStarted}>
                                Login
                                <FiArrowRight className="btn-icon" />
                            </button>
                            <a href="#features" className="btn-secondary">
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-container">
                    <div className="landing-section-header">
                        <h2 className="section-title">What DozeMATE Manages</h2>
                        <p className="section-subtitle">
                            Comprehensive health and environmental monitoring for optimal wellness tracking
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <ElectricBorder
                                key={index}
                                gradientColors={["#7df9ff", "#9b5dff", "#ff5dd0", "#6ee7ff"]}
                                gradientInterval={2800}
                                speed={1.2}
                                chaos={0.6}
                                thickness={2}
                                className="feature-electric-border"
                                style={{ borderRadius: 24 }}
                            >
                                <div className="feature-card">
                                    <div className="feature-icon">{feature.icon}</div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-description">{feature.description}</p>
                                </div>
                            </ElectricBorder>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="section-container">
                    <div className="landing-section-header">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">
                            Get started with DozeMATE in three simple steps
                        </p>
                    </div>
                    <div className="steps-container">
                        {steps.map((step, index) => (
                            <div key={index} className="step-card">
                                <div className="step-number">{step.number}</div>
                                <div className="step-image">
                                    {step.lottieUrl ? (
                                        <DotLottieReact
                                            src={step.lottieUrl}
                                            loop
                                            autoplay
                                            className="step-lottie"
                                        />
                                    ) : (
                                        <img src={step.image} alt={step.title} loading="lazy" />
                                    )}
                                </div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits-section">
                <div className="section-container">
                    <div className="benefits-content">
                        <div className="benefits-text">
                            <h2 className="section-title">Why Choose DozeMATE?</h2>
                            <p className="section-subtitle">
                                Experience the future of health monitoring with cutting-edge technology
                                and comprehensive analytics
                            </p>
                            <ul className="benefits-list">
                                {benefits.map((benefit, index) => (
                                    <li key={index} className="benefit-item">
                                        <span className="benefit-icon">{benefit.icon}</span>
                                        <span>{benefit.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="benefits-image">
                            <dotlottie-wc
                                src="https://lottie.host/2f64030e-55cd-42ef-843b-fa8f02dcd8df/MZGXx2TwD8.lottie"
                                className="benefits-lottie"
                                autoplay
                                loop
                            ></dotlottie-wc>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Ready to Start Monitoring Your Health?</h2>
                    <p className="cta-description">
                        Join thousands of users who trust DozeMATE for their health monitoring needs
                    </p>
                    <button className="btn-primary large" onClick={handleGetStarted}>
                        Login
                        <FiArrowRight className="btn-icon" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-container">
                    <div className="footer-main">
                        <div className="footer-brand">
                            <img src={logo} alt="DozeMATE" className="footer-logo-img" />
                            <p className="footer-tagline">Advanced health monitoring and wellness analytics</p>
                            <p className="company-info">
                                Powered by <a href="https://www.slimiot.com" target="_blank" rel="noopener noreferrer" className="company-link">SlimIoT Technologies</a>
                            </p>
                        </div>

                        <div className="footer-links-grid">
                            <div className="footer-column">
                                <h4>Product</h4>
                                <ul>
                                    <li><a href="#features">Features</a></li>
                                    <li><a href="#how-it-works">How It Works</a></li>
                                    <li><Link to="/support">Support</Link></li>
                                </ul>
                            </div>

                            <div className="footer-column">
                                <h4>Company</h4>
                                <ul>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('about'); }}>About Us</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('terms'); }}>Terms</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('privacy'); }}>Privacy</a></li>
                                </ul>
                            </div>

                            <div className="footer-column">
                                <h4>Contact</h4>
                                <ul className="contact-list">
                                    <li className="contact-item">
                                        <FiMapPin className="contact-icon" />
                                        <span>Faridabad, India</span>
                                    </li>
                                    <li className="contact-item">
                                        <FiMail className="contact-icon" />
                                        <a href="mailto:plawat@slimiot.com">plawat@slimiot.com</a>
                                    </li>
                                    <li className="contact-item">
                                        <FiGlobe className="contact-icon" />
                                        <a href="https://www.slimiot.com" target="_blank" rel="noopener noreferrer">www.slimiot.com</a>
                                    </li>
                                </ul>
                            </div>

                            <div className="footer-column footer-social-column">
                                <h4>Follow Us</h4>
                                <div className="social-links">
                                    <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                        <FiFacebook />
                                    </a>
                                    <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                        <FiTwitter />
                                    </a>
                                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                        <FiLinkedin />
                                    </a>
                                    <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                        <FiInstagram />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} SlimIoT Technologies Private Limited. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Modals */}
            <Modal
                isOpen={modalType === 'about'}
                onClose={closeModal}
                title="About Us"
            >
                <AboutUsContent />
            </Modal>

            <Modal
                isOpen={modalType === 'terms'}
                onClose={closeModal}
                title="Terms of Service"
            >
                <TermsContent />
            </Modal>

            <Modal
                isOpen={modalType === 'privacy'}
                onClose={closeModal}
                title="Privacy Policy"
            >
                <PrivacyContent />
            </Modal>
        </div>
    );
};

export default LandingPage;

