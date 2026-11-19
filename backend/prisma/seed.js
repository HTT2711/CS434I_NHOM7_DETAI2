const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('123456', 10);

  const users = [
    { username: 'admin', password: passwordHash, fullName: 'Quản trị viên', role: 'ADMIN' },
    { username: 'cashier', password: passwordHash, fullName: 'Thu ngân Tasty', role: 'CASHIER' },
    { username: 'kitchen', password: passwordHash, fullName: 'Bếp trưởng', role: 'KITCHEN' },
    { username: 'waiter', password: passwordHash, fullName: 'Nhân viên bàn', role: 'WAITER' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: { password: user.password, fullName: user.fullName, role: user.role },
      create: user,
    });
  }
  console.log('✔ Users seeded');

  // 2. Seed Tables
  const tables = [
    { tableNumber: 'Bàn 01', capacity: 2, token: 'TB01-TOKEN' },
    { tableNumber: 'Bàn 02', capacity: 4, token: 'TB02-TOKEN' },
    { tableNumber: 'Bàn 03', capacity: 4, token: 'TB03-TOKEN' },
    { tableNumber: 'Bàn 04', capacity: 6, token: 'TB04-TOKEN' },
    { tableNumber: 'Bàn 05', capacity: 8, token: 'TB05-TOKEN' },
    { tableNumber: 'Bàn 06', capacity: 2, token: 'TB06-TOKEN' },
    { tableNumber: 'Bàn 07', capacity: 4, token: 'TB07-TOKEN' },
    { tableNumber: 'Bàn 08', capacity: 4, token: 'TB08-TOKEN' },
  ];

  for (const table of tables) {
    await prisma.table.upsert({
      where: { tableNumber: table.tableNumber },
      update: { capacity: table.capacity, token: table.token },
      create: table,
    });
  }
  console.log('✔ Tables seeded');

  // 3. Seed Categories & Menu Items
  const categoriesData = [
    {
      name: 'Món khai vị',
      description: 'Các món nhẹ nhàng khai vị tươi ngon',
      items: [
        { name: 'Salad cá hồi sốt mè', price: 65000, description: 'Rau xanh hữu cơ, cá hồi Nauy tươi béo ngậy sốt mè rang', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500' },
        { name: 'Khoai tây chiên giòn bơ tỏi', price: 45000, description: 'Khoai tây giòn rụm thơm lừng sốt phô mai bơ tỏi', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500' },
        { name: 'Súp nấm kem tươi', price: 50000, description: 'Nấm đùi gà, nấm mỡ hầm kem sữa béo ngậy kiểu Pháp', imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500' },
      ],
    },
    {
      name: 'Món chính',
      description: 'Món ăn no đậm đà hương vị thơm ngon',
      items: [
        { name: 'Bò bít tết Tasty House (200g)', price: 185000, description: 'Bò Úc thượng hạng áp chảo sốt tiêu đen kèm khoai nghiền', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500' },
        { name: 'Cơm chiên hải sản hoàng kim', price: 95000, description: 'Cơm chiên tôm, mực, trứng muối giòn thơm', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500' },
        { name: 'Mì Ý sốt bò băm Bolognese', price: 110000, description: 'Mì Ý truyền thống sốt thịt bò bằm cà chua phô mai Parmesan', imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281745?w=500' },
        { name: 'Pizza Hải sản sốt Pesto', price: 160000, description: 'Đế bánh nướng củi, tôm, mực, nghêu phủ phô mai Mozzarella', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500' },
      ],
    },
    {
      name: 'Tráng miệng',
      description: 'Các món ngọt ngào kết thúc bữa ăn',
      items: [
        { name: 'Bánh Tiramisu truyền thống Ý', price: 55000, description: 'Hương vị cà phê nồng nàn kết hợp phô mai Mascarpone', imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500' },
        { name: 'Panna Cotta sốt dâu tây', price: 45000, description: 'Bánh pudding kem sữa mềm mịn sốt dâu tây chua ngọt', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500' },
      ],
    },
    {
      name: 'Đồ uống',
      description: 'Thức uống giải khát, trà, cà phê hảo hạng',
      items: [
        { name: 'Trà đào cam sả thanh nhiệt', price: 45000, description: 'Trà thảo mộc thơm mát kết hợp vị đào giòn ngọt', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500' },
        { name: 'Cà phê muối Tasty House', price: 40000, description: 'Cà phê pha phin truyền thống với lớp kem muối béo mặn nhẹ', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500' },
        { name: 'Sinh tố xoài chanh dây', price: 50000, description: 'Xoài cát chín ngọt và chanh dây chua thơm tươi mát', imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=500' },
      ],
    },
  ];

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: { name: cat.name, description: cat.description },
    });

    for (const item of cat.items) {
      const existing = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id },
      });
      if (existing) {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: { price: item.price, description: item.description, imageUrl: item.imageUrl, isSelling: true, isAvailable: true },
        });
      } else {
        await prisma.menuItem.create({
          data: {
            ...item,
            isSelling: true,
            isAvailable: true,
            categoryId: category.id,
          },
        });
      }
    }
  }
  console.log('✔ Categories and Menu Items seeded');
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
