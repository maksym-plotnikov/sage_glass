const fs = require('fs');
const {promisify} = require('util');
const contentRange = require('content-range');
const getstats = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const rmfile = promisify(fs.unlink);

module.exports = {
  getFilesList: async (uploadPath) => {
    try {
      const items = await readdir(uploadPath);
      if (items != null && items.length > 0) {
        return items;
      } else {
        return [];
      }
    } catch (e) {
      console.log('ERROR:', e);
      return [];
    }
  },
  getStats: async (path) => {
    return getstats(path);
  },
  readFileStream: async (filePath, res, req) => {
    try {
      const [fileName] = await getFilesList(filePath);
      if (fileName) {
        const {unit, first, last, length} = contentRange.parse(req.get("Content-Range"));
        console.log('Getting file:', `${filePath}/${fileName}`);
        console.log('for range:', `${first} - ${last}/${length} ${unit}`);
        fs.open(`${filePath}/${fileName}`, 'r', (err, fd) => {
          if (err) throw err;
          fs.fstat(fd, (err, stat) => {
            if (err) throw err;
            // use stat
            console.log('File', stat);

            const stream = fs.createReadStream(`${filePath}/${fileName}`, {
              start: first,
              end: last,
              autoClose: true
            });
            stream.pipe(res);
            stream.on('error', ({message}) => {
              return res.status(500).json({message: message || "File read error"});
            });

            fs.close(fd, (err) => {
              if (err) throw err;
            });
          });
        });
      } else {
        return res.status(404).json({message: "No files found"});
      }
    } catch ({message}) {
      return res.status(404).json({message: message || "Unexpected error"});
    }

  },
  deleteFile: async (fileName, req, res) => {
    const filePath = `${req.rootPath}/uploads/${fileName}`;
    try {
      await rmfile(filePath);
      return res.status(200).json({message: "success"});
    } catch (e) {
      console.log('ERROR:', e);
      const {message} = e;
      return res.status(500).json({message: message || "no_file"});
    }
  }
};
