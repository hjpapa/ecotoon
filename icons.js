// Decorative, locally embedded SVGs always accompany visible text labels.
window.EcoIcons = function(name) {
 const paths = {
  book:'M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3z M12 6v15',
  economy:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M15 8h-5a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H9 M12 6v12',
  labor:'M3 8h18v12H3z M8 8V4h8v4 M3 12h18 M10 12v3h4v-3',
  finance:'M3 8l9-5 9 5z M5 10v8 M10 10v8 M14 10v8 M19 10v8 M3 21h18',
  arrow:'M5 12h14 M13 6l6 6-6 6',
  check:'M4 12l5 5L20 6',
  circle:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18'
 };
 return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+(paths[name]||paths.book)+'"></path></svg>';
};
document.querySelectorAll('[data-icon]').forEach(slot=>slot.innerHTML=window.EcoIcons(slot.dataset.icon));
