const express = require('express');
const router = express.Router();
const fs = require('fs');
const contentRange = require('content-range');
const {promisify} = require('util');

const readdir = promisify(fs.readdir);
const rmfile = promisify(fs.unlink);
const getstats = promisify(fs.stat);


async function getFilesList(uploadPath) {
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
}

async function readFileStream(filePath, res, req) {
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

          const stream = fs.createReadStream(`${filePath}/${fileName}`, {start: first, end: last, autoClose: true});
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

}

async function deleteFile(fileName, req, res) {
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


router.get('/get', async (req, res, next) => {
  const uploadPath = `${req.rootPath}/uploads`;
  try {
    await readFileStream(uploadPath, res, req);
  } catch ({message}) {
    console.log('ERROR:', (message || "Could not read file"));
    return res.status(500).json({message: (message || "Could not read file")});
  }
});

router.get('/getSize/', async (req, res, next) => {
  const uploadPath = `${req.rootPath}/uploads`;
  const [fileName] = await getFilesList(uploadPath);
  console.log("Requesting size for", fileName);
  if (fileName) {
    const path = `${uploadPath}/${fileName}`;
    const {size} = await getstats(path);
    console.log("FILE SIZE", size);
    return res.status(200).json({name: fileName, fileSize: size});
  }
  return res.status(404).json({message: "No files found"});
});

router.post('/delete', async (req, res, next) => {
  const fileName = req.body.file || req.query.file;
  try {
    await deleteFile(fileName, req, res);
  } catch ({message}) {
    console.log('ERROR:', (message || "Could not delete file"));
    return res.status(500).json({message: (message || "Could not delete file")});
  }

});


module.exports = router;
