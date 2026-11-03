const http = require('http');
const assert = require('node:assert/strict');
const app = require('./src/app');
const prisma = require('./src/config/db');

const TEST_PORT = 5098;
const RUN_ID = Date.now();

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
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

const makeReq = (path, method = 'GET', body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request(
    {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers,
    },
    body
  );
};

const makeCorsReq = ({ path, method = 'OPTIONS', headers = {}, body = null }) => {
  return request(
    {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers,
    },
    body
  );
};

let testCount = 0;
let passedCount = 0;

const testCase = async (name, fn) => {
  testCount++;
  try {
    await fn();
    passedCount++;
    console.log(`  ✓ [TEST ${testCount}] ${name}`);
  } catch (err) {
    console.error(`  ❌ [TEST ${testCount} FAILED] ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
};

const runAllTests = async () => {
  console.log('\n================================================================');
  console.log('   StockFlow Production Test Suite & Security Audit Verification');
  console.log('================================================================\n');

  const server = app.listen(TEST_PORT);
  const createdOrgIds = [];

  try {
    // ---------------------------------------------------------------
    // 1. HEALTH CHECK & INFRASTRUCTURE
    // ---------------------------------------------------------------
    console.log('--- Suite 1: Health & System Infrastructure ---');

    await testCase('Health check returns 200 with active status and uptime', async () => {
      const res = await makeReq('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, 'ok');
      assert.ok(typeof res.data.data.uptimeSeconds === 'number');
    });

    // ---------------------------------------------------------------
    // 1B. CORS POLICY & PREFLIGHT VERIFICATION
    // ---------------------------------------------------------------
    console.log('\n--- Suite 1B: Centralized CORS Policy & Preflight Security ---');

    await testCase('Test A: Production Vercel origin preflight returns 204 with correct headers', async () => {
      const res = await makeCorsReq({
        path: '/api/auth/signup',
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://stock-flow-theta-five.vercel.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      assert.ok([200, 204].includes(res.status), `Expected status 200 or 204, got ${res.status}`);
      assert.equal(res.headers['access-control-allow-origin'], 'https://stock-flow-theta-five.vercel.app');
      assert.ok(res.headers['access-control-allow-methods'].includes('POST'));
      assert.ok(res.headers['access-control-allow-headers'].toLowerCase().includes('content-type'));
    });

    await testCase('Test B: Local development origin (http://localhost:5173) is permitted', async () => {
      const res = await makeCorsReq({
        path: '/api/auth/signup',
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      assert.ok([200, 204].includes(res.status), `Expected status 200 or 204, got ${res.status}`);
      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    });

    await testCase('Test C: Untrusted origin (https://malicious-example.invalid) receives no permissive CORS header', async () => {
      const res = await makeCorsReq({
        path: '/api/auth/signup',
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-example.invalid',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      // Should reject with 403 or omit Access-Control-Allow-Origin
      assert.notEqual(res.headers['access-control-allow-origin'], 'https://malicious-example.invalid');
      assert.ok(res.status === 403 || !res.headers['access-control-allow-origin']);
    });

    await testCase('Test D: OPTIONS preflight on protected endpoint succeeds without JWT authentication', async () => {
      const res = await makeCorsReq({
        path: '/api/products',
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://stock-flow-theta-five.vercel.app',
          'Access-Control-Request-Method': 'GET',
        },
      });
      assert.ok([200, 204].includes(res.status), `Expected status 200 or 204, got ${res.status}`);
      assert.equal(res.headers['access-control-allow-origin'], 'https://stock-flow-theta-five.vercel.app');
    });

    await testCase('Test E: Actual POST with production origin includes CORS headers and reaches controller', async () => {
      const emailCors = `test-cors-${RUN_ID}@example.com`;
      const res = await makeCorsReq({
        path: '/api/auth/signup',
        method: 'POST',
        headers: {
          'Origin': 'https://stock-flow-theta-five.vercel.app',
          'Content-Type': 'application/json',
        },
        body: {
          organizationName: `CORS Test Org ${RUN_ID}`,
          email: emailCors,
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.headers['access-control-allow-origin'], 'https://stock-flow-theta-five.vercel.app');
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.token);
      if (res.data.data.organization?.id) {
        createdOrgIds.push(res.data.data.organization.id);
      }
    });

    // ---------------------------------------------------------------
    // 2. AUTHENTICATION MODULE & VALIDATION
    // ---------------------------------------------------------------
    console.log('\n--- Suite 2: Authentication & Token Security ---');

    const emailA = `test-owner-a-${RUN_ID}@example.com`;
    const emailB = `test-owner-b-${RUN_ID}@example.com`;
    let tokenA = '';
    let orgAId = '';
    let tokenB = '';
    let orgBId = '';

    await testCase('Signup creates organization and user atomically', async () => {
      const res = await makeReq('/api/auth/signup', 'POST', {
        organizationName: `Apex Logistics ${RUN_ID}`,
        email: emailA,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.token);
      assert.equal(res.data.data.user.email, emailA);
      assert.equal(res.data.data.organization.defaultLowStockThreshold, 5);

      tokenA = res.data.data.token;
      orgAId = res.data.data.organization.id;
      createdOrgIds.push(orgAId);
    });

    await testCase('Duplicate email registration is rejected with 409', async () => {
      const res = await makeReq('/api/auth/signup', 'POST', {
        organizationName: 'Duplicate Inc',
        email: emailA,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
    });

    await testCase('Registration rejects password mismatch with 400', async () => {
      const res = await makeReq('/api/auth/signup', 'POST', {
        organizationName: 'Mismatch Inc',
        email: `mismatch-${RUN_ID}@example.com`,
        password: 'Password123!',
        confirmPassword: 'DifferentPassword!',
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    await testCase('Successful login returns JWT and user/organization context', async () => {
      const res = await makeReq('/api/auth/login', 'POST', {
        email: emailA,
        password: 'Password123!',
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.token);
      assert.equal(res.data.data.user.email, emailA);
    });

    await testCase('Login with wrong password returns 401', async () => {
      const res = await makeReq('/api/auth/login', 'POST', {
        email: emailA,
        password: 'IncorrectPassword',
      });

      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    await testCase('Login with nonexistent email returns 401', async () => {
      const res = await makeReq('/api/auth/login', 'POST', {
        email: `ghost-${RUN_ID}@example.com`,
        password: 'Password123!',
      });

      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    await testCase('Protected route rejects unauthenticated requests with 401', async () => {
      const res = await makeReq('/api/auth/me', 'GET', null, null);
      assert.equal(res.status, 401);
    });

    await testCase('Protected route rejects invalid JWT token with 401', async () => {
      const res = await makeReq('/api/auth/me', 'GET', null, 'invalid.tampered.token');
      assert.equal(res.status, 401);
    });

    await testCase('GET /api/auth/me retrieves active user and organization session', async () => {
      const res = await makeReq('/api/auth/me', 'GET', null, tokenA);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.user.email, emailA);
      assert.equal(res.data.data.organization.id, orgAId);
    });

    // ---------------------------------------------------------------
    // 3. MULTI-TENANCY & CROSS-TENANT ISOLATION
    // ---------------------------------------------------------------
    console.log('\n--- Suite 3: Multi-Tenancy & Tenant Data Isolation ---');

    await testCase('Signup Organization B for multi-tenant isolation verification', async () => {
      const res = await makeReq('/api/auth/signup', 'POST', {
        organizationName: `Zenith Retail ${RUN_ID}`,
        email: emailB,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      assert.equal(res.status, 201);
      tokenB = res.data.data.token;
      orgBId = res.data.data.organization.id;
      createdOrgIds.push(orgBId);
      assert.notEqual(orgAId, orgBId);
    });

    let prodA1Id = '';
    const sharedSku = `SKU-SHARED-${RUN_ID}`;

    await testCase('Organization A creates Product with SKU', async () => {
      const res = await makeReq(
        '/api/products',
        'POST',
        {
          name: 'Org A Office Chair',
          sku: sharedSku,
          description: 'Ergonomic lumbar chair',
          quantityOnHand: 25,
          costPrice: 50.0,
          sellingPrice: 120.0,
          lowStockThreshold: 10,
        },
        tokenA
      );

      assert.equal(res.status, 201);
      assert.equal(res.data.data.sku, sharedSku);
      assert.equal(res.data.data.isLowStock, false); // 25 > 10
      prodA1Id = res.data.data.id;
    });

    await testCase('Duplicate SKU within same organization is rejected with 409', async () => {
      const res = await makeReq(
        '/api/products',
        'POST',
        {
          name: 'Duplicate Chair',
          sku: sharedSku,
          quantityOnHand: 5,
        },
        tokenA
      );

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
    });

    await testCase('Same SKU in DIFFERENT organization is permitted (Cross-tenant SKU independence)', async () => {
      const res = await makeReq(
        '/api/products',
        'POST',
        {
          name: 'Org B Office Chair',
          sku: sharedSku, // Exact same SKU string as in Org A
          quantityOnHand: 40,
          sellingPrice: 135.0,
        },
        tokenB
      );

      assert.equal(res.status, 201);
      assert.equal(res.data.data.sku, sharedSku);
      assert.equal(res.data.data.organizationId, orgBId);
    });

    await testCase('Tenant isolation: Organization B product list contains zero Org A products', async () => {
      const res = await makeReq('/api/products', 'GET', null, tokenB);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.length, 1);
      assert.equal(res.data.data[0].organizationId, orgBId);
      assert.equal(res.data.data[0].name, 'Org B Office Chair');
    });

    await testCase('Tenant isolation: Org B receives 404 when attempting to read Org A product ID', async () => {
      const res = await makeReq(`/api/products/${prodA1Id}`, 'GET', null, tokenB);
      assert.equal(res.status, 404);
    });

    await testCase('Tenant isolation: Org B receives 404 when attempting to update Org A product ID', async () => {
      const res = await makeReq(
        `/api/products/${prodA1Id}`,
        'PUT',
        {
          name: 'Malicious Update',
          sku: sharedSku,
          quantityOnHand: 999,
        },
        tokenB
      );
      assert.equal(res.status, 404);
    });

    await testCase('Tenant isolation: Org B receives 404 when attempting to delete Org A product ID', async () => {
      const res = await makeReq(`/api/products/${prodA1Id}`, 'DELETE', null, tokenB);
      assert.equal(res.status, 404);
    });

    await testCase('Tenant isolation: Org B receives 404 when attempting to adjust Org A product stock', async () => {
      const res = await makeReq(
        `/api/products/${prodA1Id}/adjust-stock`,
        'PATCH',
        { adjustment: -10 },
        tokenB
      );
      assert.equal(res.status, 404);
    });

    // ---------------------------------------------------------------
    // 4. ATOMIC STOCK ADJUSTMENTS & CONCURRENCY
    // ---------------------------------------------------------------
    console.log('\n--- Suite 4: Atomic Stock Management & Concurrency ---');

    await testCase('Positive stock adjustment atomically increments quantity and records note', async () => {
      const res = await makeReq(
        `/api/products/${prodA1Id}/adjust-stock`,
        'PATCH',
        { adjustment: 15, note: 'Shipment received from manufacturer' },
        tokenA
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.quantityOnHand, 40); // 25 + 15 = 40
      assert.equal(res.data.data.lastAdjustmentNote, 'Shipment received from manufacturer');
    });

    await testCase('Negative stock adjustment atomically decrements quantity', async () => {
      const res = await makeReq(
        `/api/products/${prodA1Id}/adjust-stock`,
        'PATCH',
        { adjustment: -10, note: 'Sold 10 units' },
        tokenA
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.quantityOnHand, 30); // 40 - 10 = 30
      assert.equal(res.data.data.lastAdjustmentNote, 'Sold 10 units');
    });

    await testCase('Negative stock adjustment beyond available stock is rejected with 400', async () => {
      const res = await makeReq(
        `/api/products/${prodA1Id}/adjust-stock`,
        'PATCH',
        { adjustment: -999, note: 'Excessive reduction' },
        tokenA
      );

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.ok(res.data.message.includes('Cannot reduce stock'));
    });

    await testCase('Zero adjustment amount is rejected by validation with 400', async () => {
      const res = await makeReq(
        `/api/products/${prodA1Id}/adjust-stock`,
        'PATCH',
        { adjustment: 0 },
        tokenA
      );

      assert.equal(res.status, 400);
    });

    await testCase('Concurrent simultaneous adjustments execute atomically without lost updates', async () => {
      // Execute 5 concurrent increments of +5 simultaneously
      const promises = [
        makeReq(`/api/products/${prodA1Id}/adjust-stock`, 'PATCH', { adjustment: 5, note: 'Batch 1' }, tokenA),
        makeReq(`/api/products/${prodA1Id}/adjust-stock`, 'PATCH', { adjustment: 5, note: 'Batch 2' }, tokenA),
        makeReq(`/api/products/${prodA1Id}/adjust-stock`, 'PATCH', { adjustment: 5, note: 'Batch 3' }, tokenA),
        makeReq(`/api/products/${prodA1Id}/adjust-stock`, 'PATCH', { adjustment: 5, note: 'Batch 4' }, tokenA),
        makeReq(`/api/products/${prodA1Id}/adjust-stock`, 'PATCH', { adjustment: 5, note: 'Batch 5' }, tokenA),
      ];

      const results = await Promise.all(promises);
      results.forEach((r) => assert.equal(r.status, 200));

      // Initial was 30; 5 batches of +5 = 30 + 25 = 55
      const verifyRes = await makeReq(`/api/products/${prodA1Id}`, 'GET', null, tokenA);
      assert.equal(verifyRes.data.data.quantityOnHand, 55);
    });

    // ---------------------------------------------------------------
    // 5. LOW-STOCK BUSINESS RULE & INCLUSIVE EQUALITY (Q <= T)
    // ---------------------------------------------------------------
    console.log('\n--- Suite 5: Low-Stock Intelligence & Inclusive Equality ---');

    let prodLowExplicit = '';
    let prodLowDefault = '';

    await testCase('Product with Qty < Custom Threshold is flagged as Low Stock', async () => {
      const res = await makeReq(
        '/api/products',
        'POST',
        {
          name: 'Wireless Mouse',
          sku: `MOU-${RUN_ID}`,
          quantityOnHand: 4,
          lowStockThreshold: 10,
        },
        tokenA
      );

      assert.equal(res.status, 201);
      assert.equal(res.data.data.isLowStock, true);
      assert.equal(res.data.data.effectiveThreshold, 10);
      prodLowExplicit = res.data.data.id;
    });

    await testCase('Product with Qty = Custom Threshold is flagged as Low Stock (Inclusive Equality Rule)', async () => {
      const res = await makeReq(
        '/api/products',
        'POST',
        {
          name: 'USB-C Cable',
          sku: `CAB-${RUN_ID}`,
          quantityOnHand: 8,
          lowStockThreshold: 8, // Quantity equals threshold!
        },
        tokenA
      );

      assert.equal(res.status, 201);
      assert.equal(res.data.data.isLowStock, true);
    });

    await testCase('Product with null custom threshold adopts Organization default (5) and handles equality', async () => {
      const res = await makeReq(
        '/api/products',
        'POST',
        {
          name: 'HDMI Adapter',
          sku: `HDM-${RUN_ID}`,
          quantityOnHand: 5, // Qty 5 equals Org default threshold of 5!
          lowStockThreshold: null,
        },
        tokenA
      );

      assert.equal(res.status, 201);
      assert.equal(res.data.data.effectiveThreshold, 5);
      assert.equal(res.data.data.isLowStock, true); // 5 <= 5
      prodLowDefault = res.data.data.id;
    });

    await testCase('Product with Qty > Effective Threshold is flagged as Normal (not low stock)', async () => {
      const res = await makeReq(
        '/api/products',
        'POST',
        {
          name: 'Power Bank 20000mAh',
          sku: `PWR-${RUN_ID}`,
          quantityOnHand: 15,
          lowStockThreshold: null, // Uses default 5; 15 > 5
        },
        tokenA
      );

      assert.equal(res.status, 201);
      assert.equal(res.data.data.effectiveThreshold, 5);
      assert.equal(res.data.data.isLowStock, false);
    });

    // ---------------------------------------------------------------
    // 6. DASHBOARD AGGREGATIONS & SETTINGS RECALCULATION
    // ---------------------------------------------------------------
    console.log('\n--- Suite 6: Dashboard Metrics & Settings Recalculation ---');

    await testCase('Dashboard summary computes exact products, stock, and low-stock count for Org A', async () => {
      const res = await makeReq('/api/dashboard/summary', 'GET', null, tokenA);
      assert.equal(res.status, 200);

      const { totalProducts, totalQuantityOnHand, lowStockCount, lowStockItems } = res.data.data;
      assert.equal(totalProducts, 5); // Chair (55), Mouse (4), Cable (8), HDMI (5), Power Bank (15)
      assert.equal(totalQuantityOnHand, 55 + 4 + 8 + 5 + 15); // 87
      assert.equal(lowStockCount, 3); // Mouse, Cable, HDMI
      assert.equal(lowStockItems.length, 3);
    });

    await testCase('Updating Organization default low-stock threshold persists and dynamically updates calculations', async () => {
      // Change default threshold from 5 to 20
      const updateRes = await makeReq('/api/settings', 'PUT', { defaultLowStockThreshold: 20 }, tokenA);
      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.data.data.defaultLowStockThreshold, 20);

      // Now Power Bank (qty 15, no custom threshold) should dynamically become low-stock because 15 <= 20!
      const dashRes = await makeReq('/api/dashboard/summary', 'GET', null, tokenA);
      assert.equal(dashRes.status, 200);
      assert.equal(dashRes.data.data.lowStockCount, 4); // Mouse, Cable, HDMI, Power Bank
    });

    await testCase('Negative default low-stock threshold is rejected with 400', async () => {
      const res = await makeReq('/api/settings', 'PUT', { defaultLowStockThreshold: -5 }, tokenA);
      assert.equal(res.status, 400);
    });

    // ---------------------------------------------------------------
    // 7. PRODUCT DELETION & POST-DELETION AUDIT
    // ---------------------------------------------------------------
    console.log('\n--- Suite 7: Product Deletion & Cleanup ---');

    await testCase('Product deletion removes item and updates dashboard count', async () => {
      const delRes = await makeReq(`/api/products/${prodLowDefault}`, 'DELETE', null, tokenA);
      assert.equal(delRes.status, 200);

      // Verify item no longer found
      const getRes = await makeReq(`/api/products/${prodLowDefault}`, 'GET', null, tokenA);
      assert.equal(getRes.status, 404);

      // Verify dashboard total products reduced from 5 to 4
      const dashRes = await makeReq('/api/dashboard/summary', 'GET', null, tokenA);
      assert.equal(dashRes.data.data.totalProducts, 4);
    });

    // ---------------------------------------------------------------
    // FINAL SUMMARY
    // ---------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedCount} / ${testCount} TEST CASES PASSED WITH 100% SUCCESS!`);
    console.log('   Strict Node.js assertions confirmed zero failures.');
    console.log('================================================================\n');
  } finally {
    // Clean up created test organizations and cascade related data
    if (createdOrgIds.length > 0) {
      await prisma.organization.deleteMany({
        where: { id: { in: createdOrgIds } },
      }).catch((e) => console.warn('Test cleanup warning:', e.message));
    }
    server.close();
    await prisma.$disconnect();
  }
};

runAllTests().catch((err) => {
  console.error('\n❌ TEST RUNNER ABORTED WITH UNHANDLED ERROR:\n', err);
  process.exit(1);
});
