const express = require('express');
const router = express.Router();
const fs = require('fs');
const contentRange = require('content-range');
const {promisify} = require('util');

const rmfile = promisify(fs.unlink);
const rdfile = promisify(fs.readFile);
const getstats = promisify(fs.stat);

function readFileStream(file, res, req) {
  const {unit, first, last, length} = contentRange.parse(req.get("Content-Range"));
  console.log('Getting file:', file);
  console.log('for range:', `${first} - ${last}/${length} ${unit}`);
  const stream = fs.createReadStream(file, {start: first, end: last - 1});
  stream.pipe(res);
  stream.on('error', ({message}) => {
    return res.status(500).json({message});
  });
}

async function deleteFile(fileName, req, res) {
  const filePath = `${req.rootPath}/uploads/${fileName}`;
  try {
    await rmfile(filePath);
    return res.status(200).json({message: "success"});
  } catch (e) {
    console.log('ERROR:', e);
    const {message} = e;
    return res.status(500).json({message});
  }
}

router.get('/get', function (req, res, next) {
  const fileName = req.body.file || req.query.file;
  const filePath = `${req.rootPath}/uploads/${fileName}`;
  try {
    readFileStream(filePath, res, req);
  } catch ({message}) {
    console.log('ERROR:', (message || "Could not read file"));
    return res.status(500).json({message: (message || "Could not read file")});
  }
});

router.get('/getSize', async (req, res, next) => {
  const fileName = req.body.file || req.query.file;
  console.log("Requesting size for", fileName);
  if (fileName) {
    const path = `${req.rootPath}/uploads/${fileName}`;
    const {size} = await getstats(path);
    console.log("SIZE", size);
    return res.status(200).json({name: fileName, fileSize: size});
  }
  return res.status(404).json({message: "Please provide file name!"});
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
