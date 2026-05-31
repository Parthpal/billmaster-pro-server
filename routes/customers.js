const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/customerController");

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);

// CHANGE THIS LINE:
router.delete("/:id", ctrl.remove); // 👈 Point to ctrl.remove

module.exports = router;