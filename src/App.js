// src/App.js
// ✅ Console.logs de debug eliminados

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Navbar     from './components/Navbar';
import Home       from './components/Home';
import Banner     from './components/Banner';
import Menu       from './components/Menu';
import Ubicaciones from './components/Ubicaciones';
import Footer     from './components/Footer';
import Shop       from './components/Shop';
import PosApp     from './pos/PosApp';
import KitchenApp from './kitchen/KitchenApp';

import './Styles.css';

const ScrollHandler = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.substring(1);
      const elem = document.getElementById(targetId);
      if (elem) {
        setTimeout(() => elem.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  }, [location]);

  return null;
};

// El POS y la pantalla de cocina son pantallas de staff para tablet —
// no llevan el navbar/footer del sitio.
const SiteChrome = ({ children }) => {
  const location = useLocation();
  const esPantallaStaff = location.pathname.startsWith('/pos') || location.pathname.startsWith('/cocina');

  if (esPantallaStaff) return children;

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <ScrollHandler />
      <SiteChrome>
        <Routes>
          <Route path="/" element={
            <>
              <section id="home"><Home /></section>
              <Banner />
              <section id="menu"><Menu /></section>
              <section id="ubicaciones"><Ubicaciones /></section>
            </>
          } />
          <Route path="/shop" element={<Shop />} />
          <Route path="/pos" element={<PosApp />} />
          <Route path="/cocina" element={<KitchenApp />} />
        </Routes>
      </SiteChrome>
    </Router>
  );
}

export default App;