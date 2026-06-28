require('dotenv').config();
const path = require('path');
const pool = require('../src/db/pool');
const config = require('../src/config');
const authService = require('../src/services/auth');
const businessService = require('../src/services/business');
const pageService = require('../src/services/pages');
const contentService = require('../src/services/content');
const menuService = require('../src/services/menu');

async function seed() {
  console.log('Seeding database...');

  await authService.ensureAdmin(config.adminEmail, config.adminPassword);
  console.log(`Admin user: ${config.adminEmail}`);

  let business = await businessService.getBySlug('als-diner');
  if (!business) {
    business = await businessService.create({
      name: "Al's Diner",
      slug: 'als-diner',
      domain: null,
      settings: { theme: 'classic-diner' },
    });
    console.log("Created business: Al's Diner");
  }

  const homeTemplate = path.resolve('templates/businesses/als-diner/home.html');
  const aboutTemplate = path.resolve('templates/businesses/als-diner/about.html');

  const pages = await pageService.getPages(business.id);
  if (pages.length === 0) {
    await pageService.createPage(business.id, {
      slug: 'home',
      title: 'Home',
      template_path: homeTemplate,
      sort_order: 0,
      is_home: true,
    });

    const aboutPage = await pageService.createPage(business.id, {
      slug: 'about',
      title: 'About',
      template_path: aboutTemplate,
      sort_order: 1,
      is_home: false,
    });

    console.log('Created pages: home, about');
  }

  const homePage = await pageService.getPageBySlug(business.id, 'home');
  const aboutPage = await pageService.getPageBySlug(business.id, 'about');

  await contentService.syncFromObject(business.id, null, {
    businessName: "Al's Diner",
    phone: '919-555-1234',
    announcement: 'Now serving breakfast all day!',
    contact: {
      phone: '919-555-1234',
      email: { href: 'mailto:hello@alsdiner.example', text: 'hello@alsdiner.example' },
      address: '123 Main Street, Raleigh, NC',
    },
    hours: {
      monday: '7am – 9pm',
      tuesday: '7am – 9pm',
      wednesday: '7am – 9pm',
      thursday: '7am – 9pm',
      friday: '7am – 10pm',
      saturday: '8am – 10pm',
      sunday: '8am – 3pm',
    },
    heroImage: {
      src: 'https://placehold.co/800x400/8B4513/FFF?text=Al%27s+Diner',
      alt: "Al's Diner storefront",
    },
    aboutBlurb: {
      html: '<p>Family-owned since 1985. Famous for pancakes, burgers, and bottomless coffee.</p>',
    },
    aboutLink: { href: '/about', text: 'Our story →' },
  });

  if (aboutPage) {
    await contentService.syncFromObject(business.id, aboutPage.id, {
      businessName: "Al's Diner",
      aboutTitle: 'Our Story',
      aboutContent: {
        html: `<p>Al's Diner opened in 1985 with a simple mission: great food, fair prices, and a welcoming booth for everyone.</p>
<p>Today we still flip pancakes on the same griddle and greet regulars by name.</p>`,
      },
    });
  }

  const menuItems = await menuService.getMenuItems(business.id);
  if (menuItems.length === 0) {
    await menuService.replaceMenu(business.id, [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' },
    ]);
    console.log('Created menu items');
  }

  console.log('Seed complete.');
  console.log(`Visit: http://localhost:${config.port}/als-diner`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
