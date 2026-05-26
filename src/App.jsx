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
      </main>
      <Footer />
    </div>
  );
}

export default App;