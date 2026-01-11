(function(){
  console.log('[Email.js] Initializing...');
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const configEls = {
    provider: $('#cfg-provider'), host: $('#cfg-host'), port: $('#cfg-port'), encryption: $('#cfg-encryption'),
    username: $('#cfg-username'), password: $('#cfg-password'), fromName: $('#cfg-fromName'), fromEmail: $('#cfg-fromEmail'),
    replyTo: $('#cfg-replyTo'), enabled: $('#cfg-enabled'), paused: $('#cfg-paused'), status: $('#config-status'),
    testEmail: $('#test-email'),
    btnLoad: $('#btn-load-config'), btnSave: $('#btn-save-config'), btnTest: $('#btn-send-test')
  };

  const tplEls = {
    tableBody: $('#templates-table tbody'),
    btnRefresh: $('#btn-refresh-templates'),
    btnNew: $('#btn-new-template'),
    dialog: $('#template-dialog'),
    key: $('#tpl-key'), subject: $('#tpl-subject'), html: $('#tpl-html'), text: $('#tpl-text'), placeholders: $('#tpl-placeholders'), active: $('#tpl-active'),
    btnCancel: $('#tpl-cancel'), btnSave: $('#tpl-save'), status: $('#tpl-status')
  };

  const logsEls = {
    tableBody: $('#logs-table tbody'),
    btnRefresh: $('#btn-refresh-logs')
  };

  function setStatus(el, msg, isErr=false) {
    el.textContent = msg || '';
    el.className = 'status' + (isErr ? ' error' : '');
  }

  async function loadConfig() {
    try {
      console.log('[loadConfig] Fetching email config...');
      const cfg = await apiService.getEmailConfig();
      console.log('[loadConfig] Config:', cfg);
      if (!cfg) return;
      configEls.provider.value = cfg.provider || 'SMTP';
      configEls.host.value = cfg.host || '';
      configEls.port.value = cfg.port || '';
      configEls.encryption.value = (cfg.encryption || 'TLS').toUpperCase();
      configEls.username.value = cfg.username || '';
      configEls.password.value = '';
      configEls.fromName.value = cfg.fromName || '';
      configEls.fromEmail.value = cfg.fromEmail || '';
      configEls.replyTo.value = cfg.replyTo || '';
      configEls.enabled.checked = !!cfg.enabled;
      configEls.paused.checked = !!cfg.paused;
      setStatus(configEls.status, 'Loaded.');
    } catch (e) {
      setStatus(configEls.status, e.message || 'Failed to load config', true);
    }
  }

  async function saveConfig() {
    setStatus(configEls.status, 'Saving...');
    try {
      const payload = {
        provider: configEls.provider.value || 'SMTP',
        host: configEls.host.value,
        port: Number(configEls.port.value || 0),
        username: configEls.username.value,
        password: configEls.password.value || null,
        encryption: configEls.encryption.value,
        fromName: configEls.fromName.value,
        fromEmail: configEls.fromEmail.value,
        replyTo: configEls.replyTo.value || null,
        enabled: configEls.enabled.checked,
        paused: configEls.paused.checked
      };
      await apiService.upsertEmailConfig(payload);
      setStatus(configEls.status, 'Saved.');
      configEls.password.value = '';
    } catch (e) {
      setStatus(configEls.status, e.message || 'Save failed', true);
    }
  }

  async function sendTest() {
    const to = configEls.testEmail.value.trim();
    if (!to) return setStatus(configEls.status, 'Enter test recipient email', true);
    setStatus(configEls.status, 'Sending test...');
    try {
      await apiService.sendTestEmail(to);
      setStatus(configEls.status, 'Test email sent.');
    } catch (e) {
      setStatus(configEls.status, e.message || 'Test send failed', true);
    }
  }

  function renderTemplates(list) {
    tplEls.tableBody.innerHTML = '';
    for (const t of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.templateKey}</td>
        <td>${escapeHtml(t.subject || '')}</td>
        <td>${t.active ? 'Yes' : 'No'}</td>
        <td>${t.updatedAt ? new Date(t.updatedAt).toLocaleString() : ''}</td>
      `;
      tr.addEventListener('click', () => openTemplateEditor(t));
      tplEls.tableBody.appendChild(tr);
    }
  }

  async function loadTemplates() {
    try {
      const list = await apiService.listEmailTemplates();
      renderTemplates(list || []);
    } catch (e) {
      tplEls.tableBody.innerHTML = `<tr><td colspan="4">Failed to load templates: ${escapeHtml(e.message || '')}</td></tr>`;
    }
  }

  function openTemplateEditor(tpl) {
    tplEls.status.textContent = '';
    if (tpl) {
      tplEls.key.value = tpl.templateKey;
      tplEls.subject.value = tpl.subject || '';
      tplEls.html.value = tpl.htmlBody || '';
      tplEls.text.value = tpl.textBody || '';
      tplEls.placeholders.value = parsePlaceholders(tpl.placeholdersJson).join(', ');
      tplEls.active.checked = !!tpl.active;
    } else {
      tplEls.key.value = 'PASSWORD_RESET';
      tplEls.subject.value = '';
      tplEls.html.value = '';
      tplEls.text.value = '';
      tplEls.placeholders.value = '';
      tplEls.active.checked = true;
    }
    tplEls.dialog.showModal();
  }

  function parsePlaceholders(json) {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  function splitPlaceholders(str) {
    return (str || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => !!s);
  }

  async function saveTemplate() {
    setStatus(tplEls.status, 'Saving...');
    try {
      const payload = {
        templateKey: tplEls.key.value,
        subject: tplEls.subject.value,
        htmlBody: tplEls.html.value,
        textBody: tplEls.text.value || null,
        placeholders: splitPlaceholders(tplEls.placeholders.value),
        active: tplEls.active.checked,
        updatedBy: 'superadmin@flatery.in'
      };
      await apiService.upsertEmailTemplate(payload);
      setStatus(tplEls.status, 'Saved.');
      await loadTemplates();
      setTimeout(() => tplEls.dialog.close(), 400);
    } catch (e) {
      setStatus(tplEls.status, e.message || 'Save failed', true);
    }
  }

  function renderLogs(list) {
    logsEls.tableBody.innerHTML = '';
    for (const item of (list || [])) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</td>
        <td>${item.emailType}</td>
        <td>${escapeHtml(item.recipient || '')}</td>
        <td>${item.status}</td>
        <td>${escapeHtml(item.errorMessage || '')}</td>
      `;
      logsEls.tableBody.appendChild(tr);
    }
  }

  async function loadLogs() {
    try {
      const list = await apiService.getRecentEmailLogs();
      renderLogs(list || []);
    } catch (e) {
      logsEls.tableBody.innerHTML = `<tr><td colspan="5">Failed to load logs: ${escapeHtml(e.message || '')}</td></tr>`;
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  // Wire events
  if (configEls.btnLoad) configEls.btnLoad.addEventListener('click', loadConfig);
  if (configEls.btnSave) configEls.btnSave.addEventListener('click', saveConfig);
  if (configEls.btnTest) configEls.btnTest.addEventListener('click', sendTest);

  if (tplEls.btnRefresh) tplEls.btnRefresh.addEventListener('click', loadTemplates);
  if (tplEls.btnNew) tplEls.btnNew.addEventListener('click', () => openTemplateEditor(null));
  if (tplEls.btnCancel) tplEls.btnCancel.addEventListener('click', () => tplEls.dialog.close());
  if (tplEls.btnSave) tplEls.btnSave.addEventListener('click', (e) => { e.preventDefault(); saveTemplate(); });

  if (logsEls.btnRefresh) logsEls.btnRefresh.addEventListener('click', loadLogs);

  // Init
  console.log('[Email.js] Loaded, initializing data...');
  loadConfig().catch(e => console.error('[loadConfig] Error:', e));
  loadTemplates().catch(e => console.error('[loadTemplates] Error:', e));
  loadLogs().catch(e => console.error('[loadLogs] Error:', e));
})();
