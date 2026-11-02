const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { productSchema, stockAdjustmentSchema } = require('../validators/productValidator');

// All product routes require valid JWT authentication and tenant context
router.use(authenticate);

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', validateRequest(productSchema), productController.createProduct);
router.put('/:id', validateRequest(productSchema), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/adjust-stock', validateRequest(stockAdjustmentSchema), productController.adjustStock);

module.exports = router;
