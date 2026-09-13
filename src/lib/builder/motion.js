export function canRunMotion({ isVisible, isDocumentVisible, isReduced }) {
  return isVisible && isDocumentVisible && !isReduced;
}

export function observeMotion(element, onchange) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let isVisible = false;
  function update() {
    const state = { isVisible, isDocumentVisible: !document.hidden, isReduced: preference.matches };
    onchange({ ...state, canAnimate: canRunMotion(state) });
  }
  const observer = new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; update(); });
  observer.observe(element);
  preference.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  update();
  return () => {
    observer.disconnect();
    preference.removeEventListener('change', update);
    document.removeEventListener('visibilitychange', update);
  };
}
