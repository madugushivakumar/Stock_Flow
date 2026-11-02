const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { updateSettingsSchema } = require('../validators/settingsValidator');

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.put('/', validateRequest(updateSettingsSchema), settingsController.updateSettings);

module.exports = router;
