import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';

import { store } from './app/store/store';
import { CustomThemeProvider } from './theme/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import GuestRoute from './components/common/GuestRoute';
import Layout from './components/layout/Layout';
import CommandPalette from './components/common/CommandPalette';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Members from './pages/Members';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <CustomThemeProvider>
          <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
            <BrowserRouter>
              <Routes>
                {/* Guest-only auth routes */}
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                </Route>

                {/* Main app workspace routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/members" element={<Members />} />
                    <Route path="/activities" element={<ActivityLog />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<Admin />} />
                  </Route>
                </Route>
              </Routes>
              {/* Keyboard-triggered navigation helper */}
              <CommandPalette />
            </BrowserRouter>
          </SnackbarProvider>
        </CustomThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
