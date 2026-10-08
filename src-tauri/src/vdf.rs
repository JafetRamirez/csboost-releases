//! Leitor mínimo do formato KeyValues (VDF) usado pela Steam.

#[derive(Debug, Clone)]
pub enum Vdf {
    Str(String),
    Obj(Vec<(String, Vdf)>),
}

impl Vdf {
    /// Busca uma chave (sem diferenciar maiúsculas/minúsculas).
    pub fn get(&self, key: &str) -> Option<&Vdf> {
        match self {
            Vdf::Obj(items) => items
                .iter()
                .find(|(k, _)| k.eq_ignore_ascii_case(key))
                .map(|(_, v)| v),
            Vdf::Str(_) => None,
        }
    }

    pub fn path(&self, keys: &[&str]) -> Option<&Vdf> {
        keys.iter().try_fold(self, |node, k| node.get(k))
    }

    pub fn as_str(&self) -> Option<&str> {
        match self {
            Vdf::Str(s) => Some(s),
            Vdf::Obj(_) => None,
        }
    }

    pub fn children(&self) -> &[(String, Vdf)] {
        match self {
            Vdf::Obj(items) => items,
            Vdf::Str(_) => &[],
        }
    }
}

#[derive(Debug, PartialEq)]
enum Tok {
    Str(String),
    Open,
    Close,
}

fn tokenize(src: &str) -> Vec<Tok> {
    let mut out = Vec::new();
    let mut chars = src.chars().peekable();
    while let Some(&c) = chars.peek() {
        match c {
            c if c.is_whitespace() => {
                chars.next();
            }
            '{' => {
                chars.next();
                out.push(Tok::Open);
            }
            '}' => {
                chars.next();
                out.push(Tok::Close);
            }
            '/' => {
                // comentário "//" até o fim da linha
                chars.next();
                if chars.peek() == Some(&'/') {
                    for c in chars.by_ref() {
                        if c == '\n' {
                            break;
                        }
                    }
                }
            }
            '[' => {
                // condicionais como [$WIN32] — ignorados
                for c in chars.by_ref() {
                    if c == ']' {
                        break;
                    }
                }
            }
            '"' => {
                chars.next();
                let mut s = String::new();
                while let Some(c) = chars.next() {
                    match c {
                        '\\' => match chars.next() {
                            Some('n') => s.push('\n'),
                            Some('t') => s.push('\t'),
                            Some(other) => s.push(other),
                            None => break,
                        },
                        '"' => break,
                        _ => s.push(c),
                    }
                }
                out.push(Tok::Str(s));
            }
            _ => {
                let mut s = String::new();
                while let Some(&c) = chars.peek() {
                    if c.is_whitespace() || c == '{' || c == '}' || c == '"' {
                        break;
                    }
                    s.push(c);
                    chars.next();
                }
                out.push(Tok::Str(s));
            }
        }
    }
    out
}

fn parse_items(toks: &[Tok], i: &mut usize) -> Vec<(String, Vdf)> {
    let mut items = Vec::new();
    while *i < toks.len() {
        match &toks[*i] {
            Tok::Close => {
                *i += 1;
                break;
            }
            Tok::Open => {
                // chave ausente: ignora o bloco
                *i += 1;
                parse_items(toks, i);
            }
            Tok::Str(key) => {
                let key = key.clone();
                *i += 1;
                match toks.get(*i) {
                    Some(Tok::Open) => {
                        *i += 1;
                        items.push((key, Vdf::Obj(parse_items(toks, i))));
                    }
                    Some(Tok::Str(v)) => {
                        items.push((key, Vdf::Str(v.clone())));
                        *i += 1;
                    }
                    _ => break,
                }
            }
        }
    }
    items
}

pub fn parse(src: &str) -> Vdf {
    let toks = tokenize(src);
    let mut i = 0;
    Vdf::Obj(parse_items(&toks, &mut i))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_libraryfolders() {
        let src = r#"
"libraryfolders"
{
    "0"
    {
        "path"      "C:\\Program Files (x86)\\Steam"
        "apps" { "730" "123" }
    }
}"#;
        let v = parse(src);
        let path = v
            .path(&["libraryfolders", "0", "path"])
            .and_then(|v| v.as_str());
        assert_eq!(path, Some(r"C:\Program Files (x86)\Steam"));
        assert!(v.path(&["LibraryFolders", "0", "apps", "730"]).is_some());
    }
}
