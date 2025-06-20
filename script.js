const addReportBtn = document.getElementById('addReportBtn');
const clearReportsBtn = document.getElementById('clearReportsBtn');
const reportList = document.getElementById('reportList');

function createReportItem(text) {
  const item = document.createElement('div');
  item.className = 'report-item';

  const reportText = document.createElement('div');
  reportText.className = 'report-text';
  reportText.textContent = text;

  const actions = document.createElement('div');
  actions.className = 'report-actions';

  const editBtn = document.createElement('button');
  editBtn.innerHTML = '✏️';
  editBtn.title = 'Düzenle';
  editBtn.onclick = () => {
    const newText = prompt('Raporu düzenle:', reportText.textContent);
    if (newText !== null && newText.trim() !== '') {
      reportText.textContent = newText.trim();
    }
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = 'Sil';
  deleteBtn.onclick = () => {
    if (confirm('Bu raporu silmek istiyor musun?')) {
      reportList.removeChild(item);
    }
  };

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(reportText);
  item.appendChild(actions);

  return item;
}

addReportBtn.onclick = () => {
  const report = prompt('Yeni raporu yazınız:');
  if (report && report.trim() !== '') {
    const newReport = createReportItem(report.trim());
    reportList.appendChild(newReport);
  }
};

clearReportsBtn.onclick = () => {
  if (confirm('Tüm raporları silmek istiyor musunuz?')) {
    reportList.innerHTML = '';
  }
};
