// Local file usage still works; service workers require HTTPS or localhost.
if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(error => {
      console.warn('オフライン機能を有効にできませんでした。', error);
    });
  });
}
