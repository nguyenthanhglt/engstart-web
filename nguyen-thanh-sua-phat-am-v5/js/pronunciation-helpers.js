/* Target spelling and pronunciation content only. No course state is stored here. */
(() => {
  'use strict';
  const data = window.NT_IPA_CONTENT;
  const normal = value => String(value || '').replace(/\//g, '').replace(/ɡ/g, 'g').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = (symbol, word) => normal(symbol) + '\u0000' + String(word || '').toLowerCase();
  const records = new Map(data.records.map(record => [key(record.sym, record.word), record]));
  const primary = new Map();
  for (const record of data.records) if (!primary.has(normal(record.sym))) primary.set(normal(record.sym), record);
  const suffix = accent => accent === 'en-US' ? 'US' : 'UK';

  function target(symbol, word, accent = 'en-GB') {
    const record = word ? records.get(key(symbol, word)) : primary.get(normal(symbol));
    if (!record) return null;
    const a = suffix(accent);
    return {record, word:word || record.word, ranges:record['focus'+a] || record.focusUK,
      ipa:record['targetIPA'+a], id:record['audioId'+a], wordIPA:record['ipa'+a] || ''};
  }

  function highlight(symbol, word, accent = 'en-GB') {
    const found = target(symbol, word, accent);
    if (!found) return esc(word);
    let output = '', cursor = 0;
    for (const [start,end] of found.ranges) {
      output += esc(word.slice(cursor,start)) + '<span class="nt-ipa-target">' + esc(word.slice(start,end)) + '</span>';
      cursor = end;
    }
    return output + esc(word.slice(cursor));
  }

  function wordIPA(word, accent = 'en-GB') { return data.wordIPA[String(word || '').toLowerCase()]?.[suffix(accent)] || ''; }
  function guide(symbol, accent = 'en-GB') {
    const raw = data.guides[normal(symbol)];
    if (!raw) return null;
    const a = suffix(accent);
    return {...raw, ipa:raw['ipa'+a], tip:raw['tip'+a], steps:raw['steps'+a], mistake:raw['mistake'+a]};
  }
  function symbol(symbol, accent = 'en-GB', word) { return target(symbol,word,accent)?.ipa || normal(symbol).replace(/^-/, ''); }
  function tileSymbol(sym, accent = 'en-GB', word) { return normal(sym).startsWith('-') ? normal(sym) : symbol(sym,accent,word); }

  function exampleHTML(sym, word, accent = 'en-GB', options = {}) {
    const found = target(sym,word,accent);
    const text = highlight(sym,word,accent);
    const ipa = found?.wordIPA || wordIPA(word,accent);
    const sound = found?.id ? `<button type="button" data-speak-phoneme="${esc(normal(sym))}" data-ipa-context="${esc(word)}" class="nt-ipa-button" aria-label="Nghe phần gạch chân trong ${esc(word)}: /${esc(found.ipa)}/">/${esc(found.ipa)}/</button>` : '';
    const slow = options.slow ? `<button type="button" data-ipa-word="${esc(word)}" data-ipa-rate="0.65" class="nt-ipa-button" aria-label="Nghe chậm cả từ ${esc(word)}">Cả từ chậm</button>` : '';
    const meaning = options.meaning ? `<small>${esc(options.meaning)}</small>` : '';
    return `<div class="nt-ipa-example"><div><strong>${text}</strong>${ipa?`<small>${esc(ipa)}</small>`:''}${meaning}</div><div class="nt-ipa-example-actions">${sound}<button type="button" data-ipa-word="${esc(word)}" class="nt-ipa-button" aria-label="Nghe cả từ ${esc(word)}">Cả từ</button>${slow}</div></div>`;
  }

  function ruleHTML(sym, accent = 'en-GB') {
    const info = data.suffixExamples[normal(sym)];
    const raw = data.guides[normal(sym)];
    const rules = info?.rules?.length ? info.rules : raw?.rules || [];
    if (!rules.length) return '';
    const title = normal(sym) === '-s' ? 'Phân biệt âm cuối /s/ và quy tắc đuôi -s/-es' : 'Quy tắc âm cuối';
    return `<section class="nt-ipa-rules"><h3>${title}</h3>${rules.map(rule=>`<p><strong>${esc(rule.label)}</strong> ${esc(rule.text)}${rule.example?`<small>${esc(rule.example)}</small>`:''}</p>`).join('')}${info?`<div class="nt-ipa-examples">${info.words.map(word=>exampleHTML(sym,word,accent)).join('')}</div>`:''}</section>`;
  }

  window.NTPronunciation = {normal, esc, target, highlight, wordIPA, guide, symbol, tileSymbol, exampleHTML, ruleHTML};
})();
