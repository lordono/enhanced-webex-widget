const express = require("express");
const controller = require("./controller");

const router = express.Router();

// routes
router.get(/\/hunting/, controller.hunting_get);
router.post(/\/hunting/, controller.hunting_post);
router.delete(/\/hunting/, controller.hunting_delete);

router.get(/\/filter/, controller.filter_get);

module.exports = router;
