import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './home/HomePage';
import Footer from './components/Footer';
import Lessons from './pages/Lessons';
import ProtectedRoute from './components/ProtectedRoute';
import LessonPlayer from './pages/LessonPlayer';

import PracticePage from './pages/PracticePage'; 
import PracticeDetail from './pages/PracticeDetail';

function App() {
  return (
    <div className="font-sans min-h-screen bg-warm-cream flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-6 grow">
        <Routes>
          {/* PUBLIC ROUTE: Home Page */}
          <Route path="/" element={<HomePage />} />
          
          {/* PROTECTED ROUTES: Requires Login */}
          <Route element={<ProtectedRoute />}>
            
            {/* 2. Practice Gallery Route */}
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/practice/lesson/:lessonId" element={<PracticeDetail />} />

            {/* Base Lesson Route */}
            <Route path="/lessons" element={<Lessons />} />
            
            {/* NESTED HIERARCHY ROUTES */}
            <Route path="/lessons/:level" element={<Lessons />} />
            <Route path="/lessons/:level/:categoryId" element={<Lessons />} />
            <Route path="/lessons/:level/:categoryId/:topicId" element={<Lessons />} />
            
            <Route path="/lesson/:id" element={<LessonPlayer />} /> 
            
          </Route>
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;