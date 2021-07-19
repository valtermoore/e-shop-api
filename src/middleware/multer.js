const multer = require('multer');
//Definir os tipos the files
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype]

        if (!isValid) {
            return cb(new Error('Please upload an image'));
        }

        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');//para cada space adicionar '-'

        cb(null, `${Date.now()}-${fileName}`);
    }
});

const uploads = multer({
    storage: storage,
    limits: {
        fileSize: 1000000 //limits the file size (1MB)
    },
});

module.exports = uploads;