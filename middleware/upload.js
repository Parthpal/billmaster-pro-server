// const multer = require("multer");
// const path   = require("path");
// const fs     = require("fs");

// const dir = path.join(__dirname, "../uploads");
// if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (_, __, cb) => cb(null, dir),
//   filename:    (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
// });

// const fileFilter = (_, file, cb) =>
//   file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only images allowed"), false);

// module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });