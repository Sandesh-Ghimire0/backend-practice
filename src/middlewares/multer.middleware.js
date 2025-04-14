import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) 
      // using original name is not recommended because if the files name are same they can be overwritten
    }
  })
  
export const upload = multer({ storage: storage })