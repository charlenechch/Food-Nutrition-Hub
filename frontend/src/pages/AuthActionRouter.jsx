import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthActionRouter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    if (!oobCode) {
      // No code, go to login
      navigate('/loginregister');
      return;
    }
    
    // Route based on mode
    switch (mode) {
      case 'resetPassword':
        // Go to your existing reset password page
        navigate(`/resetpassword?oobCode=${oobCode}`);
        break;
        
      case 'verifyEmail':
        // Handle email verification here (since you use Firebase default)
        navigate(`/verifyemail?oobCode=${oobCode}`);
        break;
        
      case 'recoverEmail':
        // Handle email recovery
        navigate(`/loginregister?message=email-recovered`);
        break;
        
      default:
        // Unknown mode
        navigate('/loginregister');
    }
  }, [navigate, searchParams]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '1.2rem',
      color: '#666'
    }}>
      Redirecting...
    </div>
  );
}