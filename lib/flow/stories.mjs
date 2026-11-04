// lib/flow/stories.mjs — read story-bank.md (STAR interview stories).
//
//   ## Short title
//   - Situation: …
//   - Task: …
//   - Action: …
//   - Result: …
//   - Good for: theme, theme

export function parseStories(md) {
  const stories = [];
  let cur = null;
  for (const raw of String(md).replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const line = raw.trim();
    let m;
    if ((m = line.match(/^##\s+(.+)/))) {
      cur = { title: m[1].trim(), situation: '', task: '', action: '', result: '', goodFor: [] };
      stories.push(cur);
    } else if (cur && (m = line.match(/^[-*]\s*\**(situation|task|action|result|good for)\**\s*:\s*(.*)$/i))) {
      const key = m[1].toLowerCase();
      if (key === 'good for') cur.goodFor = m[2].split(/\s*,\s*/).filter(Boolean);
      else cur[key] = m[2].trim();
    }
  }
  return stories;
}
