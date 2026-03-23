const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('roadTripCollab_modern_front/src', function(filePath) {
  if (filePath.endsWith('.vue')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = content.replace(/class="([^"]*)"/g, (match, classes) => {
      if (classes.includes('bg-primary-500') || classes.includes('bg-primary-600')) {
        return 'class="' + classes.replace(/text-slate-900/g, 'text-white').replace(/text-slate-950/g, 'text-white') + '"';
      }
      return match;
    });

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
