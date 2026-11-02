const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { errorResponse } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 401, 'Authentication token missing');
    }

    const secret = process.env.JWT_SECRET || 'stockflow_super_secret_jwt_key_2026';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Session has expired, please log in again');
      }
      return errorResponse(res, 401, 'Invalid authentication token');
    }

    if (!decoded || !decoded.userId) {
      return errorResponse(res, 401, 'Invalid token payload');
    }

    // Retrieve user and their organization
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return errorResponse(res, 401, 'User account not found');
    }

    if (!user.organization) {
      return errorResponse(res, 403, 'User does not belong to any valid organization');
    }

    // Attach verified user and organization context
    req.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
    };

    req.organization = {
      id: user.organization.id,
      name: user.organization.name,
      defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(res, 500, 'Authentication error');
  }
};

module.exports = {
  authenticate,
};
