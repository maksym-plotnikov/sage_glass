const express = require('express');
const router = express.Router();
const FileHelpers = require('../modules/fileHelpers');


router.get('/get', async (req, res, next) => {
  const uploadPath = `${req.rootPath}/uploads`;
  try {
    await FileHelpers.readFileStream(uploadPath, res, req);
  } catch ({message}) {
    console.log('ERROR:', (message || "Could not read file"));
    return res.status(500).json({message: (message || "Could not read file")});
  }
});

router.get('/getSize/', async (req, res, next) => {
  const uploadPath = `${req.rootPath}/uploads`;
  const [fileName] = await FileHelpers.getFilesList(uploadPath);
  console.log("Requesting size for", fileName);
  if (fileName) {
    const path = `${uploadPath}/${fileName}`;
    const size = await FileHelpers.getStats(path);
    console.log("FILE SIZE", size);
    return res.status(200).json({name: fileName, fileSize: size});
  }
  return res.status(404).json({message: "No files found"});
});

router.post('/delete', async (req, res, next) => {
  const fileName = req.body.file || req.query.file;
  try {
    await FileHelpers.deleteFile(fileName, req, res);
  } catch ({message}) {
    console.log('ERROR:', (message || "Could not delete file"));
    return res.status(500).json({message: (message || "Could not delete file")});
  }
});


module.exports = router;
