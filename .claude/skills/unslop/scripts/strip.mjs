// Blanks comments (and, unless told otherwise, string contents) so rule
// patterns only see code and markup. Output has the same length and the same
// line breaks as the input, so a match offset maps to the true line number.
//
//   strip(source, lang, { strings = true })
//   lang: "js"   // and ts, tsx, jsx: // and /* */ comments, quoted and template strings
//         "css"  // /* */ comments, quoted strings; with lineComments: true also // (scss, sass, less)
//         "html" // <!-- --> comments; <style> and <script> bodies are stripped as css and js
//
// strings: false keeps string contents. The runner uses it, because class
// names and copy live in strings in JSX and the rules need to read them.

const blank = (text) => text.replace(/[^\r\n]/g, " ")

function quoted(src, start, quote, strings, out) {
  // src[start] is the opening quote. A single or double quote ends at the
  // matching quote or the line end; a backtick may span lines.
  let i = start + 1
  const multiline = quote === "`"
  const keep = (from, to) => {
    out.push(strings ? blank(src.slice(from, to)) : src.slice(from, to))
  }
  out.push(quote)
  let from = i
  while (i < src.length) {
    const c = src[i]
    if (c === "\\") { i += 2; continue }
    if (c === quote) { keep(from, i); out.push(quote); return i + 1 }
    if (c === "\n" && !multiline) { keep(from, i); return i }
    i++
  }
  keep(from, src.length)
  return src.length
}

function stripCode(src, lineComments, strings, backtick = lineComments) {
  const out = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    const next = src[i + 1]
    if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2)
      const stop = end === -1 ? src.length : end + 2
      out.push(blank(src.slice(i, stop)))
      i = stop
    } else if (lineComments && c === "/" && next === "/" && (backtick || src[i - 1] !== ":")) {
      let stop = src.indexOf("\n", i)
      if (stop === -1) stop = src.length
      out.push(blank(src.slice(i, stop)))
      i = stop
    } else if (c === '"' || c === "'" || (backtick && c === "`")) {
      i = quoted(src, i, c, strings, out)
    } else {
      out.push(c)
      i++
    }
  }
  return out.join("")
}

const HTML_PARTS = /(<!--[\s\S]*?(?:-->|$))|<(style|script)\b([^>]*)>([\s\S]*?)(?=<\/\2\s*>|$)/gi

function stripHtml(src, strings) {
  return src.replace(HTML_PARTS, (match, comment, tag, _attrs, body) => {
    if (comment !== undefined) return blank(match)
    const head = match.slice(0, match.length - body.length)
    return head + strip(body, tag.toLowerCase() === "style" ? "css" : "js", { strings })
  })
}

// lineComments: true makes css strip // comments too, for scss, sass and less.
// A // right after a colon stays, so url(http://host) survives.
export function strip(source, lang, { strings = true, lineComments = false } = {}) {
  if (lang === "css") return stripCode(source, lineComments, strings, false)
  if (lang === "html") return stripHtml(source, strings)
  if (lang === "js") return stripCode(source, true, strings)
  throw new Error(`strip: unknown lang ${lang}`)
}
