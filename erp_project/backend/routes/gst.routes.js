import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
  listReturns,
  generateReturn,
  fetchReturn,
  modifyReturnStatus
} from '../controllers/gst_return.controller.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
  .get(listReturns);

router.route('/generate')
  .post(generateReturn);

router.route('/:id')
  .get(fetchReturn)
  .patch(modifyReturnStatus);

export default router;
