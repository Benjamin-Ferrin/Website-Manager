document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('add-menu-item');
  const container = document.getElementById('menu-items');

  if (addBtn && container) {
    addBtn.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'menu-row';
      row.innerHTML = `
        <input type="text" name="label" placeholder="Label">
        <input type="text" name="url" placeholder="URL (/about)">
        <button type="button" class="remove-row">Remove</button>
      `;
      container.appendChild(row);
    });

    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-row')) {
        e.target.closest('.menu-row')?.remove();
      }
    });
  }
});

async function apiUpdateContent(businessId, pageId, content, csrfToken) {
  const res = await fetch('/api/content/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ businessId, pageId, content }),
  });
  return res.json();
}

async function apiUpload(businessId, file, csrfToken) {
  const form = new FormData();
  form.append('businessId', businessId);
  form.append('file', file);
  form.append('_csrf', csrfToken);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: form,
  });
  return res.json();
}

window.platformAdmin = { apiUpdateContent, apiUpload };
