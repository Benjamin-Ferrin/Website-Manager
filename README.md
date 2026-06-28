# Multi-Website (Content) Management System

A multi-tenant content management system built with Node.js and Express that allows you to manage multiple business websites from a single admin panel. Each business tenant can have its own pages, content, assets, navigation menus, and PDF documents.

## Features

- **Multi-Tenant Architecture**: Support multiple businesses with slug-based routing (`/business-slug`) or custom domain mapping
- **Template-Based Pages**: Create pages using HTML templates with dynamic content injection via `data-edit` attributes
- **Dynamic Content Management**: Edit content directly in the admin panel with support for various field types (text, multiline, HTML, images, links, files)
- **Asset Management**: Upload and manage images and PDFs per business
- **PDF to HTML Conversion**: Automatically convert uploaded PDFs to HTML for web viewing
- **Navigation Menus**: Configure custom navigation menus for each business
- **Admin Panel**: Web-based admin interface for managing all aspects of each business
- **Authentication**: Session-based authentication with CSRF protection
- **Database Migrations**: Built-in migration system for schema management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Session Storage**: PostgreSQL via connect-pg-simple
- **Template Engine**: EJS (admin panel), Cheerio (page rendering)
- **Authentication**: bcrypt for password hashing
- **File Upload**: Multer


## Database Schema

### Core Tables

- **users**: Admin user accounts with email and password hash
- **businesses**: Business/tenant records with slug, optional domain, and JSONB settings
- **pages**: Page definitions per business with slug, title, template path, and home page flag
- **content_entries**: Dynamic content storage with field types (text, multiline, image, link, html, json, file)
- **assets**: Uploaded file metadata (images, PDFs) linked to businesses
- **pdf_documents**: PDF conversion tracking with generated HTML and conversion status
- **menu_items**: Navigation menu items per business with support for hierarchical structure

### Key Relationships

- Businesses have many pages, assets, menu items, and content entries
- Pages belong to a business and have page-specific content
- Content entries can be global (business-wide) or page-specific
- PDF documents are linked to assets for file storage

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Modular-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
type nul > .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=3000
NODE_ENV=development
SESSION_SECRET=secret-key
SESSION_MAX_AGE_MS=86400000
UPLOAD_DIR=./public/uploads
MAX_UPLOAD_BYTES=10485760
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password
```

4. Run database migrations:
```bash
node scripts/migrate.js
```

5. (Optional) Seed the database with sample data:
```bash
node scripts/seed.js
```

6. Start the server:
```bash
node server.js
```

The server will start at `http://localhost:3000` with the admin panel at `http://localhost:3000/admin`

## Usage

### Admin Panel

1. Login at `/admin` using the admin credentials from your `.env` file
2. Create a new business with a unique slug
3. Add pages to the business, specifying HTML templates from the `templates/` directory
4. Edit content for each page (global business content or page-specific content)
5. Upload assets (images, PDFs) for use in templates
6. Configure navigation menu items
7. View the public site at `/:business-slug` or `/:business-slug/:page-slug`

### Creating Templates

Templates are HTML files with special `data-edit` attributes that mark editable content regions:

```html
<!DOCTYPE html>
<html>
<head>
  <title data-edit="pageTitle">Default Title</title>
</head>
<body>
  <nav data-menu="main">
    <!-- Menu items injected here -->
  </nav>
  
  <h1 data-edit="heroTitle">Welcome</h1>
  <img data-edit="heroImage" data-edit-type="image" src="" alt="">
  
  <div data-edit="aboutContent" data-edit-type="html">
    Default content
  </div>
  
  <a data-edit="contactLink" data-edit-type="link" href="">Contact Us</a>
</body>
</html>
```

Supported field types:
- `text` (default): Plain text
- `multiline`: Text with line breaks converted to `<br>`
- `image`: Image with src and alt attributes
- `link`: Anchor tag with href and text
- `html`: Raw HTML content
- `file`: File download link with asset ID

### Tenant Resolution

The system resolves tenants in two ways:

1. **By Slug**: `http://localhost:3000/business-slug` or `http://localhost:3000/business-slug/page-slug`
2. **By Domain**: If a business has a custom domain configured, requests to that domain are automatically routed to that business

Reserved slugs that cannot be used: `admin`, `api`, `uploads`, `public`, `favicon.ico`, `robots.txt`

### API Endpoints

- `POST /api/content/update` - Update content entries (requires authentication)
- `POST /api/upload` - Upload files (requires authentication and CSRF token)

### Content Management

Content is stored as key-value pairs with support for nested structures:

```javascript
// Global business content
{
  businessName: "Al's Diner",
  phone: '555-1234',
  contact: {
    email: { href: 'mailto:hello@example.com', text: 'hello@example.com' },
    address: '123 Main St'
  }
}

// Page-specific content
{
  pageTitle: 'About Us',
  aboutContent: { html: '<p>Our story...</p>' }
}
```

## Development

### Running Migrations

Apply pending migrations:
```bash
node scripts/migrate.js
```

Rollback last migration:
```bash
node scripts/migrate.js down
```

### Seeding Data

The seed script creates:
- An admin user (from environment variables)
- A sample business ("Al's Diner")
- Sample pages (home, about)
- Sample content
- Sample menu items

```bash
node scripts/seed.js
```

### Adding New Migrations

Create paired migration files in `migrations/`:
- `008_feature_name.up.sql` - Schema changes
- `008_feature_name.down.sql` - Rollback script

## Security

- Passwords are hashed using bcrypt
- Sessions are stored in PostgreSQL with httpOnly cookies
- CSRF protection on all state-changing routes
- File uploads are validated for type and size
- Tenant isolation ensures businesses can only access their own data

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
