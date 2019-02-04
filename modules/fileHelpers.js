const fs = require('fs');
const {promisify} = require('util');
const contentRange = require('content-range');
const getstats = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const rmfile = promisify(fs.unlink);

const FileHelpers = {
  getSize: async (uploadPath, items) => {
    const array = [];
    await Promise.all(items.map(async item => {

      const file = `${uploadPath}/${item}`;
      const stats = await getstats(file);
      array.push({name: item, size: stats.size});
    }));
    return array;
  },
  getFilesList: async uploadPath => {
    try {
      const items = await readdir(uploadPath);
      const list = await FileHelpers.getSize(uploadPath, items);
      if (list != null && list.length > 0) {
        return list.filter(item => !(/^\./g).test(item.name));
      } else {
        return [];
      }
    } catch (e) {
      console.log('ERROR:', e);
      return [];
    }
  },
  getStats: async path => {
    return getstats(path);
  },
  openFile: async (path, first, last, res = null) => {
    fs.open(path, 'r', (err, fd) => {
      if (err) throw err;
      fs.fstat(fd, (err, stat) => {
        if (err) throw err;
        // use stat
        console.log('File', stat);

        const stream = fs.createReadStream(path, {
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
  },
  readFileStream: async (uploadPath, res, req) => {
    try {
      const [fileName] = await FileHelpers.getFilesList(uploadPath);
      console.log(console.log(fileName));
      if (fileName) {
        const {unit, first, last, length} = contentRange.parse(req.get("Content-Range"));
        const filePath =  `${uploadPath}/${fileName}`
        console.log('Getting file:', filePath);
        console.log('for range:', `${first} - ${last}/${length} ${unit}`);
        await openFile(filePath, first, last, res);
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

module.exports = FileHelpers;
