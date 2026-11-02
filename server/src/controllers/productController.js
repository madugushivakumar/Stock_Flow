const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Format product object with effective low-stock threshold and calculation
 */
const formatProduct = (product, defaultThreshold = 5) => {
  const effectiveThreshold =
    product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
      ? product.lowStockThreshold
      : defaultThreshold;

  const isLowStock = product.quantityOnHand <= effectiveThreshold;

  return {
    id: product.id,
    organizationId: product.organizationId,
    name: product.name,
    sku: product.sku,
    description: product.description,
    quantityOnHand: product.quantityOnHand,
    costPrice: product.costPrice !== null ? Number(product.costPrice) : null,
    sellingPrice: product.sellingPrice !== null ? Number(product.sellingPrice) : null,
    lowStockThreshold: product.lowStockThreshold,
    effectiveThreshold,
    isLowStock,
    lastUpdatedBy: product.lastUpdatedBy,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const getProducts = async (req, res, next) => {
  try {
    const { search, lowStockOnly } = req.query;
    const organizationId = req.organization.id;
    const defaultThreshold = req.organization.defaultLowStockThreshold;

    const whereClause = {
      organizationId,
    };

    if (search && search.trim() !== '') {
      const query = search.trim();
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    let formatted = products.map((p) => formatProduct(p, defaultThreshold));

    if (lowStockOnly === 'true') {
      formatted = formatted.filter((p) => p.isLowStock);
    }

    return successResponse(res, 200, 'Products retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.organization.id;
    const defaultThreshold = req.organization.defaultLowStockThreshold;

    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    return successResponse(res, 200, 'Product retrieved successfully', formatProduct(product, defaultThreshold));
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const organizationId = req.organization.id;
    const defaultThreshold = req.organization.defaultLowStockThreshold;
    const {
      name,
      sku,
      description,
      quantityOnHand,
      costPrice,
      sellingPrice,
      lowStockThreshold,
    } = req.body;

    // Check duplicate SKU within the same organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        organizationId,
        sku,
      },
    });

    if (existingProduct) {
      return errorResponse(
        res,
        409,
        `A product with SKU "${sku}" already exists in your organization`
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        organizationId,
        name,
        sku,
        description: description || null,
        quantityOnHand,
        costPrice: costPrice !== undefined && costPrice !== null ? costPrice : null,
        sellingPrice: sellingPrice !== undefined && sellingPrice !== null ? sellingPrice : null,
        lowStockThreshold:
          lowStockThreshold !== undefined && lowStockThreshold !== null
            ? lowStockThreshold
            : null,
        lastUpdatedBy: req.user.email,
      },
    });

    return successResponse(
      res,
      201,
      'Product created successfully',
      formatProduct(newProduct, defaultThreshold)
    );
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.organization.id;
    const defaultThreshold = req.organization.defaultLowStockThreshold;
    const {
      name,
      sku,
      description,
      quantityOnHand,
      costPrice,
      sellingPrice,
      lowStockThreshold,
    } = req.body;

    // Check if product exists and belongs to the authenticated tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingProduct) {
      return errorResponse(res, 404, 'Product not found');
    }

    // Check SKU duplicate conflict if changed
    if (sku && sku !== existingProduct.sku) {
      const conflict = await prisma.product.findFirst({
        where: {
          organizationId,
          sku,
          id: { not: id },
        },
      });

      if (conflict) {
        return errorResponse(
          res,
          409,
          `Another product with SKU "${sku}" already exists in your organization`
        );
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description: description !== undefined ? description : existingProduct.description,
        quantityOnHand,
        costPrice: costPrice !== undefined ? costPrice : existingProduct.costPrice,
        sellingPrice: sellingPrice !== undefined ? sellingPrice : existingProduct.sellingPrice,
        lowStockThreshold:
          lowStockThreshold !== undefined ? lowStockThreshold : existingProduct.lowStockThreshold,
        lastUpdatedBy: req.user.email,
      },
    });

    return successResponse(
      res,
      200,
      'Product updated successfully',
      formatProduct(updatedProduct, defaultThreshold)
    );
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.organization.id;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingProduct) {
      return errorResponse(res, 404, 'Product not found');
    }

    await prisma.product.delete({
      where: { id },
    });

    return successResponse(res, 200, 'Product deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.organization.id;
    const defaultThreshold = req.organization.defaultLowStockThreshold;
    const { adjustment } = req.body;

    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    const newQuantity = product.quantityOnHand + adjustment;
    if (newQuantity < 0) {
      return errorResponse(
        res,
        400,
        `Cannot reduce stock by ${Math.abs(adjustment)}. Current quantity is ${product.quantityOnHand}.`
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        quantityOnHand: newQuantity,
        lastUpdatedBy: req.user.email,
      },
    });

    return successResponse(
      res,
      200,
      `Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`,
      formatProduct(updatedProduct, defaultThreshold)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
};
