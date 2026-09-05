// src/App.js
// ✅ Console.logs de debug eliminados

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Navbar     from './components/Navbar';
import AmbientStars from './components/AmbientStars';
import CookieConsent from './components/CookieConsent';
import WelcomePromoPopup from './components/WelcomePromoPopup';
import Home       from './components/Home';
import Banner     from './components/Banner';
import Menu       from './components/Menu';
import Ubicaciones from './components/Ubicaciones';
import Footer     from './components/Footer';
import Shop       from './components/Shop';
import PosApp     from './pos/PosApp';
import KitchenApp from './kitchen/KitchenApp';
import AdminApp   from './admin/AdminApp';
import CustomerAuth from './customer/CustomerAuth';
import CustomerProfile from './customer/CustomerProfile';
import Terminos from './components/legal/Terminos';
import Privacidad from './components/legal/Privacidad';
import ErrorBoundary from './shared/ErrorBoundary';

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
  const esPantallaStaff = location.pathname.startsWith('/pos') || location.pathname.startsWith('/cocina') || location.pathname.startsWith('/admin');

  if (esPantallaStaff) return children;

  return (
    <>
      <AmbientStars />
      <Navbar />
      {children}
      <Footer />
      <CookieConsent />
      <WelcomePromoPopup />
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
              <Home />
              <Banner />
              <Menu />
              <Ubicaciones />
            </>
          } />
          <Route path="/shop" element={<Shop />} />
          <Route path="/login" element={<CustomerAuth mode="login" />} />
          <Route path="/registro" element={<CustomerAuth mode="register" />} />
          <Route path="/perfil" element={<ErrorBoundary label="Tu perfil tuvo un problema."><CustomerProfile /></ErrorBoundary>} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/pos" element={<ErrorBoundary label="El POS tuvo un problema."><PosApp /></ErrorBoundary>} />
          <Route path="/cocina" element={<ErrorBoundary label="La pantalla de cocina tuvo un problema."><KitchenApp /></ErrorBoundary>} />
          <Route path="/admin" element={<ErrorBoundary label="El panel admin tuvo un problema."><AdminApp /></ErrorBoundary>} />
        </Routes>
      </SiteChrome>
    </Router>
  );
}

export default App;
