/**
 * Clases compartidas por los 3 dot-nav del sitio (ScrollDotNav, YearDotNav,
 * ProjectDetailNav): mismo contenedor lateral fijo en desktop y misma barra
 * fija inferior en mobile, para que los 3 se vean/comporten igual aunque
 * cada uno navegue contenido distinto (secciones/años/anterior-siguiente).
 */

export const NAV_RAIL_DESKTOP =
  "fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 md:left-6 md:flex";

export const NAV_RAIL_LIST = "flex flex-col gap-4";

/**
 * Envuelve `NAV_RAIL_LIST` en desktop: el contenedor visible que recibe el
 * borde animado (`.nav-rail-glow`, ver `global.css`). No existía un
 * contenedor propio antes de `037` — el riel eran solo botones flotantes.
 */
export const NAV_RAIL_FRAME = "nav-rail-glow rounded-full p-3";

/**
 * Nav mobile: solo posiciona (fijo abajo, centrado) — sin fondo/borde propio,
 * para que la barra visible sea el `<ul>` (NAV_BAR_MOBILE_LIST), una píldora
 * flotante separada del borde de la pantalla en vez de una franja de punta a
 * punta.
 */
export const NAV_BAR_MOBILE =
  "fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 md:hidden [padding-bottom:max(1rem,env(safe-area-inset-bottom))]";

/**
 * La píldora flotante en sí: fondo, borde, sombra y esquinas redondeadas.
 * `nav-rail-glow` le agrega el mismo borde animado del riel desktop (`037`).
 */
export const NAV_BAR_MOBILE_LIST =
  "nav-rail-glow flex items-center gap-1 rounded-full border border-border/60 bg-surface/90 px-2 py-1 shadow-lg shadow-black/40 backdrop-blur";

/** Envoltorio de área táctil ≥44px sin agrandar el punto/ícono visible. */
export const NAV_ITEM_HIT_AREA = "flex h-11 w-11 items-center justify-center";
