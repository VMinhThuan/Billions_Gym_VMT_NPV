const express = require('express');
const router = express.Router();
const ptTemplatesController = require('../controllers/pt-templates.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.use(auth);
router.use(authorize(['PT', 'OngChu']));

router.get('/', ptTemplatesController.getTemplates);
router.get('/:id', ptTemplatesController.getTemplateById);
router.post('/', ptTemplatesController.createTemplate);
router.put('/:id', ptTemplatesController.updateTemplate);
router.delete('/:id', ptTemplatesController.deleteTemplate);

module.exports = router;

