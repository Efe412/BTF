const addReportBtn = document.getElementById('addReportBtn');
const clearReportsBtn = document.getElementById('clearReportsBtn');
const reportList = document.getElementById('reportList');
const modal = document.getElementById('modal');
const reportForm = document.getElementById('reportForm');
const cancelBtn = document.getElementById('cancelBtn');

let reportCount = 0;

function createReportItem(data) {
  const item = document.createElement('div');
  item.className = 'report-item';

  const textDiv = document.createElement('div');
  textDiv.className = 'report-text';
  textDiv.innerHTML = `
    <p><strong>Roblox İsim:</strong> ${data.robloxName}</p>
    <p><strong>DC İsim:</strong> ${data.dcName}</p>
    <p><strong>Kaçıncı Raporum:</strong> ${data.reportNumber}</p>
    <p><strong>İcraatler:</strong> ${data.actions}</p>
    <p><strong>Yaptığım Etkinlik Sayısı:</strong> ${data.eventCount}</p>
    <p><strong>Gün İçerisinde Aktiflik Süresi:</strong> ${data.activeTime}</p>
    <p><strong>Bulunduğum Birim:</strong> ${data.unit}</p>
    <p><strong>Kanıt/SS:</strong> ${data.proof}</p>
    <p><strong>Tarih:</strong> ${data.date}</p>
  `;

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'report-actions';

  const editBtn = document.createElement('button');
  editBtn.innerHTML = '✏️';
  editBtn.title = 'Düzenle';
  editBtn.onclick = () => {
    openEditModal(item, data);
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.title = 'Sil';
  deleteBtn.onclick = () => {
    if (confirm('Bu raporu silmek istiyor musun?')) {
      reportList.removeChild(item);
    }
  };

  actionsDiv.appendChild(editBtn);
  actionsDiv.appendChild(deleteBtn);

  item.appendChild(textDiv);
  item.appendChild(actionsDiv);

  return item;
}

function openEditModal(item, oldData) {
  modal.style.display = 'flex';
  reportForm.robloxName.value = oldData.robloxName;
  reportForm.dcName.value = oldData.dcName;
  reportForm.reportNumber.value = oldData.reportNumber;
  reportForm.actions.value = oldData.actions;
  reportForm.eventCount.value = oldData.eventCount;
  reportForm.activeTime.value = oldData.activeTime;
  reportForm.unit.value = oldData.unit;
  reportForm.proof.value = oldData.proof;
  reportForm.date.value = oldData.date;

  reportForm.onsubmit = (e) => {
    e.preventDefault();

    const newData = {
      robloxName: reportForm.robloxName.value.trim(),
      dcName: reportForm.dcName.value.trim(),
      reportNumber: reportForm.reportNumber.value.trim(),
      actions: reportForm.actions.value.trim(),
      eventCount: reportForm.eventCount.value.trim(),
      activeTime: reportForm.activeTime.value.trim(),
      unit: reportForm.unit.value.trim(),
      proof: reportForm.proof.value.trim(),
      date: reportForm.date.value.trim(),
    };

    const newItem = createReportItem(newData);
    reportList.replaceChild(newItem, item);
    modal.style.display = 'none';
    reportForm.reset();
  };
}

addReportBtn.onclick = () => {
  modal.style.display = 'flex';
  reportForm.reset();

  reportForm.onsubmit = (e) => {
    e.preventDefault();

    const data = {
      robloxName: reportForm.robloxName.value.trim(),
      dcName: reportForm.dcName.value.trim(),
      reportNumber: reportForm.reportNumber.value.trim(),
      actions: reportForm.actions.value.trim(),
      eventCount: reportForm.eventCount.value.trim(),
      activeTime: reportForm.activeTime.value.trim(),
      unit: reportForm.unit.value.trim(),
      proof: reportForm.proof.value.trim(),
      date: reportForm.date.value.trim(),
    };

    const newReport = createReportItem(data);
    reportList.appendChild(newReport);
    modal.style.display = 'none';
    reportForm.reset();
  };
};

cancelBtn.onclick = () => {
  modal.style.display = 'none';
};
