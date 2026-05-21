import multer from "multer";
import path from "path";

// Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/buses");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1E9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  }
});

// File filter
const fileFilter = (req, file, cb) => {

  const allowedTypes = /jpeg|jpg|png|webp/;

  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(new Error("Only images are allowed"));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter
});

export default upload;
