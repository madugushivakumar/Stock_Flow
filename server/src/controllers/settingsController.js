const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

const getSettings = async (req, res, next) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.organization.id },
    });

    if (!organization) {
      return errorResponse(res, 404, 'Organization not found');
    }

    return successResponse(res, 200, 'Settings retrieved successfully', {
      organizationId: organization.id,
      organizationName: organization.name,
      defaultLowStockThreshold: organization.defaultLowStockThreshold,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { defaultLowStockThreshold } = req.body;

    const updatedOrg = await prisma.organization.update({
      where: { id: req.organization.id },
      data: {
        defaultLowStockThreshold,
      },
    });

    return successResponse(res, 200, 'Settings updated successfully', {
      organizationId: updatedOrg.id,
      organizationName: updatedOrg.name,
      defaultLowStockThreshold: updatedOrg.defaultLowStockThreshold,
      updatedAt: updatedOrg.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
