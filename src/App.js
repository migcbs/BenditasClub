import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Importa tus componentes de la aplicación
import Navbar from './components/Navbar';
import Home from './components/Home';
import Banner from "./components/Banner";
import Menu from './components/Menu';
import Ubicaciones from './components/Ubicaciones';
import Footer from './components/Footer';
import Shop from './components/Shop';

import './Styles.css'; // Archivo de estilos global

// Nuevo componente para manejar la lógica de scroll con useLocation
const ScrollHandler = () => {
  const location = useLocation(); // Ahora useLocation está dentro del contexto del Router

  useEffect(() => {
    // Mensajes de depuración para la consola
    console.log("ScrollHandler: URL Location cambió:", location);
    console.log("ScrollHandler: Hash actual:", location.hash);

    if (location.hash) {
      const targetId = location.hash.substring(1); // Obtiene el ID del hash
      console.log("ScrollHandler: Intentando encontrar elemento con ID:", targetId);
      let elem = document.getElementById(targetId);

      if (elem) {
        console.log("ScrollHandler: ¡Elemento encontrado!", elem);
        // Usa setTimeout para asegurar que el DOM esté completamente renderizado
        setTimeout(() => {
          elem.scrollIntoView({ behavior: 'smooth' });
          console.log("ScrollHandler: Scroll ejecutado para:", targetId);
        }, 100); // Pequeño retraso de 100ms
      } else {
        console.log("ScrollHandler: ¡Elemento NO encontrado con ID:", targetId, "!");
      }
    } else {
      // Si no hay hash, desplaza al inicio de la página (ej. al cargar la página por primera vez)
      console.log("ScrollHandler: No hay hash, desplazando al inicio de la página.");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [location]); // El efecto se vuelve a ejecutar cada vez que la 'location' cambia

  return null; // Este componente no renderiza nada visible, solo maneja la lógica
};


function App() {
  // Mensaje de depuración para confirmar que el componente App se está renderizando
  console.log("¡El componente App se está renderizando!");

  return (
    <Router> {/* Envuelve toda la aplicación con BrowserRouter para habilitar el enrutamiento */}
      <ScrollHandler /> {/* Coloca el ScrollHandler DENTRO del Router */}
      <Navbar /> {/* El Navbar se renderiza en todas las rutas */}
      <Routes> {/* Define las diferentes rutas de la aplicación */}
        {/* Ruta principal para la página de inicio con secciones de scroll */}
        <Route path="/" element={
          <>
            {/* Es CRUCIAL que cada sección tenga un ID que coincida con los enlaces del Navbar */}
            <section id="home"> {/* ID para la sección Home */}
              <Home />
            </section>
            <Banner /> {/* El Banner no necesita un ID si no se va a navegar directamente a él */}
            <section id="menu"> {/* ID para la sección Menú */}
              <Menu />
            </section>
            <section id="ubicaciones"> {/* ID para la sección Ubicaciones */}
              <Ubicaciones />
            </section>
          </>
        } />
        {/* Ruta dedicada para la página de Shop */}
        <Route path="/shop" element={<Shop />} />
        {/* Puedes añadir más rutas aquí si lo necesitas en el futuro */}
      </Routes>
      <Footer /> {/* El Footer se renderiza en todas las rutas */}
    </Router>
  );
}

export default App;