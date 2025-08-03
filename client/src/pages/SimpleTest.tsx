export default function SimpleTest() {
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
      <div style={{
        textAlign: 'center',
        maxWidth: '600px'
      }}>
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
        <button 
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
          onClick={() => alert('Simple test working!')}
        >
          GET AURA NOW
        </button>
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '15px',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <h3 style={{ color: '#8B5CF6', marginBottom: '10px' }}>Simple Test Page</h3>
          <p style={{ opacity: 0.8, fontSize: '1rem' }}>
            This is a basic test page without complex dependencies or external assets.
            If you can see this, the React app is working correctly.
          </p>
        </div>
      </div>
    </div>
  );
}