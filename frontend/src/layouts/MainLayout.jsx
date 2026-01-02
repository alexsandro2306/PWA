import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="content-wrapper">
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        .layout-wrapper {
          display: flex;
          min-height: 100vh;
        }
        .content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .main-content {
          margin: 0 1rem 1rem 300px;
          padding: 1rem;
          min-height: calc(100vh - 100px);
        }
        @media (max-width: 1024px) {
          .main-content { margin-left: 1rem; }
          /* Add mobile responsiveness later */
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
