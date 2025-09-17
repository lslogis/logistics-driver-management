const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedRates() {
  try {
    console.log('🌱 Seeding rate data...');

    // Create test rate for 쿠팡 5톤
    const rate1 = await prisma.rateMaster.create({
      data: {
        centerName: '쿠팡',
        tonnage: 5,
        isActive: true,
        rateDetails: {
          create: [
            {
              type: 'BASE',
              amount: 120000,
              isActive: true
            },
            {
              type: 'CALL_FEE',
              amount: 5000,
              isActive: true
            },
            {
              type: 'WAYPOINT_FEE',
              region: '강남',
              amount: 8000,
              isActive: true
            },
            {
              type: 'WAYPOINT_FEE',
              region: '수원',
              amount: 12000,
              isActive: true
            },
            {
              type: 'SPECIAL',
              amount: 10000,
              conditions: '야간할증 (22:00-06:00)',
              isActive: true
            }
          ]
        }
      },
      include: {
        rateDetails: true
      }
    });

    console.log('✅ Created rate for 쿠팡 5톤:', rate1.id);

    // Create test rate for 네이버 2.5톤
    const rate2 = await prisma.rateMaster.create({
      data: {
        centerName: '네이버',
        tonnage: 2.5,
        isActive: true,
        rateDetails: {
          create: [
            {
              type: 'BASE',
              amount: 80000,
              isActive: true
            },
            {
              type: 'CALL_FEE',
              amount: 3000,
              isActive: true
            },
            {
              type: 'WAYPOINT_FEE',
              region: '판교',
              amount: 5000,
              isActive: true
            }
          ]
        }
      },
      include: {
        rateDetails: true
      }
    });

    console.log('✅ Created rate for 네이버 2.5톤:', rate2.id);

    // Verify the data
    const allRates = await prisma.rateMaster.findMany({
      include: {
        rateDetails: true
      }
    });

    console.log('\n📊 Total rate masters created:', allRates.length);
    allRates.forEach(rate => {
      console.log(`  - ${rate.centerName} ${rate.tonnage}톤: ${rate.rateDetails.length} details`);
    });

    console.log('\n✅ Rate data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding rates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRates().catch(console.error);