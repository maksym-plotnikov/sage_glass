const rp = require('request-promise-native');
const fs = require('fs');
const FileHelpers = require('../modules/fileHelpers');
const dateFormat = require('dateformat');
const {Transform} = require('stream');

const CHUNK_SIZE = process.env.CHUNK_SIZE;


class ChunkTransformer extends Transform {
  constructor() {
    super();
  }

  _transform(chunk, enc, done) {
    console.log('CHUNK_SIZE', CHUNK_SIZE);
    if (chunk.length < CHUNK_SIZE) {
      chunk = chunk.toString().padEnd(CHUNK_SIZE, '0');
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
            major: 1,
            minor: 1,
            build: 1,
            bytes: size,
            time: date,
            slot: 1
          },
          json: true
        };
        const parsedBody = await rp(OPTIONS);
        const pattern = /^SENDCHUNK/i;
        const result = pattern.test(parsedBody);
        console.log('RESULT:', result);
        let start = 0;
        let end = CHUNK_SIZE - 1;
        const loopNumber = Math.ceil(size / CHUNK_SIZE);

        if (result) {
          console.log('STARTING TO SEND DATA...');
          for (let i = 0; i <= loopNumber; i++) {
            console.log('i === loopNumber', i === loopNumber);
            if(i === loopNumber) {
              await rp({
                  url,
                  method: 'POST',
                  headers: {
                    'cache-control': 'no-cache',
                    'content-disposition': 'attachment; filename=' + fileName,
                    'content-type': 'file/binary',
                    'authorization': 'Basic token'
                  },
                  encoding: null,
                  body: 'END.END.END.END.END.END.END.END.END.END.                                                                                        '
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
                  method: 'POST',
                  headers: {
                    'cache-control': 'no-cache',
                    'content-disposition': 'attachment; filename=' + fileName,
                    'content-type': 'file/binary',
                    'authorization': 'Basic token'
                  },
                  encoding: null,
                  body: readable.pipe(new ChunkTransformer())
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
