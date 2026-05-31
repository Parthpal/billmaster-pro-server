const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");

// Make sure your controller exports match these exactly!
router.get("/", invoiceController.getAll);
router.get("/:id", invoiceController.getOne);
router.post("/", invoiceController.create);
router.put("/:id", invoiceController.update);
router.delete("/:id", invoiceController.remove);

module.exports = router;