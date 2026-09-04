// src/shared/useDocumentMeta.js
// SEO para una SPA sin SSR (CRA): no hay react-helmet instalado y no vale
// la pena meter una dependencia nueva solo para esto — actualiza
// document.title, <meta name="description"> y, opcionalmente,
// <meta name="robots"> directamente por DOM. Restaura los valores previos
// al desmontar para que volver a "/" (que ya trae los suyos en
// public/index.html) no se quede con el título de la página anterior.
import { useEffect } from 'react';

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  const previous = tag.getAttribute('content');
  tag.setAttribute('content', content);
  return previous;
}

export function useDocumentMeta({ title, description, noindex = false } = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    const previousDescription = description ? setMeta('description', description) : null;
    const previousRobots = setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    return () => {
      document.title = previousTitle;
      if (description && previousDescription) setMeta('description', previousDescription);
      if (previousRobots) setMeta('robots', previousRobots);
    };
  }, [title, description, noindex]);
}
