import React from 'react';
import { Navigate } from 'react-router-dom';

const Settings: React.FC = () => {
  return <Navigate to="/settings/system" replace />;
};

export default Settings;