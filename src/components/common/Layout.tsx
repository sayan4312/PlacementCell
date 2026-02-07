import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="dark">
      <div className="min-h-screen bg-dark-bg transition-colors duration-300">
        <Navbar />
        {children}
      </div>
    </div>
  );
};