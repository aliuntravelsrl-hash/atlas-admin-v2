const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, 'atlas_admin_compilado.zip'));
const archive = new ZipArchive({ zlib: { level: 9 } });

output.on('close', () => console.log('ZIP listo: atlas_admin_compilado.zip'));
archive.pipe(output);
archive.directory('dist/', false);
archive.finalize();
