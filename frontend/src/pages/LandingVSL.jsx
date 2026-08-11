import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import VideoSection from '../components/VideoSection.jsx';
import ClientsSection from '../components/ClientsSection.jsx';
import Footer from '../components/Footer.jsx';
import QuizPopup from '../components/QuizPopup.jsx';
import { captureUtms } from '../utils/utm.js';

export default function LandingVSL() {
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  useEffect(() => {
    captureUtms();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <Header />
      <Hero />
      <VideoSection onPlayClick={() => setIsQuizOpen(true)} />
      <ClientsSection />
      <Footer />
      {isQuizOpen && <QuizPopup onClose={() => setIsQuizOpen(false)} />}
    </div>
  );
}
