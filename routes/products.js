const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productController");

router.get("/", ctrl.getAll);
router.post("/", ctrl.create);

// Added support for fetching a single product by ID
router.get("/:id", ctrl.getById); 
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;