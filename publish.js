const globby = require('globby');
const mime = require('mime-types');
const {Storage} = require('@google-cloud/storage');
const admin = require('firebase-admin');

const package = require('./package.json');
const firebaseServiceAccount = require('./service-accounts/firebase.json');

const storage = new Storage({
  projectId: 'scvo-net'
});

const app = admin.initializeApp({
  projectId: 'scvo-net',
  databaseURL: 'https://scvo-net.firebaseio.com',
  credential: admin.credential.cert(firebaseServiceAccount)
});

const versionNo = package.version;
const sites = ['digitalparticipation', 'emailer', 'fundingscotland', 'volunteerscotland-search', 'getinvolved', 'getinvolved-legacy', 'goodmoves', 'humanrightsdeclaration', 'scotlandforeurope', 'scvo'];

async function main() {
  const paths = await globby('build/**/*.gz');
  for (const path of paths) {
    const newPath = getNewPath(path);
    const contentType = mime.lookup(newPath);
    await uploadFile(path, newPath, contentType);
  }
  await updateSitesMetadata();
}

function getNewPath(path) {
  const parts = path.split('.');
  const ext = parts.splice(parts.length - 2)[0];
  const name = parts.join('.').replace(/^build\//, '');
  const newName = name + '-' + versionNo + '.' + ext;
  return newName;
}

async function uploadFile(path, newPath, contentType) {
  try {
    await storage.bucket('scvo-assets').upload(path, {
      destination: newPath,
      public: true,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        contentType: contentType,
        contentEncoding: 'gzip'
      }
    });
    console.log('Uploaded', path, 'to scvo-assets ->', newPath);
  } catch(err) {
    console.error('Failed to upload', path, 'to scvo-assets ->', newPath, err);
  }
}

async function updateSitesMetadata() {
  for (const site of sites) {
    const path = '/contexts/' + site + '/metaData/assetsVersion/'
    try {
      await app.database().ref(path).set(versionNo);
      console.log('Updated site metadata for', site, 'at path', path);
    } catch(err) {
      console.error('Failed to update site metadata for', site, 'at path', path);
    }
  }
}

main().then(() => {
  console.log('Program completed');
  process.exit();
}).catch(err => {
  console.error('Program failed:', err);
});
