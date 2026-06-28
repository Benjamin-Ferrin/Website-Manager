const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { upload } = require('../middleware/upload');
const contentService = require('../services/content');
const assetService = require('../services/assets');

const router = express.Router();

router.use(requireAuth);

router.post('/content/update', express.json(), csrfProtection, async (req, res) => {
  try {
    const { businessId, pageId, content } = req.body;

    if (!businessId || !content || typeof content !== 'object') {
      return res.status(400).json({ error: 'businessId and content object required' });
    }

    const parsedPageId = pageId ? parseInt(pageId, 10) : null;
    await contentService.updateContent(parseInt(businessId, 10), parsedPageId, content);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const token = req.body?._csrf || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    const businessId = parseInt(req.body.businessId, 10);
    if (!businessId || !req.file) {
      return res.status(400).json({ error: 'businessId and file required' });
    }

    const asset = await assetService.saveAsset(businessId, req.file);
    res.json({
      success: true,
      asset: {
        id: asset.id,
        url: asset.public_url,
        mime_type: asset.mime_type,
        original_name: asset.original_name,
        pdf_document: asset.pdf_document || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
