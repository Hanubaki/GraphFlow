import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

const dir = process.cwd();

async function run() {
  console.log('Adding files to git repository...');

  // Get all files excluding node_modules, dist, .git
  function getFiles(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(dir, fullPath).replace(/\\/g, '/');

      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
        continue;
      }

      if (entry.isDirectory()) {
        files = files.concat(getFiles(fullPath));
      } else {
        files.push(relPath);
      }
    }
    return files;
  }

  const allFiles = getFiles(dir);

  for (const filepath of allFiles) {
    await git.add({ fs, dir, filepath });
  }
  console.log(`Staged ${allFiles.length} files.`);

  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Berke',
      email: 'berke@graphflow.dev',
    },
    message: 'feat: initial release of GraphFlow architecture simulator',
  });

  console.log(`Commit created successfully! SHA: ${sha}`);
}

run().catch(err => {
  console.error('Git error:', err);
  process.exit(1);
});
