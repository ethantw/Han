/**
 * markdown-it plugin: assign an `id` to every heading and collect the
 * H2/H3 list into `env.headings` so the page renderer can emit a
 * "On this page" sidebar.
 *
 * Slug strategy: trim → ASCII punct stripped → spaces → dashes →
 * lowercase ASCII (CJK and other non-ASCII left as-is). Duplicates are
 * disambiguated by appending `-2`, `-3`…
 */

const SLUG_DROP = /[!"#$%&'()*+,./:;<=>?@\[\]^`{|}~]/g

function slugify(text) {
  let s = text.trim().replace(SLUG_DROP, '').replace(/\s+/g, '-')
  // Lowercase only the ASCII portion so Latin/digit headings stay
  // consistent without mangling CJK.
  s = s.replace(/[A-Z]/g, c => c.toLowerCase())
  return s
}

export function headings(md) {
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const open = tokens[idx]
    const level = +open.tag.slice(1)               // 'h2' → 2
    const inline = tokens[idx + 1]
    const text = inline ? inline.content : ''
    const used = (env.usedSlugs ??= new Map())

    let slug = slugify(text)
    if (used.has(slug)) {
      const n = used.get(slug) + 1
      used.set(slug, n)
      slug = `${slug}-${n}`
    } else {
      used.set(slug, 1)
    }
    open.attrSet('id', slug)

    if (level === 2 || level === 3) {
      ;(env.headings ??= []).push({ level, text, slug })
    }
    return self.renderToken(tokens, idx, options)
  }
}

/**
 * Render the "On this page" aside from a list of `{ level, text, slug }`
 * collected during markdown rendering. Returns empty string if nothing
 * to show.
 */
export function renderPageToc(headings, label) {
  if (!headings || headings.length === 0) return ''
  const items = headings.map(h => {
    const lvl = h.level === 3 ? ' data-level="3"' : ''
    return `<li${lvl}><a href="#${encodeURIComponent(h.slug)}">${escapeHtml(h.text)}</a></li>`
  }).join('')
  return `<aside class="PageToc" aria-label="${escapeHtml(label)}"><h2>${escapeHtml(label)}</h2><ol>${items}</ol></aside>`
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}
