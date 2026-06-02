'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const WorkspaceContext = createContext({
  activeWorkspace: null,
  loginToWorkspace: async () => {},
  logout: () => {},
  isLoggingIn: false,
});

export const WorkspaceProvider = ({ children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem('activeWorkspace');
    if (saved) {
      setActiveWorkspace(saved);
    }
  }, []);

  const loginToWorkspace = async (workspace) => {
    setIsLoggingIn(workspace);
    // Simulate a secure SSO authorization handshake
    await new Promise((resolve) => setTimeout(resolve, 2400));
    setIsLoggingIn(false);
    setActiveWorkspace(workspace);
    localStorage.setItem('activeWorkspace', workspace);
    
    if (workspace === 'hr') {
      router.push('/hr/employee-directory');
    } else if (workspace === 'marketing') {
      router.push('/marketing/lead-management');
    }
  };

  const logout = () => {
    setActiveWorkspace(null);
    localStorage.removeItem('activeWorkspace');
    router.push('/');
  };

  return (
    <WorkspaceContext.Provider value={{ activeWorkspace, loginToWorkspace, logout, isLoggingIn }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
