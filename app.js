const flagHashes = [
  "c93db4d5219a9b3d34e72877e7dec020f7580c5b3b7e26f38510a7f0bdc2ba34",
  "d8d1f1ddcb4cf15539ef7a7cae03b6d48079e13216066e494d526597950c11fa",
  "e7f8f4de96ab64285e5043c630b683d2630499ef8a31e5b5a5f6ef238e482949",
  "7dd9b04e6827da6bca73b956672ebb64d8d1bfb1dbf353632bb3fe711e6bbb19"
];
const recovered = new Set();
const feedback = document.querySelector('#feedback');
const captureNotice = document.querySelector('#capture-notice');
const storageNote = document.querySelector('#storage-note');
const storageKey = 'matrix-ctf:progress:' + new URL('.', window.location.href).pathname;
let investigationVersion = 0;

async function hashFlag(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function storageUnavailable() {
  storageNote.textContent = 'O navegador não permitiu salvar o progresso. Anote suas flags antes de fechar ou atualizar a página.';
  storageNote.classList.add('storage-warning');
}

function saveProgress() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({
      version: 1,
      flags: Array.from(recovered, index => flagHashes[index])
    }));
    storageNote.textContent = 'Progresso salvo neste navegador. Use Reiniciar investigação antes de outra equipe começar.';
    storageNote.classList.remove('storage-warning');
  } catch {
    storageUnavailable();
  }
}

function restoreProgress() {
  let raw;
  try {
    raw = window.localStorage.getItem(storageKey);
  } catch {
    storageUnavailable();
    return;
  }
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1 || !Array.isArray(saved.flags)) return;
    saved.flags.forEach(digest => {
      const index = flagHashes.indexOf(digest);
      if (index >= 0) recovered.add(index);
    });
  } catch {
    // Um registro incompleto não impede uma nova investigação.
  }
}

function render() {
  document.querySelector('#progress').textContent = `${recovered.size} / 4 flags recuperadas`;
  document.querySelector('#progress-meter').setAttribute('aria-valuenow', recovered.size);
  document.querySelector('#progress-fill').style.width = `${recovered.size * 25}%`;
  document.querySelector('.submission').classList.toggle('is-complete', recovered.size === 4);
  document.querySelectorAll('#found li').forEach((item, i) => {
    item.classList.toggle('is-recovered', recovered.has(i));
    item.querySelector('span').textContent = recovered.has(i) ? '✓ Recuperado' : 'A recuperar';
  });
}

function celebrate(index) {
  const complete = recovered.size === 4;
  captureNotice.classList.remove('is-celebrating');
  captureNotice.classList.toggle('is-final', complete);
  document.querySelector('#capture-title').textContent = complete
    ? 'Investigação concluída!'
    : `Flag ${String(index + 1).padStart(2, '0')} capturada!`;
  document.querySelector('#capture-detail').textContent = complete
    ? 'Quatro evidências recuperadas. Apresente seus registros ao mediador.'
    : `Evidência validada. ${recovered.size} de 4 fragmentos recuperados. Continue a investigação.`;
  captureNotice.hidden = false;
  // Reinicia a animação a cada nova captura, sem temporizadores pendentes.
  void captureNotice.offsetWidth;
  captureNotice.classList.add('is-celebrating');
}

document.querySelector('#flag-form').addEventListener('submit', async event => {
  event.preventDefault();
  const input = document.querySelector('#flag');
  const value = input.value.trim().toUpperCase();
  const version = investigationVersion;
  captureNotice.hidden = true;
  feedback.textContent = '';
  let digest;
  try {
    digest = await hashFlag(value);
  } catch {
    if (version !== investigationVersion) return;
    feedback.dataset.tone = 'error';
    feedback.textContent = 'Não foi possível conferir a flag. Abra o site por HTTPS ou peça a conferência ao mediador.';
    return;
  }
  if (version !== investigationVersion) return;
  const index = flagHashes.indexOf(digest);
  if (index < 0) {
    feedback.dataset.tone = 'error';
    feedback.textContent = 'Flag não reconhecida. Confira a mensagem e o formato.';
    return;
  }
  if (recovered.has(index)) {
    feedback.dataset.tone = 'info';
    feedback.textContent = 'Sua equipe já registrou esta flag. Este fragmento já está marcado como recuperado.';
    return;
  }
  recovered.add(index);
  saveProgress();
  render();
  celebrate(index);
  // Não apaga uma nova entrada digitada enquanto a conferência ocorria.
  if (input.value.trim().toUpperCase() === value) input.value = '';
});

document.querySelector('#reset').addEventListener('click', () => {
  if (!window.confirm('Apagar as flags salvas neste navegador e iniciar uma nova investigação?')) return;
  investigationVersion++;
  recovered.clear();
  saveProgress();
  captureNotice.hidden = true;
  feedback.textContent = '';
  document.querySelector('#flag').value = '';
  render();
});

restoreProgress();
render();
