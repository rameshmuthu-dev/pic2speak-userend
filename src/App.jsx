import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdventureMap from './pages/AdventureMap';

const HomePage = lazy(() => import('./home/HomePage'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const SentenceList = lazy(() => import('./pages/SentenceList'));

function App() {
  const location = useLocation();
  const isFullscreenPage =
    location.pathname === '/adventure-map' ||
    location.pathname.startsWith('/sentence-list/');

  return (
    <div className="font-sans min-h-screen w-full max-w-full overflow-x-hidden bg-warm-cream flex flex-col">
      <Navbar />
      <main className={isFullscreenPage ? 'grow flex flex-col min-h-0 w-full' : 'container mx-auto px-4 py-6 grow w-full max-w-full overflow-x-hidden'}>
        <Suspense fallback={<div className="text-center py-10 text-xl font-semibold">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/adventure-map" element={<AdventureMap />} />
              <Route path="/sentence-list/:lessonMasterId" element={<SentenceList />} />
            </Route>
          </Routes>
        </Suspense>
      </main>
      {!isFullscreenPage && <Footer />}
    </div>
  );
}

export default App;