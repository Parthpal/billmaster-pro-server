// const admin = require("firebase-admin");

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId:   process.env.FIREBASE_PROJECT_ID,
//       privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     }),
//   });
// }

// exports.auth = async (req, res, next) => {
//   const token = req.headers.authorization?.split("Bearer ")[1];
//   if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
//   try {
//     req.user = await admin.auth().verifyIdToken(token);
//     next();
//   } catch {
//     res.status(401).json({ success: false, message: "Invalid token" });
//   }
// };

// exports.auth = async (req, res, next) => {
//   next();
// };