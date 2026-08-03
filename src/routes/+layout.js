// Prerender every route to flat HTML by default. Auth and billing work stays
// inside onMount, so those routes still ship a real branded HTML shell while
// browser-only work waits for hydration.
export const prerender = true;
