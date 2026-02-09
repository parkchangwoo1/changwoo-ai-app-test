import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import GlobalStyles from '@/app/styles/GlobalStyles';
import { ThemeProvider } from '@/app/providers';
import { Sidebar } from '@/widgets/sidebar';
import { HomePage, ChatPage, ProjectPage, ProjectChatPage } from '@/pages';
import { BREAKPOINTS, MEDIA } from '@/shared/config/breakpoints';
import { runMigration } from '@/shared/lib';
import { ToastContainer } from '@/shared/ui';

function AppLayout() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => window.innerWidth <= BREAKPOINTS.mobile
  );
  const [trackedPathname, setTrackedPathname] = useState(location.pathname);

  if (trackedPathname !== location.pathname) {
    setTrackedPathname(location.pathname);
    if (window.innerWidth <= BREAKPOINTS.mobile) {
      setIsSidebarCollapsed(true);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      document.body.classList.remove('preload');
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
    const sidebarWidth = isMobile ? '0px' : isSidebarCollapsed ? '66px' : '280px';
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
  }, [isSidebarCollapsed]);

  const openSidebar = () => setIsSidebarCollapsed(false);
  const closeSidebar = () => setIsSidebarCollapsed(true);

  return (
    <Container>
      <Overlay $isVisible={!isSidebarCollapsed} onClick={closeSidebar} />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <MainContent>
        <Routes>
          <Route path="/" element={<HomePage onOpenSidebar={openSidebar} />} />
          <Route path="/chat/:chatId" element={<ChatPage onOpenSidebar={openSidebar} />} />
          <Route path="/project/:projectId" element={<ProjectPage onOpenSidebar={openSidebar} />} />
          <Route
            path="/project/:projectId/chat/:chatId"
            element={<ProjectChatPage onOpenSidebar={openSidebar} />}
          />
        </Routes>
      </MainContent>
    </Container>
  );
}

function App() {
  useEffect(() => {
    runMigration();
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <GlobalStyles />
        <AppLayout />
        <ToastContainer />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

const Container = styled.div`
  display: flex;
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background: var(--color-bg-primary);
  position: relative;

  @supports (-webkit-touch-callout: none) {
    height: -webkit-fill-available;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  min-width: 0;
  overflow: hidden;
`;

const Overlay = styled.div<{ $isVisible: boolean }>`
  display: none;

  ${MEDIA.mobile} {
    display: ${({ $isVisible }) => ($isVisible ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
`;
