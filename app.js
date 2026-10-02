const flagHashes = [
  "c93db4d5219a9b3d34e72877e7dec020f7580c5b3b7e26f38510a7f0bdc2ba34",
  "d8d1f1ddcb4cf15539ef7a7cae03b6d48079e13216066e494d526597950c11fa",
  "e7f8f4de96ab64285e5043c630b683d2630499ef8a31e5b5a5f6ef238e482949",
  "7dd9b04e6827da6bca73b956672ebb64d8d1bfb1dbf353632bb3fe711e6bbb19"
];
const recovered = new Set();
const feedback = document.querySelector('#feedback');
let investigationVersion = 0;

async function hashFlag(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function render() {
  document.querySelector('#progress').textContent = `${recovered.size} / 4 flags recuperadas`;
  document.querySelectorAll('#found li span').forEach((item, i) => {
    item.textContent = recovered.has(i) ? 'Recuperado' : 'A recuperar';
  });
}

document.querySelector('#flag-form').addEventListener('submit', async event => {
  event.preventDefault();
  const value = document.querySelector('#flag').value.trim().toUpperCase();
  const version = investigationVersion;
  let digest;
  try {
    digest = await hashFlag(value);
  } catch {
    if (version !== investigationVersion) return;
    feedback.textContent = 'Não foi possível conferir a flag. Abra o site por HTTPS ou peça a conferência ao mediador.';
    return;
  }
  if (version !== investigationVersion) return;
  const index = flagHashes.indexOf(digest);

  if (index < 0) {
    feedback.textContent = 'Flag não reconhecida. Confira a mensagem e o formato.';
    return;
  }

  if (recovered.has(index)) {
    feedback.textContent = 'Sua equipe já registrou esta flag.';
    return;
  }

  recovered.add(index);
  render();
  feedback.textContent = recovered.size === 4
    ? 'Investigação concluída! Apresente as quatro flags e as evidências ao mediador.'
    : 'Flag correta! Registre a evidência na folha da equipe e continue a investigação.';
  document.querySelector('#flag').value = '';
});

document.querySelector('#reset').addEventListener('click', () => {
  if (!window.confirm('Apagar o progresso desta investigação?')) return;
  investigationVersion++;
  recovered.clear();
  feedback.textContent = '';
  document.querySelector('#flag').value = '';
  render();
});
