<script>
  let { name, size = 20 } = $props();
  const paths = {
    cloud: 'M6 18a5 5 0 0 1-1-9.9 7 7 0 0 1 13.5 1.4A4.3 4.3 0 0 1 18 18H6Z',
    computer: 'M3 4h18v13H3z M8 21h8 M12 17v4',
    web: 'M3 4h18v16H3z M3 9h18 M7 6.5h.01 M10 6.5h.01',
    mobile: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z M10 5h4 M11 19h2',
    arrow: 'M12 19V5 M6 11l6-6 6 6',
    down: 'M12 5v14 M6 13l6 6 6-6',
    plus: 'M12 5v14 M5 12h14',
    close: 'M6 6l12 12 M18 6 6 18',
    refresh: 'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 3 M5 15a8 8 0 0 0 13 3',
    external: 'M14 3h7v7 M21 3 10 14 M10 4H4v16h16v-6',
    copy: 'M8 8h12v13H8z M16 8V3H3v13h5',
    check: 'M5 12l4 4L19 6',
    chat: 'M4 4h16v12H9l-5 4V4Z',
    grip: 'M8 5h.01 M16 5h.01 M8 12h.01 M16 12h.01 M8 19h.01 M16 19h.01',
    note: 'M4 3h16v14l-4 4H4V3Z M8 8h8 M8 12h8 M8 16h4',
    stop: 'M6 6h12v12H6z',
    github: 'M9 19c-4 1-4-2-6-2 M15 22v-4a3.5 3.5 0 0 0-1-2.5c3.3-.4 6.7-1.6 6.7-7A5.4 5.4 0 0 0 19.2 5c.2-.9.2-2-.2-3-1.5 0-3 1-3.5 1.5a13 13 0 0 0-7 0C8 3 6.5 2 5 2c-.4 1-.4 2.1-.2 3A5.4 5.4 0 0 0 3.3 8.5c0 5.4 3.4 6.6 6.7 7A3.5 3.5 0 0 0 9 18v4'
  };
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
