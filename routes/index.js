const express = require('express');
const router = express.Router();
const FileHelpers = require('../modules/fileHelpers');

/* GET home page. */
router.get('/', async (req, res, next) => {
  const uploadPath = `${req.rootPath}/uploads/`;
  const list = await FileHelpers.getFilesList(uploadPath);
  const baseUrl = req.BASE_URL;
  res.render('index', {title: 'Upload form', baseUrl, list});
});

module.exports = router;
