const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('Invoice Module API Tests', () => {
  let cashierToken = '';
  let testOrder = null;
  let testInvoice = null;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'cashier', password: '123456' });
    cashierToken = loginRes.body.data.token;

    const table = await prisma.table.findFirst();
    const item = await prisma.menuItem.findFirst();

    // Create an order for invoice test
    const orderRes = await request(app)
      .post('/api/orders')
      .send({
        tableId: table.id,
        items: [{ menuItemId: item.id, quantity: 2, note: '' }],
      });
    testOrder = orderRes.body.data;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should split bill (US14) from active order', async () => {
    const firstDetailId = testOrder.items[0].id;
    const splitRes = await request(app)
      .post('/api/invoices/split-bill')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        orderId: testOrder.id,
        itemsToSplit: [{ orderDetailId: firstDetailId, quantity: 1 }],
      });

    expect(splitRes.status).toBe(200);
    expect(splitRes.body.success).toBe(true);
    expect(splitRes.body.data).toHaveProperty('splitOrder');
  });

  it('should create an invoice and complete the order (US15)', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        orderId: testOrder.id,
        discount: 5000,
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('invoiceNumber');
    expect(res.body.data.order.status).toBe('COMPLETED');
    testInvoice = res.body.data;
  });

  it('should fail when creating invoice for already paid order', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        orderId: testOrder.id,
        discount: 0,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should get invoice by order ID', async () => {
    const res = await request(app)
      .get(`/api/invoices/order/${testOrder.id}`)
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testInvoice.id);
  });
});
