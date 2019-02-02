const rp = require('request-promise-native');
const fs = require('fs');
const qs = require('querystring');
const FileHelpers = require('../modules/fileHelpers');
const dateFormat = require('dateformat');

module.exports = {
  postRequest: async (url, rootPath) => {
    try {
      console.log(`Getting Filesize...`);
      const uploadPath = `${rootPath}/uploads`;
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
        console.log('parsedBody:', parsedBody.length);
        let start = 0;
        let end = 127;

        if (result) {
          console.log('STARTING TO SEND DATA...');
          for (let i = 0; i <2 ; i++) {
            try {
              const res = await rp({
                  url,
                  method: 'POST',
                  headers: {
                    'cache-control': 'no-cache',
                    'content-disposition': 'attachment; filename=' + fileName,
                    'content-type' : 'image/jpg',
                    'authorization' : 'Basic token'
                  },
                  encoding: null,
                  body: fs.createReadStream(path, {
                    start,
                    end,
                    autoClose: true
                  })
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
