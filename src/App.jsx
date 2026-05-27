import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const HomePage = lazy(() => import('./home/HomePage'));
const Lessons = lazy(() => import('./pages/Lessons'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const LessonPlayer = lazy(() => import('./pages/LessonPlayer'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const PracticeDetail = lazy(() => import('./pages/PracticeDetail'));

function App() {
  return (
    <div className="font-sans min-h-screen bg-warm-cream flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-6 grow">
        <Suspense fallback={<div className="text-center py-10 text-xl font-semibold">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/lesson/:subLessonId" element={<PracticeDetail />} />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/lessons/:categoryId" element={<Lessons />} />
              <Route path="/lessons/:categoryId/:topicId" element={<Lessons />} />
              <Route path="/lessons/:categoryId/:topicId/:lessonId" element={<Lessons />} />
              <Route path="/sentence/:subLessonId" element={<LessonPlayer />} /> 
            </Route>
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;