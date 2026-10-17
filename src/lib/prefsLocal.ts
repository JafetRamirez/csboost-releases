// Preferências pequenas do app guardadas no navegador do próprio app.
// Tudo com try/catch: se o armazenamento falhar, o app segue sem o recurso.
const get = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* sem armazenamento */
  }
};

const DAY = 86_400_000;
const MAINT = "csboost.lastMaint";
const STAR = "csboost.starPrompt";

/** Marca que a manutenção foi feita agora (limpeza rodada). */
export const markMaintenance = () => set(MAINT, String(Date.now()));

/** true quando faz mais de 30 dias da última manutenção. Na primeira vez só começa a contar. */
export function maintenanceDue(): boolean {
  const v = Number(get(MAINT));
  if (!v) {
    markMaintenance();
    return false;
  }
  return Date.now() - v > 30 * DAY;
}

/** "Depois": volta a lembrar em 7 dias. */
export const snoozeMaintenance = () => set(MAINT, String(Date.now() - 23 * DAY));

export const starPromptHidden = () => get(STAR) === "hidden";
export const hideStarPrompt = () => set(STAR, "hidden");
