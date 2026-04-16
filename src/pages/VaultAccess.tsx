import React from 'react';
import { useNavigate } from 'react-router-dom';

const VaultAccess = () => {
  const navigate = useNavigate();

  // Redirect to dashboard as VaultAccess is no longer needed with direct Shelby downloads
  React.useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);

  return null;
};

export default VaultAccess;
