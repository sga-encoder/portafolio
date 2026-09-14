/**
 * Interacción "mantener presionado para previsualizar, soltar para navegar"
 * de la barra mobile de los 3 dot-nav (037). Solo actúa sobre eventos de
 * puntero táctiles (`pointerType === "touch"`) — con mouse/teclado el click
 * normal sigue navegando de inmediato, sin pasar por aquí.
 *
 * `preventDefault()` en `pointerdown` evita que el navegador dispare el
 * click de compatibilidad al soltar (comportamiento estándar de Pointer
 * Events), así que la navegación queda 100% controlada por `onNavigate`.
 *
 * Delegado sobre el `<ul>` contenedor: cada botón/link marca su id de
 * destino con `data-hold-nav`, y el `<li>` que lo envuelve (con clase
 * `group`) recibe `is-pressed` mientras está sostenido, para reusar el
 * mismo label de `.scroll-dot-label` que ya usa el hover de desktop.
 */
export function attachHoldToNavigate(list: HTMLElement, onNavigate: (id: string) => void) {
  let pressedButton: HTMLElement | null = null;

  const findButton = (target: EventTarget | null) =>
    target instanceof Element ? target.closest<HTMLElement>("[data-hold-nav]") : null;

  const setPressed = (button: HTMLElement | null, pressed: boolean) => {
    button?.closest("li")?.classList.toggle("is-pressed", pressed);
  };

  const clear = () => {
    setPressed(pressedButton, false);
    pressedButton = null;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    const button = findButton(event.target);
    if (!button) return;
    pressedButton = button;
    setPressed(button, true);
    event.preventDefault();
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== "touch" || !pressedButton) return;
    const button = pressedButton;
    const rect = button.getBoundingClientRect();
    const insideButton =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    clear();
    if (insideButton && button.dataset.holdNav) {
      onNavigate(button.dataset.holdNav);
    }
  };

  list.addEventListener("pointerdown", onPointerDown);
  list.addEventListener("pointerup", onPointerUp);
  list.addEventListener("pointercancel", clear);

  return () => {
    list.removeEventListener("pointerdown", onPointerDown);
    list.removeEventListener("pointerup", onPointerUp);
    list.removeEventListener("pointercancel", clear);
  };
}
