import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Checking authentication...</div>
      </div>
    );
    
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}