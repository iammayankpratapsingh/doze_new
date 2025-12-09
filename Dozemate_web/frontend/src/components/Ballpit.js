import React, { useEffect, useRef } from 'react';
import './Ballpit.css';

const Ballpit = ({ count = 60, colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'] }) => {
  const canvasRef = useRef(null);
  const ballsRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio || 1;
      canvas.height = rect.height * window.devicePixelRatio || 1;
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();

    // Create balls
    const balls = [];
    for (let i = 0; i < count; i++) {
      balls.push({
        x: Math.random() * canvas.width / (window.devicePixelRatio || 1),
        y: Math.random() * canvas.height / (window.devicePixelRatio || 1),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 15 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.4 + 0.2
      });
    }
    ballsRef.current = balls;

    // Animation loop
    const animate = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      
      ctx.clearRect(0, 0, width, height);

      balls.forEach((ball, i) => {
        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off walls with slight damping
        if (ball.x + ball.radius > width || ball.x - ball.radius < 0) {
          ball.vx = -ball.vx * 0.9;
          ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));
        }
        if (ball.y + ball.radius > height || ball.y - ball.radius < 0) {
          ball.vy = -ball.vy * 0.9;
          ball.y = Math.max(ball.radius, Math.min(height - ball.radius, ball.y));
        }

        // Collision detection with other balls
        for (let j = i + 1; j < balls.length; j++) {
          const other = balls[j];
          const dx = other.x - ball.x;
          const dy = other.y - ball.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = ball.radius + other.radius;

          if (distance < minDistance) {
            const angle = Math.atan2(dy, dx);
            const targetX = ball.x + Math.cos(angle) * minDistance;
            const targetY = ball.y + Math.sin(angle) * minDistance;
            const ax = (targetX - other.x) * 0.05;
            const ay = (targetY - other.y) * 0.05;

            ball.vx -= ax;
            ball.vy -= ay;
            other.vx += ax;
            other.vy += ay;
          }
        }

        // Draw ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.globalAlpha = ball.opacity;
        ctx.fill();
        
        // Add highlight for 3D effect
        ctx.beginPath();
        ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      resizeCanvas();
      // Reposition balls if needed
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      balls.forEach(ball => {
        if (ball.x > width) ball.x = width - ball.radius;
        if (ball.y > height) ball.y = height - ball.radius;
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [count, colors]);

  return <canvas ref={canvasRef} className="ballpit-canvas" />;
};

export default Ballpit;

