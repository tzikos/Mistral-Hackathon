import React from "react";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Animated Floating Orbs */}
      <div 
        className="floating-orb floating-orb-1"
        style={{ top: '-10%', left: '-5%' }}
      />
      <div 
        className="floating-orb floating-orb-2"
        style={{ top: '60%', right: '-10%' }}
      />
      <div 
        className="floating-orb floating-orb-3"
        style={{ top: '20%', right: '15%' }}
      />
      
      {/* Additional smaller orbs for depth */}
      <div 
        className="floating-orb"
        style={{ 
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          top: '70%',
          left: '10%',
          animation: 'float-orb-2 22s ease-in-out infinite reverse'
        }}
      />
      <div 
        className="floating-orb"
        style={{ 
          width: '150px',
          height: '150px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          top: '40%',
          left: '60%',
          animation: 'float-orb-3 16s ease-in-out infinite'
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
