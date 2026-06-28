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

  let business = await businessService.getBySlug('general-diner');
  if (!business) {
    business = await businessService.create({
      name: "General Diner",
      slug: 'general-diner',
      domain: null,
      settings: { theme: 'classic-diner' },
    });
    console.log("Created business: General Diner");
  }

  const homeTemplate = path.resolve('templates/businesses/general-diner/home.html');
  const aboutTemplate = path.resolve('templates/businesses/general-diner/about.html');
  const menuTemplate = path.resolve('templates/businesses/general-diner/menu.html');
  const reservationsTemplate = path.resolve('templates/businesses/general-diner/reservations.html');
  const contactTemplate = path.resolve('templates/businesses/general-diner/contact.html');

  const pages = await pageService.getPages(business.id);
  if (pages.length === 0) {
    await pageService.createPage(business.id, {
      slug: 'home',
      title: 'Home',
      template_path: homeTemplate,
      sort_order: 0,
      is_home: true,
    });

    await pageService.createPage(business.id, {
      slug: 'about',
      title: 'About',
      template_path: aboutTemplate,
      sort_order: 1,
      is_home: false,
    });

    await pageService.createPage(business.id, {
      slug: 'menu',
      title: 'Menu',
      template_path: menuTemplate,
      sort_order: 2,
      is_home: false,
    });

    await pageService.createPage(business.id, {
      slug: 'reservations',
      title: 'Reservations',
      template_path: reservationsTemplate,
      sort_order: 3,
      is_home: false,
    });

    await pageService.createPage(business.id, {
      slug: 'contact',
      title: 'Contact',
      template_path: contactTemplate,
      sort_order: 4,
      is_home: false,
    });

    console.log('Created pages: home, about, menu, reservations, contact');
  }

  const homePage = await pageService.getPageBySlug(business.id, 'home');
  const aboutPage = await pageService.getPageBySlug(business.id, 'about');

  await contentService.syncFromObject(business.id, null, {
    businessName: "General Diner",
    phone: '555-123-4567',
    announcement: 'Welcome to General Diner!',
    contact: {
      phone: '555-123-4567',
      email: { href: 'mailto:info@generaldiner.com', text: 'info@generaldiner.com' },
      address: '123 Main Street, Anytown, USA',
    },
    hours: {
      monday: '6:00 AM – 10:00 PM',
      tuesday: '6:00 AM – 10:00 PM',
      wednesday: '6:00 AM – 10:00 PM',
      thursday: '6:00 AM – 10:00 PM',
      friday: '6:00 AM – 11:00 PM',
      saturday: '7:00 AM – 11:00 PM',
      sunday: '7:00 AM – 9:00 PM',
    },
    heroImage: {
      src: 'https://placehold.co/800x400/e94560/FFF?text=General+Diner',
      alt: 'General Diner',
    },
    aboutBlurb: {
      html: '<p>Family-owned since 1985. Famous for pancakes, burgers, and bottomless coffee.</p>',
    },
    aboutLink: { href: './about', text: 'Our story →' },
  });

  if (aboutPage) {
    await contentService.syncFromObject(business.id, aboutPage.id, {
      businessName: "General Diner",
      aboutTitle: 'Our Story',
      aboutContent: {
        html: `<p>General Diner opened in 1985 with a simple mission: great food, fair prices, and a welcoming booth for everyone.</p>
<p>Today we still flip pancakes on the same griddle and greet regulars by name.</p>`,
      },
    });
  }

  const menuItems = await menuService.getMenuItems(business.id);
  if (menuItems.length === 0) {
    await menuService.replaceMenu(business.id, [
      { label: 'Home', url: './' },
      { label: 'About', url: './about' },
      { label: 'Menu', url: './menu' },
      { label: 'Contact', url: './contact' },
      { label: 'Reservations', url: './reservations' },
    ]);
    console.log('Created menu items');
  }

  console.log('Seed complete.');
  console.log(`Visit: http://localhost:${config.port}/general-diner`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
