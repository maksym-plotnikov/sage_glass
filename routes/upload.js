const express = require('express');
const router = express.Router();
const path = require('path');

router.post('/', function (req, res, next) {
  if (req.files == null || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded.');
    return;
  }
  const {upload} = req.files;
  const uploadPath = __dirname + '/../uploads/' + upload.name;
  upload.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.render('fileUploaded', {fileName: upload.name, baseUrl: req.BASE_URL});
  });

});

module.exports = router;