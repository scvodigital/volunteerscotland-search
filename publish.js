const globby = require('globby');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const {Storage} = require('@google-cloud/storage');
const admin = require('firebase-admin');
const isGzip = require('is-gzip');
const stringify = require('json-stringify-safe');
const pako = require('pako');

const package = require('./package.json');

const firebaseServiceAccount = require('./service-accounts/firebase.json');

const FIREBASE_ROOT = '/contexts-new/';
const BUILD_DIR = path.join(__dirname, 'build');
const BUCKET = 'scvo-assets';
const DESTINATION_DIR = 'test';
const VERSION = package.version;
const VERSION_TEST = new RegExp('-VERSION\.[0-9a-z]+$', 'i');

const storage = new Storage({
  projectId: 'scvo-net'
});

const app = admin.initializeApp({
  projectId: 'scvo-net',
  databaseURL: 'https://scvo-net.firebaseio.com',
  credential: admin.credential.cert(firebaseServiceAccount)
});

(async () => {
  const sites = fs.readdirSync(BUILD_DIR).filter(source => fs.lstatSync(path.join(BUILD_DIR, source)).isDirectory());
  console.log('Publishing the following sites:', sites.join(', '));
  await uploadAssets(sites);
  await uploadConfigs(sites);
  process.exit();
})();

async function uploadAssets(sites) {
  const uploadOptions = await getUploadOptions(sites);
  const total = uploadOptions.length;
  let successful = 0;
  let failed = 0;
  
  console.log('Uploading a grand total of', total, 'assets');

  for (const uploadOption of uploadOptions) {
    let message = '';
    const extraInfo = [];
    
    if (uploadOption.versioned) {
      extraInfo.push('versioned');
    }

    if (uploadOption.gzipped) {
      extraInfo.push('gzipped');
    }

    if (extraInfo.length === 0) {
      extraInfo.push('boring');
    }

    if (uploadOption.alreadyUploaded) {
      extraInfo.push('already uploaded');
    }

    try {
      if (!uploadOption.alreadyUploaded) {
        await storage.bucket(BUCKET).upload(uploadOption.path, uploadOption.options);
      }
      successful++;
      message = 'SUCCESS -> ' + uploadOption.options.destination;
      if (!uploadOption.alreadyUploaded && uploadOption.gzipped) {
        const response = await storage.bucket(BUCKET).file(uploadOption.options.destination).setMetadata(uploadOption.options.metaData);
      }
    } catch(err) {
      failed++;
      message = 'FAILED -> ' + uploadOption.options.destination + ':\n' + stringify(err, null, 2);
    }

    const prefix = ['[F:', failed, '+ S:', successful, '=', (failed + successful), '/', total + ']'].join(' ');
    console.log(prefix, '(' + extraInfo.join(', ') + ')',  message);
  }

  console.log('Finished uploading', successful, 'successful assets with', failed, 'failures');
}

async function getUploadOptions(sites) {
  const uploadOptions = [];

  console.log('Preparing all assets for upload (including checking if they need rehosting'); 
  for (const site of sites) {
    const siteDir = path.join(BUILD_DIR, site);
    const configPath = path.join(siteDir, site + '-site.json');
    const assetsGlob = path.join(siteDir, '**/*');
    const assets = globby.sync([assetsGlob, '!' + configPath]);

    for (const asset of assets) {
      try {
        const destination = path.join(DESTINATION_DIR, site, asset.split(siteDir)[1]);
        const contentType = mime.lookup(asset) || 'text/plain';
        const versioned = VERSION_TEST.test(asset);
        const gzipped = isGzip(fs.readFileSync(asset));

        const options = {
          destination,
          public: true,
          metaData: {
            contentType
          }
        };

        if (!!versioned) {
          options.metaData.cacheControl = 'public, max-age=31536000';
          options.destination = options.destination.replace('VERSION', VERSION);
        }

        if (gzipped) {
          //options.gzip = 'auto'; 
          options.metaData.contentEncoding = 'gzip';
        }

        const alreadyUploaded = await isAlreadyUploaded(asset, options.destination);
        
        uploadOptions.push({ path: asset, versioned, gzipped, options, alreadyUploaded });
      } catch(err) {
        console.error('Failed to get options for asset:', asset, err);
      }
    }
  }

  return uploadOptions;
}

async function uploadConfigs(sites) {
  const total = sites.length;
  let successful = 0;
  let failed = 0;

  console.log('Uploading site configurations for', total, 'sites');

  for (const site of sites) {
    const firebasePath = FIREBASE_ROOT + site;
    const configPath = path.join(BUILD_DIR, site, site + '-site.json');
    let message = '';

    try {
      const json = fs.readFileSync(configPath).toString();
      const siteConfig = JSON.parse(json);
      await app.database().ref(firebasePath).set(siteConfig);
      successful++;
      message = 'SUCCESS -> ' + firebasePath;
    } catch(err) {
      failed++;
      message = 'FAILED -> ' + firebasePath + ':\n' + stringify(err, null, 2);
    }
    
    const prefix = ['[F:', failed, '+ S:', successful, '=', (failed + successful), '/', total + ']'].join(' ');
    console.log(prefix, message);
  }

  console.log('Finished successfully uploading', successful, 'site configurations with', failed, 'failures');
}

async function isAlreadyUploaded(source, destination) {
  try {  
    const size = await fs.statSync(source).size;
    const file = await storage.bucket(BUCKET).file(destination);
    const metaData = await file.getMetadata();
    return !metaData.errors && Array.isArray(metaData) && metaData.length > 1 && parseInt(metaData[0].size, 10) == size;
  } catch(err) {
    return false;
  }
  process.exit();
}