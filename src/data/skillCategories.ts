import skillCategoriesJson from "./skillCategories.json";

/**
 * Lista editable de categorías de habilidad (073, paso 2) — reemplaza el union type fijo
 * `"lenguajes" | "herramientas" | "diseño" | "frameworks"` que tenía `SkillCategory` en
 * `skillsPages.ts`. Editable desde `/admin/contenido` → "Habilidades" → panel lateral
 * "Categorías" (`SkillCategoriesPanel.tsx`). Si una skill guarda un valor que ya no está en esta
 * lista (categoría borrada/renombrada), el dato de esa skill no se pierde ni se modifica solo —
 * el `<select>` del panel simplemente no la muestra como opción hasta que se elija otra.
 */
export const skillCategories: string[] = skillCategoriesJson as string[];
