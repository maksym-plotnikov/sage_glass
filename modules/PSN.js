const rp = require('request-promise-native');
const fs = require('fs');
const FileHelpers = require('../modules/fileHelpers');
const dateFormat = require('dateformat');
const {Transform} = require('stream');

// CONSTANTS FROM .env
const DEVICE_URL = process.env.DEVICE_URL;
const CHUNK_SIZE = +process.env.CHUNK_SIZE;
const CHUNK_FILLER = process.env.CHUNK_FILLER;
const MAJOR_VERSION = process.env.MAJOR_VERSION;
const MINOR_VERSION = process.env.MINOR_VERSION;
const BUILD_VERSION = process.env.BUILD_VERSION;
const APP_SLOT = process.env.APP_SLOT;

const POST_OPTIONS = {
  url: DEVICE_URL,
  method: 'POST',
  headers: {
    'cache-control': 'no-cache',
    'content-type': 'application/octet-sstream',
    'authorization': 'Basic token'
  },
  encoding: null
};

class ChunkTransformer extends Transform {
  constructor() {
    super();
  }

  _transform(chunk, enc, done) {
    if (chunk.length < CHUNK_SIZE) {
      const end = CHUNK_SIZE - chunk.length;
      const fillBuffer = Buffer.alloc(end, CHUNK_FILLER);
      chunk = Buffer.concat([chunk, fillBuffer]);
    }
    this.push(chunk);
    done();
  }
}

module.exports = {
  postRequest: async rootPath => {
    console.log(`Getting Filesize...`);
    const uploadPath = `${rootPath}/uploads`;
    try {
      const [fileName] = await FileHelpers.getFilesList(uploadPath);
      const date = dateFormat(new Date(), "yyyymmddhhMMss");
      if (fileName && fileName.name) {
        const path = `${uploadPath}/${fileName.name}`;
        const {size} = await FileHelpers.getStats(path);
        console.log("FILE SIZE:", size);
        console.log(`Sending POST to: ${DEVICE_URL}...`);
        const OPTIONS = {
          uri: DEVICE_URL,
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            major: +MAJOR_VERSION,
            minor: +MINOR_VERSION,
            build: +BUILD_VERSION,
            bytes: size,
            time: date,
            slot: +APP_SLOT
          }),
          simple: true,
          transform: function (body, response, resolveWithFullResponse) {
            console.log('transform response', response);
            console.log('transform body', body);
            console.log('transform resolveWithFullResponse', resolveWithFullResponse);
          },
          json: false
        };
        let parsedBody;

        parsedBody = await rp(OPTIONS).catch(errors.TransformError, function (reason) {
          console.log(reason); // => Transform failed!
          // reason.response is the original response for which the transform operation failed
        });
        console.log('parsedBody', parsedBody);
        const pattern = /^SENDCHUNK/i;
        const result = pattern.test(parsedBody);
        console.log('Device is ready:', result);
        let start = 0;
        let end = CHUNK_SIZE - 1;
        console.log(CHUNK_SIZE, typeof CHUNK_SIZE);
        console.log(start, typeof start);
        console.log(end, typeof end);
        const loopNumber = Math.ceil(size / CHUNK_SIZE);
        console.log('loopNumber', loopNumber);
        if (result) {
          console.log('STARTING TO SEND DATA...');
          for (let i = 0; i <= loopNumber; i++) {
            if (i === loopNumber) {
              await rp({
                  body: 'END.END.END.END.END.END.END.END.END.END.'.padEnd(CHUNK_SIZE, CHUNK_FILLER),
                  ...POST_OPTIONS
                },
                (error, response) => {
                  if (error) {
                    console.log(error.message);
                  } else {
                    console.log("Device response: ", response.body.toString());
                  }
                });
              break;
            }
            try {
              const readable = fs.createReadStream(path, {
                start,
                end,
                autoClose: true
              });
              const res = await rp({
                  body: readable.pipe(new ChunkTransformer()),
                  ...POST_OPTIONS
                },
                (error, response) => {
                  console.log(response);
                  if (error) {
                    console.log(error.message);
                  } else {
                    console.log("Device response: ", response.body.toString().trim());
                  }
                });
              start += CHUNK_SIZE;
              end += CHUNK_SIZE;
              if (!pattern.test(res)) {
                break;
              }
            } catch ({message}) {
              console.log('ERROR:', (message || "Could not read file"));
            }
          }
        }
      } else {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error("There is no files inside /uploads directory");
      }
    } catch (e) {
      console.log("ERROR:", e);
    }
  }
};
