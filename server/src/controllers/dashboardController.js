const prisma = require('../config/db');
const { successResponse } = require('../utils/response');

const getDashboardSummary = async (req, res, next) => {
  try {
    const organizationId = req.organization.id;
    const defaultThreshold = req.organization.defaultLowStockThreshold;

    // Fetch all products for the tenant
    const products = await prisma.product.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const totalProducts = products.length;

    let totalQuantityOnHand = 0;
    const lowStockItems = [];

    for (const product of products) {
      totalQuantityOnHand += product.quantityOnHand;

      const effectiveThreshold =
        product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
          ? product.lowStockThreshold
          : defaultThreshold;

      // Low stock rule: Quantity on Hand <= Effective Threshold (equality included)
      if (product.quantityOnHand <= effectiveThreshold) {
        lowStockItems.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          quantityOnHand: product.quantityOnHand,
          lowStockThreshold: product.lowStockThreshold,
          effectiveThreshold,
          sellingPrice: product.sellingPrice !== null ? Number(product.sellingPrice) : null,
          createdAt: product.createdAt,
        });
      }
    }

    return successResponse(res, 200, 'Dashboard summary retrieved successfully', {
      totalProducts,
      totalQuantityOnHand,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      organization: {
        id: req.organization.id,
        name: req.organization.name,
        defaultLowStockThreshold: defaultThreshold,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
