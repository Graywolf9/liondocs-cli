"use strict";

// libs
let fs = require('fs');
const { spawn } = require('node:child_process');

// flags
let flags = {
  '--sha':'',
  '--content':'',
  '--translated':'',
  '--lang':''
};

// getFlags
function getFlag(flag){
  let flagIndex = process.argv.indexOf(flag);
  let flagValue;
  if (flagIndex > -1) {
    flagValue = process.argv[flagIndex + 1];
  } else {
    console.log('You need to specify a file with --flag flag');
    return 1;
  }

  return flagValue;
}

console.log('Getting flags...');
Object.keys(flags).forEach(key => {
  flags[key] = getFlag(key);
});
console.log(flags);

// Get hash
let hash;
let file = flags['--sha'].replace('/es/','/en-us/');

const gitLog = spawn('git',['log','--pretty=format:"%H"','-n','1',file],{cwd:flags['--content']});

gitLog.stdout.on('data', (data) => {
  hash = data.toString().replace(/\"/g,'');
  console.log('Getting sha from: ' + file);
  console.log('Sha: ' + hash);
  if (process.platform == 'darwin') {
    pbcopy(hash);
  }
  insertSha(flags['--translated'],flags['--sha'],hash);
});

gitLog.stderr.on('data', (data) => {
	console.error(`stderr: ${data}`);
});

function insertSha(translatedDir, shaFile, hash){
  fs.readFile(translatedDir + shaFile, 'utf8', function(err,data){
    if (err) { return console.log(err); }
    let result;
    if (data.includes('sourceCommit')){
      console.log('Updating sha in: ' + shaFile);
      result = data.replace(/sourceCommit: .*?\n/i,'sourceCommit: ' + hash + '\n');
    } else {
      console.log('Putting sha in: ' + shaFile);
      let occ = 0;
      result = data.replace(/---/g, match => ++occ === 2 ? 'l10n:\n  sourceCommit: '+hash+'\n---' : match);
    }
    fs.writeFile(translatedDir + shaFile, result, 'utf8', function(err){
      if (err) { return console.log(err); }
    });
  });
}

function pbcopy(data) {
  var proc = require('child_process').spawn('pbcopy');
  proc.stdin.write(data);
  proc.stdin.end();
  console.log('Sha copied to clipboard: ' + data);
}
