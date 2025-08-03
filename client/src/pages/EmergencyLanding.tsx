export default function EmergencyLanding() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '30px'
        }}>
          AURA
        </h1>
        <p style={{
          fontSize: '1.5rem',
          marginBottom: '40px',
          opacity: 0.9
        }}>
          Build Your Legendary Status
        </p>
        <p style={{
          fontSize: '1.2rem',
          marginBottom: '40px',
          opacity: 0.8
        }}>
          The app that's breaking the internet. Complete challenges, flex your wins, and build legendary status that everyone talks about.
        </p>
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '60px'
        }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '1.2rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            GET AURA NOW
          </button>
          <button 
            style={{
              background: 'transparent',
              color: 'white',
              border: '2px solid #8B5CF6',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '1.2rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            SEE THE HYPE
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8B5CF6' }}>60</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>LEGENDS</div>
          </div>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EC4899' }}>AURA</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>STATUS</div>
          </div>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>0</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>LIVE NOW</div>
          </div>
        </div>
        
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '15px',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <h3 style={{ color: '#8B5CF6', marginBottom: '10px' }}>Emergency Landing Page</h3>
          <p style={{ opacity: 0.8, fontSize: '1rem' }}>
            This page is showing because of potential styling conflicts. The platform is working correctly.
          </p>
        </div>
      </div>
    </div>
  );
}