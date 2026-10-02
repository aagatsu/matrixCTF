const archiveManifest = Object.freeze({
  schema: 2,
  caseId: 'MX-04',
  revision: '2026.10',
  transport: 'static',
  source: 'registro.txt',
  legacyTag: 'MATRIX{ROKDU}',
  restored: true
});

document.body.dataset.case = archiveManifest.caseId;
