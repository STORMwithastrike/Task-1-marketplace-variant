import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markAsSold
} from '../controllers/listingController.js';

const router = Router();

// CRUD operations
router.route('/')
  .get(getAllListings)
  .post(createListing);

router.route('/:id')
  .get(getListing)
  .patch(updateListing)
  .delete(deleteListing);

// Specific action to mark as sold (Section 5)
router.patch('/:id/sold', markAsSold);

export default router;
