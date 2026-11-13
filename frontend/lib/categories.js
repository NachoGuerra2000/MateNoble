// Categorías de productos, en el orden en que se muestran
export const CATEGORIES = [
  { value: 'calabaza', label: 'Calabaza', heading: 'Mates de calabaza' },
  { value: 'algarrobo', label: 'Algarrobo', heading: 'Mates de algarrobo' },
  { value: 'madera', label: 'Madera', heading: 'Mates de madera' },
  { value: 'acero', label: 'Acero', heading: 'Mates de acero' },
  { value: 'materas', label: 'Materas', heading: 'Materas' },
  { value: 'bolsos', label: 'Bolsos', heading: 'Bolsos' },
  { value: 'bombillas', label: 'Bombillas', heading: 'Bombillas' },
  { value: 'bombillones', label: 'Bombillones', heading: 'Bombillones' },
  { value: 'combos', label: 'Combos', heading: 'Combos' },
  { value: 'otros', label: 'Otros', heading: 'Otros' },
];

export const CATEGORY_ORDER = Object.fromEntries(CATEGORIES.map((c, i) => [c.value, i]));
export const CATEGORY_HEADING = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.heading]));
