export function selectAnswers(rows, selected = '') {
 const active = rows.filter(row => !row.deleted);
 const counts = new Map();
 for (const row of active) counts.set(row.label, (counts.get(row.label) || 0) + 1);
 // Keep a selected category even when its last answer is retracted.
 if (selected && !counts.has(selected)) counts.set(selected, 0);
 return {
  total: active.length,
  categories: [...counts].sort(([a], [b]) => a.localeCompare(b, 'ja')),
  visible: selected ? active.filter(row => row.label === selected) : active
 };
}

export function createAnswerView(root = document) {
 const $ = id => root.getElementById(id);
 const filter = $('hazardFilter');
 let rows = [], devices = 0;
 function render() {
  const selected = filter.value;
  const view = selectAnswers(rows, selected);
  filter.replaceChildren();
  for (const [value, label] of [['', `すべての種類（${view.total}件）`], ...view.categories.map(([label, count]) => [label, `${label}（${count}件）`])]) {
   const option = root.createElement('option');
   option.value = value; option.textContent = label; filter.append(option);
  }
  filter.value = selected;
  $('rows').replaceChildren();
  for (const row of view.visible) {
   const tr = root.createElement('tr');
   for (const text of [row.classroom + ' ' + row.number + '番', row.label + ' ／ ' + row.place, row.reason, row.improvement]) {
    const td = root.createElement('td'); td.textContent = text.slice(0, 1200); tr.append(td);
   }
   $('rows').append(tr);
  }
  $('count').textContent = selected
   ? `${selected}：${view.visible.length}件を表示 ／ 全${view.total}件・${devices}端末`
   : `${devices}端末 ／ ${view.total}件の指摘`;
  $('empty').hidden = view.visible.length > 0;
  $('empty').textContent = selected ? 'この種類の回答はまだありません。' : '回答を待っています。';
 }
 filter.onchange = render;
 return {
  update(nextRows, deviceCount) { rows = nextRows; devices = deviceCount; render(); },
  reset() { filter.value = ''; rows = []; devices = 0; render(); }
 };
}
