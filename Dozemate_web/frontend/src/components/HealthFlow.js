import React, { useEffect, useState } from 'react';
import { FiHeart, FiActivity, FiThermometer, FiWind, FiMoon, FiShield } from 'react-icons/fi';
import './HealthFlow.css';

const HealthFlow = () => {
  const [elements, setElements] = useState([]);

  const healthIcons = [
    { icon: FiHeart, color: '#ff6b6b', size: 'extra-large', type: 'heart' },
    { icon: FiActivity, color: '#4ecdc4', size: 'medium' },
    { icon: FiThermometer, color: '#ffa726', size: 'extra-large', type: 'thermometer' },
    { icon: FiWind, color: '#ab47bc', size: 'large' },
    { icon: FiMoon, color: '#42a5f5', size: 'medium' },
    { icon: FiShield, color: '#66bb6a', size: 'small' },
  ];

  useEffect(() => {
    // Create floating elements
    const newElements = [];
    for (let i = 0; i < 12; i++) {
      const iconData = healthIcons[Math.floor(Math.random() * healthIcons.length)];
      const IconComponent = iconData.icon;

      newElements.push({
        id: i,
        icon: <IconComponent />,
        color: iconData.color,
        size: iconData.size,
        type: iconData.type || '',
        x: Math.random() * 100,
        y: Math.random() * 100,
        speedX: (Math.random() - 0.5) * 0.3, // Slower movement
        speedY: (Math.random() - 0.5) * 0.3, // Slower movement
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1, // Slower rotation
        pulseDelay: Math.random() * 3,
      });
    }
    setElements(newElements);
  }, []);

  return (
    <div className="health-flow-container">
      {/* Floating Health Icons */}
      <div className="floating-icons">
        {elements.map((element) => (
          <div
            key={element.id}
            className={`floating-icon ${element.size} ${element.type}`}
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              color: element.color,
              '--speed-x': `${element.speedX}px`,
              '--speed-y': `${element.speedY}px`,
              '--rotation': `${element.rotation}deg`,
              '--rotation-speed': `${element.rotationSpeed}deg`,
              '--pulse-delay': `${element.pulseDelay}s`,
            }}
          >
            {element.icon}
          </div>
        ))}
      </div>

      {/* Heartbeat Waveforms */}
      <div className="heartbeat-waves">
        <svg className="wave wave-1" viewBox="0 0 1200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,100 Q300,50 600,100 T1200,100" stroke="#ff6b6b" strokeWidth="2" fill="none" opacity="0.3"/>
        </svg>
        <svg className="wave wave-2" viewBox="0 0 1200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,120 Q300,80 600,120 T1200,120" stroke="#4ecdc4" strokeWidth="2" fill="none" opacity="0.2"/>
        </svg>
        <svg className="wave wave-3" viewBox="0 0 1200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,140 Q300,110 600,140 T1200,140" stroke="#42a5f5" strokeWidth="2" fill="none" opacity="0.25"/>
        </svg>
      </div>

      {/* Heart Rate ECG Waveforms */}
      <div className="heart-rate-ecg">
        <svg className="ecg-wave ecg-main" viewBox="0 0 1000 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,50 L100,50 L110,30 L120,70 L130,20 L140,50 L200,50 L210,35 L220,65 L230,15 L240,50 L350,50 L360,45 L370,55 L380,50 L450,50 L460,40 L470,60 L480,50 L550,50 L560,48 L570,52 L580,50 L650,50 L660,35 L670,65 L680,50 L750,50 L760,42 L770,58 L780,50 L850,50 L860,38 L870,62 L880,50 L950,50 L960,46 L970,54 L980,50 L1000,50"
                stroke="#ff6b6b" strokeWidth="3" fill="none" opacity="0.6"/>
        </svg>
        <svg className="ecg-wave ecg-secondary" viewBox="0 0 1000 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 L150,60 L160,50 L170,70 L180,40 L190,60 L300,60 L310,55 L320,65 L330,60 L400,60 L410,50 L420,70 L430,60 L500,60 L510,58 L520,62 L530,60 L600,60 L610,45 L620,75 L630,60 L700,60 L710,52 L720,68 L730,60 L800,60 L810,48 L820,72 L830,60 L900,60 L910,56 L920,64 L930,60 L1000,60"
                stroke="#4ecdc4" strokeWidth="2" fill="none" opacity="0.4"/>
        </svg>
        <div className="ecg-grid">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="grid-line" style={{ left: `${i * 5}%` }}></div>
          ))}
        </div>
      </div>

      {/* Data Stream Particles */}
      <div className="data-streams">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="data-stream"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            <div className="stream-particle"></div>
            <div className="stream-particle"></div>
            <div className="stream-particle"></div>
          </div>
        ))}
      </div>


      {/* Background Gradient Overlay */}
      <div className="health-gradient-overlay">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>
    </div>
  );
};

export default HealthFlow;
