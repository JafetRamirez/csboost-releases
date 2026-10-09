//! Idioma dos textos que o núcleo gera (Raio-X, conferência, limpeza,
//! mensagens de erro). A interface escolhe com `set_language`; o padrão é pt.

use std::sync::atomic::{AtomicU8, Ordering};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Lang {
    Pt,
    Es,
    En,
}

static LANG: AtomicU8 = AtomicU8::new(0);

pub fn set(code: &str) {
    let v = match code {
        "es" => 1,
        "en" => 2,
        _ => 0,
    };
    LANG.store(v, Ordering::Relaxed);
}

pub fn lang() -> Lang {
    match LANG.load(Ordering::Relaxed) {
        1 => Lang::Es,
        2 => Lang::En,
        _ => Lang::Pt,
    }
}

pub fn code() -> &'static str {
    match lang() {
        Lang::Pt => "pt",
        Lang::Es => "es",
        Lang::En => "en",
    }
}

/// Texto nos três idiomas, na ordem pt, es, en. Aceita `{var}` e `{}` como
/// o `format!`.
#[macro_export]
macro_rules! tr {
    ($pt:literal, $es:literal, $en:literal $(, $arg:expr)* $(,)?) => {
        match $crate::i18n::lang() {
            $crate::i18n::Lang::Pt => format!($pt $(, $arg)*),
            $crate::i18n::Lang::Es => format!($es $(, $arg)*),
            $crate::i18n::Lang::En => format!($en $(, $arg)*),
        }
    };
}
