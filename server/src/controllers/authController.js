const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { successResponse, errorResponse } = require('../utils/response');

const generateToken = (userId, organizationId) => {
  return jwt.sign({ userId, organizationId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const signup = async (req, res, next) => {
  try {
    const { organizationName, email, password } = req.body;

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(res, 409, 'An account with this email address already exists');
    }

    // Hash password using bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Atomically create Organization and Owner User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          defaultLowStockThreshold: 5,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          organizationId: organization.id,
        },
      });

      return { organization, user };
    });

    // Generate JWT token
    const token = generateToken(result.user.id, result.organization.id);

    return successResponse(res, 201, 'Account and organization created successfully', {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        organizationId: result.user.organizationId,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        defaultLowStockThreshold: result.organization.defaultLowStockThreshold,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Verify password against hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    if (!user.organization) {
      return errorResponse(res, 403, 'Account is not associated with an active organization');
    }

    // Generate JWT token
    const token = generateToken(user.id, user.organizationId);

    return successResponse(res, 200, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return errorResponse(res, 404, 'User or organization record not found');
    }

    return successResponse(res, 200, 'Current session retrieved', {
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
};
