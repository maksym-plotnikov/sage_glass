const express = require('express');
const router = express.Router();
const fs = require('fs');
const {promisify} = require('util');

const readdir = promisify(fs.readdir);
const getstats = promisify(fs.stat);

async function getSize(items) {
  const array = [];
  const path = __dirname + '/../uploads/';
  await Promise.all(items.map(async item => {
    const file = path + item;
    const stats = await getstats(file);
    array.push({name: item, size: stats.size});
  }));
  return array;
}

async function getFilesList(rootPath) {
  const uploadPath = `${rootPath}/uploads/`;
  try {
    const items = await readdir(uploadPath);
    const list = await getSize(items);
    if (list != null && list.length > 0) {
      return list;
    } else {
      return [];
    }
  } catch (e) {
    console.log('ERROR:', e);
    return [];
  }
}


/* GET home page. */
router.get('/', async (req, res, next) => {
  const list = await getFilesList(req.rootPath);
  const baseUrl = req.baseUrl;
  res.render('index', {title: 'Upload form', baseUrl, list});
});

module.exports = router;
