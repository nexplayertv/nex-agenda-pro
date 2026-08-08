// Escolhe preto ou branco para texto/icones em cima de uma cor de fundo
// arbitraria (ex.: a cor principal escolhida pela empresa), usando
// luminancia relativa (formula padrao WCAG) para garantir contraste legivel.
export function corContrastante(hex: string): "#ffffff" | "#000000" {
  const limpo = hex.replace("#", "");
  if (limpo.length !== 6) return "#ffffff";

  const r = parseInt(limpo.slice(0, 2), 16) / 255;
  const g = parseInt(limpo.slice(2, 4), 16) / 255;
  const b = parseInt(limpo.slice(4, 6), 16) / 255;

  const canal = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminancia = 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);

  return luminancia > 0.55 ? "#000000" : "#ffffff";
}
