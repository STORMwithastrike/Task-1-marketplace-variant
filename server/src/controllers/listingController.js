import { Listing } from '../models/Listing.js';
import Joi from 'joi';

// Schema for creating a new listing (stricter: requires title and price)
const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(), // Must be non-negative
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other').default('other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn').default('used'),
  status: Joi.string().valid('active', 'sold', 'removed').default('active'),
  seller: Joi.string().hex().length(24).optional() // Validates MongoDB ObjectId format
});
// Schema for updating (all fields are optional, just validate the types if they are provided)
const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
});

// TODO: write a validation schema for create/update per README.md section 2.

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    // Section 3 & 4: Exclude removed listings by default, allow opt-in via ?includeRemoved=true
    const query = {};
    if (req.query.includeRemoved !== 'true') {
      query.status = { $ne: 'removed' };
    }
    // Section 6: populate seller with name and email
    const listings = await Listing.find(query)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    // Section 6: populate seller with name and email
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Section 4: Ensure GET endpoint doesn't silently show removed listings
    if (listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Prevent updating a removed listing
    const existing = await Listing.findById(req.params.id);
    if (!existing || existing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );

    res.json({ listing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    // Section 4: Soft delete by setting status to 'removed' instead of deleting
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true }
    );

    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    res.json({ ok: true });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold
// Section 5: Mark as sold
export async function markAsSold(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'sold' } },
      { new: true }
    );

    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    res.json({ listing });
  } catch (err) { next(err); }
}
