const rp = require('request-promise-native');
const fs = require('fs');
const FileHelpers = require('../modules/fileHelpers');
const dateFormat = require('dateformat');
const {Transform} = require('stream');

const CHUNK_SIZE = process.env.CHUNK_SIZE;
const CHUNK_FILLER = process.env.CHUNK_FILLER;
const MAJOR_VERSION = process.env.MAJOR_VERSION;
const MINOR_VERSION = process.env.MINOR_VERSION;
const BUILD_VERSION = process.env.BUILD_VERSION;
const APP_SLOT = process.env.APP_SLOT;

const POST_OPTIONS = {
  method: 'POST',
  headers: {
    'cache-control': 'no-cache',
    'content-type': 'file/binary',
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
      chunk = chunk.toString().padEnd(CHUNK_SIZE, CHUNK_FILLER);
    }
    this.push(chunk);
    done();
  }
}

module.exports = {
  postRequest: async (url, rootPath) => {
    console.log(`Getting Filesize...`);
    const uploadPath = `${rootPath}/uploads`;
    try {
      const [fileName] = await FileHelpers.getFilesList(uploadPath);
      const date = dateFormat(new Date(), "yyyymmddhhMMss");
      if (fileName) {
        const path = `${uploadPath}/${fileName}`;
        const {size} = await FileHelpers.getStats(path);
        console.log("FILE SIZE:", size);
        console.log(`Sending POST to: ${url}...`);
        const OPTIONS = {
          method: 'POST',
          uri: url,
          body: {
            major: MAJOR_VERSION,
            minor: MINOR_VERSION,
            build: BUILD_VERSION,
            bytes: size,
            time: date,
            slot: APP_SLOT
          },
          json: true
        };
        const parsedBody = await rp(OPTIONS);
        const pattern = /^SENDCHUNK/i;
        const result = pattern.test(parsedBody);
        console.log('Device is ready:', result);
        let start = 0;
        let end = CHUNK_SIZE - 1;
        const loopNumber = Math.ceil(size / CHUNK_SIZE);
        if (result) {
          console.log('STARTING TO SEND DATA...');
          for (let i = 0; i <= loopNumber; i++) {
            if (i === loopNumber) {
              await rp({
                  url,
                  body: 'END.END.END.END.END.END.END.END.END.END.                                                                                        ',
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
                  url,
                  body: readable.pipe(new ChunkTransformer()),
                  ...POST_OPTIONS
                },
                (error, response) => {
                  if (error) {
                    console.log(error.message);
                  } else {
                    console.log("Device response: ", response.body.toString());
                  }
                });
              start += (end + 1);
              end += start;
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
    } catch ({message}) {
      console.log("ERROR:", message);
    }
  }
};
