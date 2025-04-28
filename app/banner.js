export default function Banner() {
  return (
    <div className="banner-container" style={{textAlign: 'center', marginBottom: '30px'}}>
      <img 
        src="/dj-bobby-drake-logo.png"
        alt="DJ Bobby Drake Logo"
        style={{
          width: '220px',
          height: 'auto',
          margin: '0 auto 15px',
          display: 'block'
        }}
      />
      
      <h1 style={{
        fontSize: '36px',
        fontWeight: 'bold',
        margin: '15px 0 10px',
        color: '#000'
      }}>
        Event Contract
      </h1>
      
      <div style={{
        fontSize: '16px',
        color: '#0070f3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{marginRight: '8px'}}>✉️</span>
        <a 
          href="mailto:therealdjbobbydrake@gmail.com"
          style={{
            color: '#0070f3',
            textDecoration: 'none'
          }}
        >
          therealdjbobbydrake@gmail.com
        </a>
      </div>
    </div>
  );
} 