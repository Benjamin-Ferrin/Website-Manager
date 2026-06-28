require('dotenv').config();
const path = require('path');
const pool = require('../src/db/pool');
const pageService = require('../src/services/pages');

async function addMissingPages() {
  const business = await pool.query('SELECT * FROM businesses WHERE slug = $1', ['general-diner']);
  if (business.rows.length === 0) {
    console.log('Business not found');
    process.exit(1);
  }
  
  const businessId = business.rows[0].id;
  const existingPages = await pageService.getPages(businessId);
  console.log('Existing pages:', existingPages.map(p => p.slug));
  
  const templates = {
    menu: path.resolve('templates/businesses/general-diner/menu.html'),
    reservations: path.resolve('templates/businesses/general-diner/reservations.html'),
    contact: path.resolve('templates/businesses/general-diner/contact.html'),
  };
  
  for (const [slug, templatePath] of Object.entries(templates)) {
    const exists = existingPages.find(p => p.slug === slug);
    if (!exists) {
      await pageService.createPage(businessId, {
        slug,
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        template_path: templatePath,
        sort_order: 2,
        is_home: false,
      });
      console.log('Created page:', slug);
    } else {
      console.log('Page already exists:', slug);
    }
  }
  
  await pool.end();
  console.log('Done');
}

addMissingPages().catch(err => {
  console.error(err);
  process.exit(1);
});
