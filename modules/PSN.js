const rp = require('request-promise-native');
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
        let counter = 0;
        if (result) {
          for (let i = counter; i < 10; i++) {
            const res = await rp(OPTIONS);
            counter = i;
            if (!pattern.test(res)) {
              break;
            }
          }
        }
        console.log('COUNTER', counter);
      } else {
        return new Error("No files");
      }
    } catch (e) {
      console.log("err", e);
    }
  }
};
