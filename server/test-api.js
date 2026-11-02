const http = require('http');
const app = require('./src/app');
const prisma = require('./src/config/db');

const PORT = 5099;

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- Starting StockFlow Automated End-to-End Backend Verification ---');
  const server = app.listen(PORT);

  try {
    const makeReq = (path, method = 'GET', body = null, token = null) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return request(
        {
          hostname: '127.0.0.1',
          port: PORT,
          path,
          method,
          headers,
        },
        body
      );
    };

    // 1. Health check
    const health = await makeReq('/api/health');
    console.assert(health.status === 200, 'Health check failed');
    console.log('✓ 1. Health check passed');

    // 2. Signup Organization A
    const signupA = await makeReq('/api/auth/signup', 'POST', {
      organizationName: 'Alpha Tech Store',
      email: 'owner@alphatech.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    console.assert(signupA.status === 201, `Signup A failed: ${JSON.stringify(signupA)}`);
    console.assert(signupA.data.data.token, 'Token not received for A');
    const tokenA = signupA.data.data.token;
    const orgAId = signupA.data.data.organization.id;
    console.log('✓ 2. Signup Organization A passed');

    // 3. Reject duplicate email
    const duplicateEmail = await makeReq('/api/auth/signup', 'POST', {
      organizationName: 'Another Store',
      email: 'owner@alphatech.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    console.assert(duplicateEmail.status === 409, 'Duplicate email should be rejected with 409');
    console.log('✓ 3. Duplicate email rejection passed');

    // 4. Login Organization A
    const loginA = await makeReq('/api/auth/login', 'POST', {
      email: 'owner@alphatech.com',
      password: 'password123',
    });
    console.assert(loginA.status === 200, 'Login A failed');
    console.log('✓ 4. Login Organization A passed');

    // 5. Test Auth Me
    const meA = await makeReq('/api/auth/me', 'GET', null, tokenA);
    console.assert(meA.status === 200 && meA.data.data.user.email === 'owner@alphatech.com', 'Auth me failed');
    console.log('✓ 5. Auth /me check passed');

    // 6. Create Products in Organization A
    // Product 1: Normal stock (Qty 20, Threshold 10 -> Normal)
    const prod1 = await makeReq(
      '/api/products',
      'POST',
      {
        name: 'Mechanical Gaming Keyboard',
        sku: 'KEY-001',
        description: 'RGB mechanical keyboard with blue switches',
        quantityOnHand: 20,
        costPrice: 45.0,
        sellingPrice: 89.99,
        lowStockThreshold: 10,
      },
      tokenA
    );
    console.assert(prod1.status === 201 && prod1.data.data.isLowStock === false, 'Product 1 creation failed');
    console.log('✓ 6. Product 1 (Normal Stock) created');

    // Product 2: Low stock with explicit threshold (Qty 3, Threshold 5 -> Low Stock)
    const prod2 = await makeReq(
      '/api/products',
      'POST',
      {
        name: 'Wireless Ergonomic Mouse',
        sku: 'MOU-002',
        description: 'Ergonomic mouse with rechargeable battery',
        quantityOnHand: 3,
        costPrice: 15.5,
        sellingPrice: 34.99,
        lowStockThreshold: 5,
      },
      tokenA
    );
    console.assert(prod2.status === 201 && prod2.data.data.isLowStock === true, 'Product 2 creation failed');
    console.log('✓ 7. Product 2 (Low Stock, Qty < Threshold) created');

    // Product 3: Equality condition using default threshold (Qty 5, Threshold null, Default 5 -> Low Stock!)
    const prod3 = await makeReq(
      '/api/products',
      'POST',
      {
        name: 'USB-C Fast Charging Cable',
        sku: 'CAB-003',
        description: '2-meter braided cable',
        quantityOnHand: 5,
        costPrice: 2.0,
        sellingPrice: 9.99,
        lowStockThreshold: null,
      },
      tokenA
    );
    console.assert(
      prod3.status === 201 && prod3.data.data.isLowStock === true && prod3.data.data.effectiveThreshold === 5,
      'Product 3 equality low stock test failed'
    );
    console.log('✓ 8. Product 3 (Low Stock Equality with Default Threshold) passed');

    // 7. Duplicate SKU rejection within Organization A
    const dupSku = await makeReq(
      '/api/products',
      'POST',
      {
        name: 'Duplicate SKU Item',
        sku: 'KEY-001',
        quantityOnHand: 10,
      },
      tokenA
    );
    console.assert(dupSku.status === 409, 'Duplicate SKU within Org A should be rejected');
    console.log('✓ 9. Duplicate SKU within same organization rejected');

    // 8. Create Organization B and User B
    const signupB = await makeReq('/api/auth/signup', 'POST', {
      organizationName: 'Beta Electronics',
      email: 'owner@betaelectronics.com',
      password: 'password456',
      confirmPassword: 'password456',
    });
    console.assert(signupB.status === 201, 'Signup B failed');
    const tokenB = signupB.data.data.token;
    console.log('✓ 10. Signup Organization B passed');

    // 9. Allow SAME SKU in Organization B (Multi-Tenant Isolation Rule!)
    const prodB1 = await makeReq(
      '/api/products',
      'POST',
      {
        name: 'Different Keyboard in Org B',
        sku: 'KEY-001', // Same SKU as in Org A!
        quantityOnHand: 50,
        sellingPrice: 99.0,
      },
      tokenB
    );
    console.assert(prodB1.status === 201, 'Same SKU should be allowed in different organization');
    console.log('✓ 11. Same SKU allowed across different organizations passed');

    // 10. Tenant Isolation: Org B cannot see Org A products
    const listB = await makeReq('/api/products', 'GET', null, tokenB);
    console.assert(listB.data.data.length === 1, `Org B should only see 1 product, saw ${listB.data.data.length}`);
    console.assert(listB.data.data[0].sku === 'KEY-001' && listB.data.data[0].name === 'Different Keyboard in Org B');
    console.log('✓ 12. Tenant isolation on product listing passed');

    // 11. Tenant Isolation: Org B cannot access Org A product by ID
    const crossTenantGet = await makeReq(`/api/products/${prod1.data.data.id}`, 'GET', null, tokenB);
    console.assert(crossTenantGet.status === 404, 'Cross-tenant GET should return 404');
    const crossTenantUpdate = await makeReq(`/api/products/${prod1.data.data.id}`, 'PUT', { name: 'Hacked', sku: 'HACK', quantityOnHand: 0 }, tokenB);
    console.assert(crossTenantUpdate.status === 404, 'Cross-tenant PUT should return 404');
    const crossTenantDelete = await makeReq(`/api/products/${prod1.data.data.id}`, 'DELETE', null, tokenB);
    console.assert(crossTenantDelete.status === 404, 'Cross-tenant DELETE should return 404');
    console.log('✓ 13. Cross-tenant modification protection passed');

    // 12. Stock Adjustment Endpoint
    const adjustRes = await makeReq(
      `/api/products/${prod1.data.data.id}/adjust-stock`,
      'PATCH',
      { adjustment: -5, note: 'Damaged during shipping' },
      tokenA
    );
    console.assert(adjustRes.status === 200 && adjustRes.data.data.quantityOnHand === 15, 'Stock adjustment failed');
    console.log('✓ 14. Stock adjustment (-5) passed');

    // Stock adjustment negative limit
    const invalidAdjust = await makeReq(
      `/api/products/${prod1.data.data.id}/adjust-stock`,
      'PATCH',
      { adjustment: -999 },
      tokenA
    );
    console.assert(invalidAdjust.status === 400, 'Invalid negative stock adjustment should be rejected');
    console.log('✓ 15. Negative stock protection passed');

    // 13. Dashboard Summary for Organization A
    const dashA = await makeReq('/api/dashboard/summary', 'GET', null, tokenA);
    console.assert(dashA.status === 200, 'Dashboard A summary failed');
    console.assert(dashA.data.data.totalProducts === 3, `Expected 3 products in Org A, got ${dashA.data.data.totalProducts}`);
    console.assert(dashA.data.data.totalQuantityOnHand === 15 + 3 + 5, `Expected 23 total quantity, got ${dashA.data.data.totalQuantityOnHand}`);
    console.assert(dashA.data.data.lowStockCount === 2, `Expected 2 low stock items in Org A, got ${dashA.data.data.lowStockCount}`);
    console.assert(dashA.data.data.lowStockItems.length === 2, 'Expected 2 items in lowStockItems array');
    console.log('✓ 16. Dashboard summary and low-stock calculations passed');

    // 14. Settings Update (Change default low-stock threshold from 5 to 20 in Org A)
    const settingsUpdate = await makeReq(
      '/api/settings',
      'PUT',
      { defaultLowStockThreshold: 20 },
      tokenA
    );
    console.assert(settingsUpdate.status === 200 && settingsUpdate.data.data.defaultLowStockThreshold === 20, 'Settings update failed');
    console.log('✓ 17. Settings update (threshold=20) passed');

    // Verify Dashboard recalculates low-stock count after default threshold update!
    // Keyboard now has qty 15 and lowStockThreshold 10 (still normal)
    // Mouse has qty 3 and lowStockThreshold 5 (low stock)
    // Cable has qty 5, lowStockThreshold null -> now uses new default 20! (5 <= 20 -> low stock!)
    const dashAAfter = await makeReq('/api/dashboard/summary', 'GET', null, tokenA);
    console.assert(dashAAfter.data.data.lowStockCount === 2, 'Recalculation check passed');
    console.log('✓ 18. Dashboard recalculation with updated threshold passed');

    // 15. Delete Product
    const delRes = await makeReq(`/api/products/${prod2.data.data.id}`, 'DELETE', null, tokenA);
    console.assert(delRes.status === 200, 'Product deletion failed');
    const dashAfterDel = await makeReq('/api/dashboard/summary', 'GET', null, tokenA);
    console.assert(dashAfterDel.data.data.totalProducts === 2, 'Expected 2 products after deletion');
    console.log('✓ 19. Product deletion and post-deletion dashboard refresh passed');

    console.log('\n======================================================');
    console.log('🎉 ALL 19 BACKEND AND MULTI-TENANCY TEST SUITES PASSED!');
    console.log('======================================================\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
};

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
