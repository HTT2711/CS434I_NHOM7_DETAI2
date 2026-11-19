const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('Order Module API Tests', () => {
  let adminToken = '';
  let sampleTable = null;
  let sampleMenuItem = null;
  let createdOrder = null;

  beforeAll(async () => {
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: '123456' });
    adminToken = loginRes.body.data.token;

    sampleTable = await prisma.table.findFirst();
    sampleMenuItem = await prisma.menuItem.findFirst();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should fail to create order without items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ tableId: sampleTable.id, items: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully create an order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        tableId: sampleTable.id,
        items: [
          { menuItemId: sampleMenuItem.id, quantity: 2, note: 'Ít cay' },
        ],
        note: 'Bàn cạnh cửa sổ',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('orderNumber');
    expect(res.body.data.items.length).toBe(1);
    createdOrder = res.body.data;
  });

  it('should fetch order by ID', async () => {
    const res = await request(app).get(`/api/orders/${createdOrder.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdOrder.id);
  });

  it('should update order status with staff token', async () => {
    const res = await request(app)
      .patch(`/api/orders/${createdOrder.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'COOKING' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COOKING');
  });
});
