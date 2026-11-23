const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('--- BẮT ĐẦU NẠP DỮ LIỆU THỰC TẾ CHUẨN TASTY HOUSE ---');

  // 1. Nhân sự (Users)
  const passwordHash = await bcrypt.hash('123456', 10);
  const usersData = [
    { username: 'admin', password: passwordHash, fullName: 'Nguyễn Minh Anh', role: 'ADMIN', isActive: true },
    { username: 'cashier', password: passwordHash, fullName: 'Trần Thu Hà', role: 'CASHIER', isActive: true },
    { username: 'thungan2', password: passwordHash, fullName: 'Vũ Thảo Vy', role: 'CASHIER', isActive: true },
    { username: 'kitchen', password: passwordHash, fullName: 'Lê Quốc Huy', role: 'KITCHEN', isActive: true },
    { username: 'bep2', password: passwordHash, fullName: 'Phạm Hoàng Nam', role: 'KITCHEN', isActive: true },
    { username: 'waiter1', password: passwordHash, fullName: 'Nguyễn Tiến Đạt', role: 'WAITER', isActive: true },
  ];

  // Xóa tài khoản thử nghiệm cũ nếu có
  await prisma.user.deleteMany({
    where: {
      username: { in: ['user', 'test', 'staff_test_0186', 'testuser_1'] },
    },
  }).catch(() => {});

  const createdUsers = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { password: u.password, fullName: u.fullName, role: u.role, isActive: u.isActive },
      create: u,
    });
    createdUsers[u.username] = user;
  }
  console.log('✔ Đã tạo danh sách nhân sự chính thức (6 nhân viên)');

  // 2. Dọn dẹp dữ liệu đơn hàng cũ để nạp dữ liệu chuẩn đồng bộ
  await prisma.invoice.deleteMany({});
  await prisma.orderDetail.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.supportRequest.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});

  // 3. Bàn ăn (Tables - 12 bàn chuẩn chia theo Tầng 1, Tầng 2, Sân vườn)
  const tablesData = [
    { tableNumber: 'Bàn 1', area: 'Tầng 1', capacity: 2, status: 'AVAILABLE', token: 'TB01' },
    { tableNumber: 'Bàn 2', area: 'Tầng 1', capacity: 4, status: 'OCCUPIED', token: 'TB02' },
    { tableNumber: 'Bàn 3', area: 'Tầng 1', capacity: 6, status: 'AVAILABLE', token: 'TB03' },
    { tableNumber: 'Bàn 4', area: 'Tầng 1', capacity: 4, status: 'AVAILABLE', token: 'TB04' },
    { tableNumber: 'Bàn 5', area: 'Tầng 1', capacity: 2, status: 'OCCUPIED', token: 'TB05' },
    { tableNumber: 'Bàn 6', area: 'Tầng 1', capacity: 6, status: 'AVAILABLE', token: 'TB06' },
    { tableNumber: 'Bàn 7', area: 'Tầng 2', capacity: 2, status: 'OCCUPIED', token: 'TB07' },
    { tableNumber: 'Bàn 8', area: 'Tầng 2', capacity: 4, status: 'AVAILABLE', token: 'TB08' },
    { tableNumber: 'Bàn 9', area: 'Tầng 2', capacity: 6, status: 'WAITING_PAYMENT', token: 'TB09' },
    { tableNumber: 'Bàn 10', area: 'Tầng 2', capacity: 4, status: 'AVAILABLE', token: 'TB10' },
    { tableNumber: 'Bàn 11', area: 'Sân vườn', capacity: 2, status: 'AVAILABLE', token: 'TB11' },
    { tableNumber: 'Bàn 12', area: 'Sân vườn', capacity: 6, status: 'AVAILABLE', token: 'TB12' },
  ];

  const createdTables = {};
  for (const t of tablesData) {
    const tbl = await prisma.table.create({ data: t });
    createdTables[tbl.tableNumber] = tbl;
  }
  console.log('✔ Đã tạo 12 bàn ăn tiêu chuẩn');

  // 4. Danh mục & Thực đơn phong phú ẩm thực Việt & Á
  const categoriesData = [
    {
      name: 'Khai vị',
      description: 'Món ăn nhẹ tươi mát, kích thích vị giác đầu bữa tiệc',
      items: [
        {
          name: 'Gỏi cuốn tôm thịt',
          price: 55000,
          description: 'Tôm tươi, thịt ba rọi luộc cuộn cùng bún tươi, hẹ xanh chấm tương đậu phộng thơm bùi',
          imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500',
        },
        {
          name: 'Nem rán Hà Nội giòn rụm',
          price: 60000,
          description: 'Nem thịt băm mộc nhĩ miến dong rán vàng ươm chấm nước mắm chua ngọt truyền thống',
          imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500',
        },
        {
          name: 'Salad cá hồi sốt mè rang',
          price: 65000,
          description: 'Cá hồi tươi Nauy cùng xà lách mầm organic và sốt mè rang thơm bùi dịu mát',
          imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
        },
        {
          name: 'Khoai tây chiên giòn bơ tỏi',
          price: 45000,
          description: 'Khoai tây sợi vàng ruộm lắc bơ tỏi thơm ngậy kèm tương cà và mayonnaise',
          imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
        },
        {
          name: 'Chả giò hải sản hoàng kim',
          price: 65000,
          description: 'Tôm, mực, sốt mayonnaise cuốn bánh tráng rế chiên vàng giòn rụm',
          imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500',
        },
      ],
    },
    {
      name: 'Món chính',
      description: 'Hương vị đậm đà, tinh hoa ẩm thực truyền thống Việt Nam',
      items: [
        {
          name: 'Cơm tấm sườn bì chả',
          price: 65000,
          description: 'Sườn nướng than hoa mật ong đậm đà, chả trứng béo ngậy, bì giòn thơm, mỡ hành óng ả',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
        },
        {
          name: 'Phở bò tái nạm',
          price: 65000,
          description: 'Nước dùng ninh xương bò 24h cùng thảo mộc thanh ngọt, bắp bò hoa và nạm mềm thơm',
          imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500',
        },
        {
          name: 'Bún bò Huế thượng hạng',
          price: 75000,
          description: 'Chả cua Huế, bắp hoa bò giòn rụm, giò heo ninh mềm cay nồng vị sả ruốc cố đô',
          imageUrl: 'https://images.unsplash.com/photo-1569058242252-623df46b5025?w=500',
        },
        {
          name: 'Bánh xèo vàng giòn Nam Bộ',
          price: 65000,
          description: 'Vỏ bánh mỏng giòn rụm sắc nghệ, nhân tôm sú, thịt ba chỉ, giá đỗ cuốn rau rừng',
          imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500',
        },
        {
          name: 'Bò bít tết sốt tiêu đen (200g)',
          price: 185000,
          description: 'Thăn bò Úc áp chảo bơ tỏi, sốt tiêu đen Phú Quốc thơm lừng kèm khoai tây nghiền',
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
        },
        {
          name: 'Cơm chiên hải sản hoàng kim',
          price: 95000,
          description: 'Cơm hạt tơi xốp đảo trứng muối cùng tôm sú, mực tươi và rau củ hạt sen',
          imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500',
        },
        {
          name: 'Mì Quảng tôm thịt trứng cút',
          price: 70000,
          description: 'Sợi mì gạo mềm mướt, nước xốt tôm thịt sánh mịn ăn kèm bánh tráng mè nướng giòn',
          imageUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=500',
        },
      ],
    },
    {
      name: 'Món nướng & Lẩu',
      description: 'Lẩu nghi ngút khói và đồ nướng than hồng thích hợp tụ họp',
      items: [
        {
          name: 'Lẩu Thái hải sản chua cay',
          price: 290000,
          description: 'Nước dùng chua thanh đậm vị tomyum, tôm càng, mực ống, nghêu trắng, nấm tươi và rau xanh',
          imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500',
        },
        {
          name: 'Bò nướng tảng sốt trứng muối',
          price: 220000,
          description: 'Thăn ngoại bò nướng than hoa thái lát chấm sốt trứng muối béo ngậy sánh mịn',
          imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500',
        },
        {
          name: 'Sườn cừu nướng sốt thảo mộc',
          price: 260000,
          description: 'Sườn cừu tươi tẩm ướp lá hương thảo và bơ tỏi nướng mọng nước',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
        },
        {
          name: 'Bạch tuộc sa tế nướng than hoa',
          price: 145000,
          description: 'Bạch tuộc tươi giòn sần sật ướp sốt sa tế cay nồng chấm muối ớt xanh',
          imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500',
        },
      ],
    },
    {
      name: 'Tráng miệng',
      description: 'Món ngọt trọn vị, thanh mát kết thúc bữa ăn',
      items: [
        {
          name: 'Bánh Tiramisu truyền thống Ý',
          price: 55000,
          description: 'Kem phô mai Mascarpone béo ngậy phủ bột cacao nguyên chất đượm hương cà phê',
          imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
        },
        {
          name: 'Chè hạt sen long nhãn thanh mát',
          price: 40000,
          description: 'Hạt sen bùi ninh đường phèn bọc cùi nhãn ngọt thơm ướp hoa nhài dịu mát',
          imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
        },
        {
          name: 'Panna Cotta dâu tây tươi',
          price: 45000,
          description: 'Kem sữa béo mịn tan trong miệng cùng sốt mứt dâu tây Đà Lạt chua ngọt',
          imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500',
        },
        {
          name: 'Kem dừa non sáp Trà Vinh',
          price: 50000,
          description: 'Kem dừa ngọt thanh tự nhiên rắc dừa nạo giòn và đậu phộng rang thơm lừng',
          imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500',
        },
      ],
    },
    {
      name: 'Đồ uống',
      description: 'Nước ép, sinh tố tươi mát và cà phê pha phin truyền thống',
      items: [
        {
          name: 'Trà đào cam sả thanh nhiệt',
          price: 45000,
          description: 'Trà đen ủ lạnh kết hợp đào miếng giòn ngọt, cam vàng mọng nước và sả tươi thanh mát',
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500',
        },
        {
          name: 'Cà phê muối Tasty House',
          price: 40000,
          description: 'Cà phê phin Robusta đậm đà phủ lớp kem muối mặn béo ngậy đặc quyền',
          imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
        },
        {
          name: 'Cà phê phin sữa đá truyền thống',
          price: 35000,
          description: 'Cà phê rang mộc nguyên chất pha phin hòa quyện cùng sữa đặc béo ngậy',
          imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500',
        },
        {
          name: 'Sinh tố xoài chanh dây',
          price: 50000,
          description: 'Xoài cát chín vàng xay mịn cùng chanh dây tươi mát lành giải nhiệt cơ thể',
          imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=500',
        },
        {
          name: 'Nước mía tắc sảng khoái',
          price: 35000,
          description: 'Nước mía ép tươi nguyên chất thơm ngát hương tắc tươi và đá mát lạnh',
          imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500',
        },
        {
          name: 'Khăn lạnh ướp hương',
          price: 10000,
          description: 'Khăn lạnh cao cấp ướp tinh dầu hoa bưởi thanh khiết sảng khoái',
          imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
        },
      ],
    },
  ];

  const createdItems = {};
  const allCreatedItemsList = [];
  for (const c of categoriesData) {
    const cat = await prisma.category.create({
      data: { name: c.name, description: c.description },
    });
    for (const it of c.items) {
      const item = await prisma.menuItem.create({
        data: {
          ...it,
          categoryId: cat.id,
          isSelling: true,
          isAvailable: true,
        },
      });
      createdItems[it.name] = item;
      allCreatedItemsList.push(item);
    }
  }
  console.log(`✔ Đã tạo ${categoriesData.length} danh mục & ${allCreatedItemsList.length} món ăn hấp dẫn`);

  // 5. Đơn hàng đang phục vụ trong ca hiện tại (Active Orders)
  // Đơn 1: Bàn 2 (DH0325 - 295.000đ - Đang chế biến)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-0325-101',
      tableId: createdTables['Bàn 2'].id,
      status: 'COOKING',
      totalAmount: 295000,
      note: 'Ưu tiên làm trước cho khách có trẻ nhỏ',
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
      items: {
        create: [
          { menuItemId: createdItems['Phở bò tái nạm'].id, quantity: 2, price: 65000, status: 'READY' },
          { menuItemId: createdItems['Gỏi cuốn tôm thịt'].id, quantity: 1, price: 55000, status: 'READY' },
          { menuItemId: createdItems['Trà đào cam sả thanh nhiệt'].id, quantity: 2, price: 45000, status: 'COOKING', note: 'ít đường' },
          { menuItemId: createdItems['Khăn lạnh ướp hương'].id, quantity: 2, price: 10000, status: 'READY' },
        ],
      },
    },
  });

  // Đơn 2: Bàn 5 (DH0326 - 170.000đ - Đang chế biến)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-0326-102',
      tableId: createdTables['Bàn 5'].id,
      status: 'COOKING',
      totalAmount: 170000,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      items: {
        create: [
          { menuItemId: createdItems['Cơm tấm sườn bì chả'].id, quantity: 2, price: 65000, status: 'COOKING' },
          { menuItemId: createdItems['Cà phê muối Tasty House'].id, quantity: 1, price: 40000, status: 'READY' },
        ],
      },
    },
  });

  // Đơn 3: Bàn 7 (DH0327 - 200.000đ - Đơn mới chờ Bếp nhận)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-0327-103',
      tableId: createdTables['Bàn 7'].id,
      status: 'PENDING',
      totalAmount: 200000,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      items: {
        create: [
          { menuItemId: createdItems['Cơm tấm sườn bì chả'].id, quantity: 2, price: 65000, status: 'PENDING', note: 'ít mỡ hành' },
          { menuItemId: createdItems['Nước mía tắc sảng khoái'].id, quantity: 2, price: 35000, status: 'PENDING', note: 'ít đá' },
        ],
      },
    },
  });

  // Đơn 4: Bàn 9 (DH0324 - 305.000đ - Chờ thanh toán)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-0324-104',
      tableId: createdTables['Bàn 9'].id,
      status: 'COOKING',
      totalAmount: 305000,
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
      items: {
        create: [
          { menuItemId: createdItems['Bò bít tết sốt tiêu đen (200g)'].id, quantity: 1, price: 185000, status: 'READY' },
          { menuItemId: createdItems['Nem rán Hà Nội giòn rụm'].id, quantity: 1, price: 60000, status: 'READY' },
          { menuItemId: createdItems['Sinh tố xoài chanh dây'].id, quantity: 1, price: 50000, status: 'READY' },
          { menuItemId: createdItems['Khăn lạnh ướp hương'].id, quantity: 1, price: 10000, status: 'READY' },
        ],
      },
    },
  });
  console.log('✔ Đã tạo 4 đơn hàng đang phục vụ trực tiếp');

  // 6. Lịch sử đơn hàng hoàn thành & Hóa đơn thanh toán thực tế (35 hóa đơn phong phú)
  const cashierUser = createdUsers['cashier'];
  const paymentMethodsList = ['CASH', 'BANK_TRANSFER', 'QR_CODE'];

  // Tạo dữ liệu trải dài trong ngày hôm nay, 7 ngày qua và 30 ngày qua
  const now = new Date();
  const sampleCompletedOrders = [
    // Hôm nay (Ca sáng & Ca trưa & Chiều)
    { tableNum: 'Bàn 1', hoursAgo: 1.5, items: [{ name: 'Phở bò tái nạm', qty: 2 }, { name: 'Cà phê phin sữa đá truyền thống', qty: 2 }], method: 'CASH', discount: 0 },
    { tableNum: 'Bàn 3', hoursAgo: 2.2, items: [{ name: 'Bún bò Huế thượng hạng', qty: 2 }, { name: 'Nem rán Hà Nội giòn rụm', qty: 1 }, { name: 'Trà đào cam sả thanh nhiệt', qty: 2 }], method: 'QR_CODE', discount: 20000 },
    { tableNum: 'Bàn 4', hoursAgo: 3.0, items: [{ name: 'Cơm tấm sườn bì chả', qty: 3 }, { name: 'Sinh tố xoài chanh dây', qty: 3 }], method: 'BANK_TRANSFER', discount: 0 },
    { tableNum: 'Bàn 6', hoursAgo: 3.8, items: [{ name: 'Lẩu Thái hải sản chua cay', qty: 1 }, { name: 'Bạch tuộc sa tế nướng than hoa', qty: 1 }, { name: 'Bánh Tiramisu truyền thống Ý', qty: 2 }], method: 'BANK_TRANSFER', discount: 30000 },
    { tableNum: 'Bàn 8', hoursAgo: 4.5, items: [{ name: 'Bò bít tết sốt tiêu đen (200g)', qty: 2 }, { name: 'Salad cá hồi sốt mè rang', qty: 1 }, { name: 'Cà phê muối Tasty House', qty: 2 }], method: 'CASH', discount: 0 },
    { tableNum: 'Bàn 10', hoursAgo: 5.2, items: [{ name: 'Cơm chiên hải sản hoàng kim', qty: 2 }, { name: 'Khoai tây chiên giòn bơ tỏi', qty: 1 }, { name: 'Nước mía tắc sảng khoái', qty: 2 }], method: 'QR_CODE', discount: 0 },
    { tableNum: 'Bàn 11', hoursAgo: 6.0, items: [{ name: 'Bánh xèo vàng giòn Nam Bộ', qty: 2 }, { name: 'Gỏi cuốn tôm thịt', qty: 1 }, { name: 'Trà đào cam sả thanh nhiệt', qty: 2 }], method: 'CASH', discount: 15000 },
    { tableNum: 'Bàn 12', hoursAgo: 7.0, items: [{ name: 'Bò nướng tảng sốt trứng muối', qty: 1 }, { name: 'Mì Quảng tôm thịt trứng cút', qty: 2 }, { name: 'Chè hạt sen long nhãn thanh mát', qty: 3 }], method: 'BANK_TRANSFER', discount: 0 },

    // Hôm qua (1 ngày trước)
    { tableNum: 'Bàn 2', hoursAgo: 25, items: [{ name: 'Lẩu Thái hải sản chua cay', qty: 1 }, { name: 'Khoai tây chiên giòn bơ tỏi', qty: 1 }], method: 'QR_CODE', discount: 0 },
    { tableNum: 'Bàn 5', hoursAgo: 27, items: [{ name: 'Cơm tấm sườn bì chả', qty: 2 }, { name: 'Cà phê muối Tasty House', qty: 2 }], method: 'CASH', discount: 0 },
    { tableNum: 'Bàn 7', hoursAgo: 29, items: [{ name: 'Bò bít tết sốt tiêu đen (200g)', qty: 2 }, { name: 'Panna Cotta dâu tây tươi', qty: 2 }], method: 'BANK_TRANSFER', discount: 40000 },
    { tableNum: 'Bàn 9', hoursAgo: 31, items: [{ name: 'Bún bò Huế thượng hạng', qty: 3 }, { name: 'Trà đào cam sả thanh nhiệt', qty: 3 }], method: 'CASH', discount: 0 },

    // 2 ngày trước
    { tableNum: 'Bàn 1', hoursAgo: 49, items: [{ name: 'Phở bò tái nạm', qty: 2 }, { name: 'Chả giò hải sản hoàng kim', qty: 1 }], method: 'QR_CODE', discount: 0 },
    { tableNum: 'Bàn 3', hoursAgo: 52, items: [{ name: 'Cơm chiên hải sản hoàng kim', qty: 2 }, { name: 'Sinh tố xoài chanh dây', qty: 2 }], method: 'CASH', discount: 10000 },
    { tableNum: 'Bàn 6', hoursAgo: 55, items: [{ name: 'Sườn cừu nướng sốt thảo mộc', qty: 1 }, { name: 'Salad cá hồi sốt mè rang', qty: 1 }, { name: 'Bánh Tiramisu truyền thống Ý', qty: 1 }], method: 'BANK_TRANSFER', discount: 0 },

    // 3 ngày trước
    { tableNum: 'Bàn 4', hoursAgo: 73, items: [{ name: 'Bánh xèo vàng giòn Nam Bộ', qty: 3 }, { name: 'Nước mía tắc sảng khoái', qty: 3 }], method: 'CASH', discount: 0 },
    { tableNum: 'Bàn 8', hoursAgo: 76, items: [{ name: 'Bò bít tết sốt tiêu đen (200g)', qty: 1 }, { name: 'Bún bò Huế thượng hạng', qty: 1 }, { name: 'Cà phê muối Tasty House', qty: 2 }], method: 'QR_CODE', discount: 20000 },

    // 4 ngày trước
    { tableNum: 'Bàn 11', hoursAgo: 98, items: [{ name: 'Lẩu Thái hải sản chua cay', qty: 1 }, { name: 'Nem rán Hà Nội giòn rụm', qty: 1 }], method: 'BANK_TRANSFER', discount: 0 },
    { tableNum: 'Bàn 12', hoursAgo: 102, items: [{ name: 'Bò nướng tảng sốt trứng muối', qty: 2 }, { name: 'Trà đào cam sả thanh nhiệt', qty: 4 }], method: 'CASH', discount: 50000 },

    // 5 ngày trước
    { tableNum: 'Bàn 2', hoursAgo: 122, items: [{ name: 'Cơm tấm sườn bì chả', qty: 4 }, { name: 'Cà phê phin sữa đá truyền thống', qty: 4 }], method: 'QR_CODE', discount: 0 },
    { tableNum: 'Bàn 5', hoursAgo: 126, items: [{ name: 'Phở bò tái nạm', qty: 2 }, { name: 'Kem dừa non sáp Trà Vinh', qty: 2 }], method: 'CASH', discount: 0 },

    // 6 ngày trước
    { tableNum: 'Bàn 7', hoursAgo: 146, items: [{ name: 'Bún bò Huế thượng hạng', qty: 2 }, { name: 'Gỏi cuốn tôm thịt', qty: 1 }], method: 'BANK_TRANSFER', discount: 0 },
    { tableNum: 'Bàn 9', hoursAgo: 150, items: [{ name: 'Cơm chiên hải sản hoàng kim', qty: 3 }, { name: 'Sinh tố xoài chanh dây', qty: 3 }], method: 'QR_CODE', discount: 15000 },

    // Tuần trước (8 - 14 ngày trước)
    { tableNum: 'Bàn 1', hoursAgo: 200, items: [{ name: 'Bò bít tết sốt tiêu đen (200g)', qty: 2 }, { name: 'Bánh Tiramisu truyền thống Ý', qty: 2 }], method: 'BANK_TRANSFER', discount: 0 },
    { tableNum: 'Bàn 6', hoursAgo: 220, items: [{ name: 'Lẩu Thái hải sản chua cay', qty: 1 }, { name: 'Bạch tuộc sa tế nướng than hoa', qty: 1 }], method: 'CASH', discount: 0 },
    { tableNum: 'Bàn 10', hoursAgo: 240, items: [{ name: 'Cơm tấm sườn bì chả', qty: 2 }, { name: 'Nước mía tắc sảng khoái', qty: 2 }], method: 'QR_CODE', discount: 0 },

    // Hai tuần trước (15 - 25 ngày trước)
    { tableNum: 'Bàn 3', hoursAgo: 380, items: [{ name: 'Sườn cừu nướng sốt thảo mộc', qty: 1 }, { name: 'Salad cá hồi sốt mè rang', qty: 1 }], method: 'BANK_TRANSFER', discount: 25000 },
    { tableNum: 'Bàn 8', hoursAgo: 450, items: [{ name: 'Bánh xèo vàng giòn Nam Bộ', qty: 2 }, { name: 'Chè hạt sen long nhãn thanh mát', qty: 2 }], method: 'CASH', discount: 0 },
    { tableNum: 'Bàn 12', hoursAgo: 520, items: [{ name: 'Bò nướng tảng sốt trứng muối', qty: 2 }, { name: 'Trà đào cam sả thanh nhiệt', qty: 4 }], method: 'QR_CODE', discount: 0 },
  ];

  let orderSeq = 310;
  for (const s of sampleCompletedOrders) {
    orderSeq++;
    const table = createdTables[s.tableNum];
    const createdAt = new Date(now.getTime() - s.hoursAgo * 60 * 60 * 1000);
    const completedAt = new Date(createdAt.getTime() + 45 * 60 * 1000);

    let totalAmount = 0;
    const itemsCreate = s.items.map((it) => {
      const menuItem = createdItems[it.name];
      const price = menuItem ? menuItem.price : 65000;
      totalAmount += price * it.qty;
      return {
        menuItemId: menuItem ? menuItem.id : allCreatedItemsList[0].id,
        quantity: it.qty,
        price: price,
        status: 'SERVED',
      };
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-032${orderSeq % 10}-${orderSeq}`,
        tableId: table.id,
        status: 'COMPLETED',
        totalAmount: totalAmount,
        createdAt: createdAt,
        completedAt: completedAt,
        items: { create: itemsCreate },
      },
    });

    const discount = s.discount || 0;
    const afterDiscount = Math.max(0, totalAmount - discount);
    const vatRate = 8;
    const vatAmount = Math.round((afterDiscount * vatRate) / 100);
    const finalAmount = afterDiscount + vatAmount;

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-0${orderSeq}`,
        orderId: order.id,
        cashierId: cashierUser.id,
        totalAmount: totalAmount,
        discount: discount,
        vatRate: vatRate,
        vatAmount: vatAmount,
        finalAmount: finalAmount,
        paymentMethod: s.method,
        paymentStatus: 'PAID',
        paidAt: completedAt,
        createdAt: createdAt,
      },
    });
  }
  console.log(`✔ Đã tạo ${sampleCompletedOrders.length} hóa đơn thanh toán thực tế với đầy đủ các phương thức thanh toán`);

  // 7. Đặt bàn trước (Reservations - 7 lịch đặt bàn thực tế)
  const reservationsData = [
    {
      customerName: 'Trần Thanh Tâm',
      customerPhone: '0903 112 233',
      partySize: 4,
      tableId: createdTables['Bàn 3'].id,
      reservationTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Hôm nay 2 tiếng nữa
      note: 'Chuẩn bị thêm 1 ghế trẻ em',
      status: 'CONFIRMED',
    },
    {
      customerName: 'Lê Văn Hùng',
      customerPhone: '0918 445 566',
      partySize: 2,
      tableId: createdTables['Bàn 1'].id,
      reservationTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // Chiều tối nay
      note: 'Bàn gần cửa sổ thoáng mát',
      status: 'PENDING',
    },
    {
      customerName: 'Gia đình chị Hương',
      customerPhone: '0932 778 899',
      partySize: 6,
      tableId: createdTables['Bàn 6'].id,
      reservationTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // Tối nay
      note: 'Kỷ niệm ngày cưới gia đình, mang bánh kem riêng',
      status: 'CONFIRMED',
    },
    {
      customerName: 'Vũ Minh Quân',
      customerPhone: '0988 223 344',
      partySize: 4,
      tableId: createdTables['Bàn 8'].id,
      reservationTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Trưa mai
      note: 'Gặp gỡ đối tác kinh doanh',
      status: 'PENDING',
    },
    {
      customerName: 'Đỗ Quỳnh Như',
      customerPhone: '0977 556 677',
      partySize: 2,
      tableId: createdTables['Bàn 10'].id,
      reservationTime: new Date(Date.now() + 32 * 60 * 60 * 1000), // Tối mai
      note: 'Hẹn hò sinh nhật bạn gái',
      status: 'CONFIRMED',
    },
    {
      customerName: 'Bác Tuấn (Họp lớp cựu sinh viên)',
      customerPhone: '0913 998 811',
      partySize: 8,
      tableId: createdTables['Bàn 12'].id,
      reservationTime: new Date(Date.now() + 54 * 60 * 60 * 1000), // Ngày kia
      note: 'Khu vực sân vườn thoáng đãng',
      status: 'CONFIRMED',
    },
    {
      customerName: 'Nguyễn Hoàng Nam',
      customerPhone: '0909 334 455',
      partySize: 4,
      tableId: createdTables['Bàn 4'].id,
      reservationTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hôm qua
      note: 'Khách quen thân thiết',
      status: 'ARRIVED',
    },
  ];

  for (const r of reservationsData) {
    await prisma.reservation.create({ data: r });
  }
  console.log(`✔ Đã tạo ${reservationsData.length} lịch đặt bàn trước thực tế`);

  // 8. Khuyến mãi (Promotions - 4 chương trình thực tế)
  const promotionsData = [
    {
      code: 'TASTY10',
      name: 'Giảm 10% khai trương Tasty House',
      type: 'percent',
      value: 10,
      maxDiscount: 50000,
      minOrder: 150000,
      usageLimit: 200,
      usedCount: 42,
      active: true,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'WELCOME20',
      name: 'Giảm 20.000đ cho khách hàng mới',
      type: 'amount',
      value: 20000,
      maxDiscount: 20000,
      minOrder: 100000,
      usageLimit: 150,
      usedCount: 58,
      active: true,
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'VIP50K',
      name: 'Giảm 50.000đ cho hóa đơn trên 300.000đ',
      type: 'amount',
      value: 50000,
      maxDiscount: 50000,
      minOrder: 300000,
      usageLimit: 100,
      usedCount: 23,
      active: true,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'COMBOFAMILY',
      name: 'Giảm 15% bàn gia đình cuối tuần',
      type: 'percent',
      value: 15,
      maxDiscount: 100000,
      minOrder: 500000,
      usageLimit: 50,
      usedCount: 0,
      active: true,
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Sắp diễn ra
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const p of promotionsData) {
    await prisma.promotion.create({ data: p });
  }
  console.log(`✔ Đã tạo ${promotionsData.length} chương trình khuyến mãi thực tế`);

  // 9. Yêu cầu hỗ trợ (Support Requests - 5 yêu cầu thực tế)
  const supportRequestsData = [
    {
      tableId: createdTables['Bàn 2'].id,
      reason: 'Thêm đá / nước',
      status: 'cho_xu_ly',
      createdAt: new Date(Date.now() - 6 * 60 * 1000),
    },
    {
      tableId: createdTables['Bàn 5'].id,
      reason: 'Thêm chén đũa',
      status: 'cho_xu_ly',
      createdAt: new Date(Date.now() - 12 * 60 * 1000),
    },
    {
      tableId: createdTables['Bàn 9'].id,
      reason: 'Gọi thanh toán',
      status: 'cho_xu_ly',
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
      tableId: createdTables['Bàn 7'].id,
      reason: 'Khăn lạnh',
      status: 'da_xu_ly',
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
    {
      tableId: createdTables['Bàn 1'].id,
      reason: 'Gọi nhân viên',
      status: 'da_xu_ly',
      createdAt: new Date(Date.now() - 50 * 60 * 1000),
    },
  ];

  for (const sr of supportRequestsData) {
    await prisma.supportRequest.create({ data: sr });
  }
  console.log(`✔ Đã tạo ${supportRequestsData.length} yêu cầu hỗ trợ bàn`);

  // 10. Cấu hình hệ thống (Settings)
  const settingsData = [
    { key: 'vatRate', value: '8' },
    { key: 'discountLimitPercent', value: '10' },
    { key: 'restaurantName', value: 'TASTY HOUSE' },
    { key: 'restaurantAddress', value: '123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh' },
    { key: 'restaurantPhone', value: '0901 234 567' },
    { key: 'openingHours', value: '08:00 - 23:00' },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('✔ Đã cập nhật cấu hình hệ thống');

  console.log('🎉 TOÀN BỘ DỮ LIỆU THỰC TẾ ĐÃ ĐƯỢC NẠP THÀNH CÔNG VÀO DATABASE!');
}

async function main() {
  await seedDatabase();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedDatabase };
