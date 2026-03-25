import { PrismaClient } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Load cost codes data from JSON (extracted from XLSX)
const costCodesDataPath = path.join(__dirname, '..', 'cost-codes-data.json');
let costCodesData: Record<string, any[]> = {};

if (fs.existsSync(costCodesDataPath)) {
  costCodesData = JSON.parse(fs.readFileSync(costCodesDataPath, 'utf-8'));
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Seed Users
  console.log('👤 Seeding users...');
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      name: 'Super Admin',
      email: superAdminEmail,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bburnbuilders.com' },
    update: {},
    create: {
      name: 'Tomer Blackburn',
      email: 'admin@bburnbuilders.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Created users: ${superAdmin.email}, ${admin.email}`);

  // Seed Site Settings
  console.log('⚙️ Seeding site settings...');
  const existingSiteSettings = await prisma.siteSettings.findFirst();
  await (existingSiteSettings
    ? prisma.siteSettings.update({
        where: { id: existingSiteSettings.id },
        data: {
          siteTitle: 'BBurn Builders',
          siteDescription:
            'Professional bathroom renovation and construction services in Chicago',
          contactNumber: '+1 (312) 555-1234',
          contactEmail: 'info@bburnbuilders.com',
          facebookUrl: 'https://facebook.com/bburnbuilders',
          instagramUrl: 'https://instagram.com/bburnbuilders',
        },
      })
    : prisma.siteSettings.create({
        data: {
          siteTitle: 'BBurn Builders',
          siteDescription:
            'Professional bathroom renovation and construction services in Chicago',
          contactNumber: '+1 (312) 555-1234',
          contactEmail: 'info@bburnbuilders.com',
          facebookUrl: 'https://facebook.com/bburnbuilders',
          instagramUrl: 'https://instagram.com/bburnbuilders',
        },
      }));
  console.log('✅ Created/updated site settings');

  // Seed Bathroom Types
  console.log('🚿 Seeding bathroom types...');
  const bathroomTypes = [
    {
      code: 'FP',
      name: 'Four Piece',
      shortDescription: 'Toilet + Sink + Shower + Tub',
      fullDescription:
        'A larger bathroom with a toilet, sink (often a double vanity), plus a separate shower and bathtub',
      basePrice: 25000,
      displayOrder: 1,
    },
    {
      code: 'TPS',
      name: 'Three Piece - Shower',
      shortDescription: 'Toilet + Sink + Shower',
      fullDescription:
        'A standard full bathroom with a toilet, sink, and walk-in shower (no bathtub)',
      basePrice: 20000,
      displayOrder: 2,
    },
    {
      code: 'TPT',
      name: 'Three Piece - Tub',
      shortDescription: 'Toilet + Sink + Tub',
      fullDescription:
        'A standard bathroom with a toilet, sink, and bathtub (no separate shower)',
      basePrice: 18000,
      displayOrder: 3,
    },
    {
      code: 'TP',
      name: 'Two Piece (Powder Room)',
      shortDescription: 'Toilet + Sink',
      fullDescription:
        'A half-bath or powder room with only a toilet and sink—no shower or bathtub',
      basePrice: 12000,
      displayOrder: 4,
    },
  ];

  const createdBathroomTypes: Record<string, any> = {};
  for (const type of bathroomTypes) {
    const created = await prisma.bathroomType.upsert({
      where: { code: type.code },
      update: type,
      create: type,
    });
    createdBathroomTypes[type.code] = created;
  }
  console.log(
    `✅ Created ${Object.keys(createdBathroomTypes).length} bathroom types`,
  );

  // Map sheet names to bathroom type codes
  const sheetToBathroomType: Record<string, string> = {
    'Four Piece': 'FP',
    'Three Piece - Shower': 'TPS',
    'Three Piece - Tub': 'TPT',
    'Two Piece (Powder Room)': 'TP',
  };

  // Get or create a default category for cost codes
  let defaultCategory = await prisma.costCodeCategory.findFirst();
  if (!defaultCategory) {
    defaultCategory = await prisma.costCodeCategory.create({
      data: {
        name: 'General',
        slug: 'general',
        description: 'General cost codes',
        stepNumber: 1,
        displayOrder: 0,
      },
    });
  }

  // Create cost codes for each bathroom type
  console.log('💰 Seeding cost codes from XLSX data...');

  let totalCostCodes = 0;
  let totalLinks = 0;

  for (const [sheetName, codes] of Object.entries(costCodesData)) {
    const bathroomTypeCode = sheetToBathroomType[sheetName];
    if (!bathroomTypeCode) continue;

    const bathroomType = createdBathroomTypes[bathroomTypeCode];
    if (!bathroomType) continue;

    console.log(`  📋 Processing ${sheetName} (${codes.length} cost codes)...`);

    for (const codeData of codes) {
      // Determine unit type based on unit field
      let unitType = 'FIXED';
      if (codeData.unit === '/sqft') unitType = 'PER_SQFT';
      else if (codeData.unit === '/unit') unitType = 'PER_EACH';
      else if (codeData.unit === '/hour') unitType = 'PER_EACH';
      else if (codeData.unit === '/roll') unitType = 'PER_EACH';

      // Determine question type based on cost code pattern
      let questionType = 'WHITE'; // Default included in base
      const requiresQuantity = !!(codeData.unit && codeData.unit !== '');
      const isOptional =
        codeData.clientPrice === 0 || codeData.markedAs === 'Allowance';

      if (requiresQuantity) {
        questionType = 'YELLOW'; // User input for quantity
      } else if (isOptional) {
        questionType = 'BLUE'; // Toggle option
      } else if (codeData.clientPrice > 0) {
        questionType = 'GREEN'; // Dropdown selection
      }

      // Create or update cost code
      const costCode = await prisma.costCode.upsert({
        where: { code: codeData.code },
        update: {
          name: codeData.title,
          description: codeData.description.replace(/\r\n/g, '\n'),
          basePrice: codeData.clientPrice || 0,
          unitType: unitType as any,
          questionType: questionType as any,
          isIncludedInBase:
            codeData.markedAs === 'Bid' && codeData.clientPrice === 0,
          requiresQuantity,
          isOptional,
        },
        create: {
          code: codeData.code,
          name: codeData.title,
          description: codeData.description.replace(/\r\n/g, '\n'),
          basePrice: codeData.clientPrice || 0,
          unitType: unitType as any,
          questionType: questionType as any,
          displayOrder: totalCostCodes,
          isIncludedInBase:
            codeData.markedAs === 'Bid' && codeData.clientPrice === 0,
          requiresQuantity,
          isOptional,
          categoryId: defaultCategory.id,
        },
      });

      totalCostCodes++;

      // Link cost code to service
      await prisma.serviceCostCode.upsert({
        where: {
          serviceId_costCodeId: {
            serviceId: bathroomType.id,
            costCodeId: costCode.id,
          },
        },
        update: {
          isVisible: true,
          isRequired: !isOptional,
          isIncludedInBase:
            codeData.markedAs === 'Bid' && codeData.clientPrice === 0,
        },
        create: {
          serviceId: bathroomType.id,
          costCodeId: costCode.id,
          isVisible: true,
          isRequired: !isOptional,
          isIncludedInBase:
            codeData.markedAs === 'Bid' && codeData.clientPrice === 0,
          displayOrder: totalLinks,
        },
      });

      totalLinks++;
    }
  }

  console.log(`✅ Created/updated ${totalCostCodes} cost codes`);
  console.log(`✅ Created ${totalLinks} bathroom type to cost code links`);

  // Seed HomePage
  console.log('🏠 Seeding home page...');
  const existingHomePage = await prisma.homePage.findFirst();
  await (existingHomePage
    ? prisma.homePage.update({
        where: { id: existingHomePage.id },
        data: {
          title: 'BBurn Builders',
          subTitle: 'Professional Bathroom Renovation',
          ourMissionTitle: 'Our Mission',
          ourMissionSubTitle:
            'Transform your bathroom with our expert renovation services. Get an instant estimate for your project.',
        },
      })
    : prisma.homePage.create({
        data: {
          title: 'BBurn Builders',
          subTitle: 'Professional Bathroom Renovation',
          ourMissionTitle: 'Our Mission',
          ourMissionSubTitle:
            'Transform your bathroom with our expert renovation services. Get an instant estimate for your project.',
        },
      }));
  console.log('✅ Created/updated home page');

  // Seed About Us
  console.log('ℹ️ Seeding about us page...');
  const existingAboutUs = await prisma.aboutUs.findFirst();
  await (existingAboutUs
    ? prisma.aboutUs.update({
        where: { id: existingAboutUs.id },
        data: {
          title: 'Our Philosophy',
          ownerInfo: 'From Tomer Blackburn, BBurn Builders founder & owner',
          description:
            'I started BBurn Builders to bring the focus of the construction industry back where it belongs: on client communication and satisfaction. We believe in transparent pricing, quality craftsmanship, and delivering projects on time.',
        },
      })
    : prisma.aboutUs.create({
        data: {
          title: 'Our Philosophy',
          ownerInfo: 'From Tomer Blackburn, BBurn Builders founder & owner',
          description:
            'I started BBurn Builders to bring the focus of the construction industry back where it belongs: on client communication and satisfaction. We believe in transparent pricing, quality craftsmanship, and delivering projects on time.',
        },
      }));
  console.log('✅ Created/updated about us page');

  // Seed Estimator Page
  console.log('📊 Seeding estimator page...');
  const estimatorPage = await prisma.estimatorPage.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      title: 'Estimate Your Bathroom Remodel Cost',
      description:
        'Professional bathroom remodels - real quotes, competitive pricing, 15 verified steps',
      howItWorksTitle: 'How It Works',
      whyChooseUsTitle: 'Why Choose Us',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Estimate Your Bathroom Remodel Cost',
      description:
        'Professional bathroom remodels - real quotes, competitive pricing, 15 verified steps',
      howItWorksTitle: 'How It Works',
      whyChooseUsTitle: 'Why Choose Us',
    },
  });
  console.log('✅ Created/updated estimator page');

  // Seed Building Types (for Estimator "Your Information" section)
  console.log('🏠 Seeding building types...');
  const buildingTypeCount = await prisma.buildingType.count();
  if (buildingTypeCount === 0) {
    await prisma.buildingType.createMany({
      data: [
        {
          name: 'Single Family',
          price: 0,
          isActive: true,
          displayOrder: 0,
        },
        {
          name: 'Condo',
          price: 0,
          isActive: true,
          displayOrder: 1,
        },
        {
          name: 'Townhome',
          price: 0,
          isActive: true,
          displayOrder: 2,
        },
        {
          name: 'Multi-Unit',
          price: 0,
          isActive: true,
          displayOrder: 3,
        },
      ],
    });
    // Add dynamic fields for Multi-Unit (example)
    const multiUnit = await prisma.buildingType.findFirst({
      where: { name: 'Multi-Unit' },
    });
    if (multiUnit) {
      await prisma.buildingTypeField.createMany({
        data: [
          {
            buildingTypeId: multiUnit.id,
            label: 'Number of Units',
            fieldType: 'number',
            placeholder: 'Enter number of units',
            isRequired: true,
            displayOrder: 0,
          },
          {
            buildingTypeId: multiUnit.id,
            label: 'Square Footage',
            fieldType: 'number',
            placeholder: 'Total sq ft',
            isRequired: false,
            displayOrder: 1,
          },
        ],
      });
    }
    console.log('✅ Created building types with sample dynamic fields');
  } else {
    console.log('✅ Building types already exist, skipping');
  }

  // Seed How It Works steps
  console.log('📝 Seeding How It Works steps...');
  const howItWorksSteps = [
    {
      id: 'step-1',
      stepNumber: 1,
      title: 'Select Type',
      description: 'Choose your bathroom type',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      title: 'Answer Questions',
      description: 'Provide specific details',
    },
    {
      id: 'step-3',
      stepNumber: 3,
      title: 'Get Estimate',
      description: 'Receive detailed proposed estimate',
    },
  ];

  for (const step of howItWorksSteps) {
    await prisma.howItWorksStep.upsert({
      where: { id: step.id },
      update: step,
      create: step,
    });
  }
  console.log('✅ Created/updated How It Works steps');

  // Seed Why Choose Us features
  console.log('⭐ Seeding Why Choose Us features...');
  const whyChooseUsFeatures = [
    {
      id: 'feature-0',
      order: 0,
      title: 'Transparent Pricing',
      description: "See exactly what you're paying for with itemized estimates",
    },
    {
      id: 'feature-1',
      order: 1,
      title: 'Fast & Easy',
      description: 'Get your estimate within 15 minutes',
    },
    {
      id: 'feature-2',
      order: 2,
      title: 'No Hidden Fees',
      description: 'What you see is what you get, no surprises',
    },
    {
      id: 'feature-3',
      order: 3,
      title: 'Expert Team',
      description:
        'Work with experienced professionals with years of experience',
    },
  ];

  for (const feature of whyChooseUsFeatures) {
    await prisma.whyChooseUsFeature.upsert({
      where: { id: feature.id },
      update: feature,
      create: feature,
    });
  }
  console.log('✅ Created/updated Why Choose Us features');

  // Seed Building Types (for Estimator "Your Information" section)
  console.log('🏠 Seeding building types...');
  const buildingTypeCount = await prisma.buildingType.count();
  if (buildingTypeCount === 0) {
    await prisma.buildingType.createMany({
      data: [
        {
          name: 'Single Family',
          price: 0,
          isActive: true,
          displayOrder: 0,
        },
        {
          name: 'Condo',
          price: 0,
          isActive: true,
          displayOrder: 1,
        },
        {
          name: 'Townhome',
          price: 0,
          isActive: true,
          displayOrder: 2,
        },
        {
          name: 'Multi-Unit',
          price: 0,
          isActive: true,
          displayOrder: 3,
        },
      ],
    });
    // Add dynamic fields for Multi-Unit (example)
    const multiUnit = await prisma.buildingType.findFirst({
      where: { name: 'Multi-Unit' },
    });
    if (multiUnit) {
      await prisma.buildingTypeField.createMany({
        data: [
          {
            buildingTypeId: multiUnit.id,
            label: 'Number of Units',
            fieldType: 'number',
            placeholder: 'Enter number of units',
            isRequired: true,
            displayOrder: 0,
          },
        ],
      });
    }
    console.log('✅ Created building types with sample dynamic fields');
  } else {
    console.log('✅ Building types already exist, skipping');
  }

  console.log('\n✨ Seeding completed successfully!');
  console.log('\n📝 Default credentials:');
  console.log(`   Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
  console.log('   Admin: admin@bburnbuilders.com / admin123');
}

async function clearDatabase() {
  console.log('🗑️ Clearing existing data...');
  await prisma.submissionMedia.deleteMany();
  await prisma.submissionItem.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.serviceCostCode.deleteMany();
  await prisma.costCodeOption.deleteMany();
  await prisma.costCode.deleteMany();
  await prisma.costCodeCategory.deleteMany();
  await prisma.bathroomType.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.homePage.deleteMany();
  await prisma.aboutUs.deleteMany();
  await prisma.whyChooseUsFeature.deleteMany();
  await prisma.howItWorksStep.deleteMany();
  await prisma.estimatorPage.deleteMany();
  console.log('✅ Database cleared');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
