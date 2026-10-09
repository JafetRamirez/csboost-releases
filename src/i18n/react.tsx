import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { getLang, setLangValue, type Lang } from ".";

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "pt", setLang: () => {} });

// Troca de idioma remonta a árvore (key) para tudo ser redesenhado e os dados
// do núcleo serem recarregados no idioma novo.
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setState] = useState<Lang>(getLang());
  const setLang = useCallback((l: Lang) => {
    setLangValue(l);
    setState(l);
  }, []);
  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <div key={lang} className="contents">
        {children}
      </div>
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}
