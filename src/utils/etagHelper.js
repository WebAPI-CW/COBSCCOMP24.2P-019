import crypto from 'crypto';
import { APIError } from './apiError.js';
import { sltReplacer } from './dateHelper.js';

/**
 * Validates the If-Match header for Conditional PUT operations.
 * Throws a 412 Precondition Failed if the ETag does not match.
 * 
 * @param {Object} req - Express request object
 * @param {Object} currentDoc - The current Mongoose document as it would be returned by GET
 */
export const validateIfMatch = (req, currentDoc) => {
  const ifMatch = req.headers['if-match'];
  if (!ifMatch) return; // If-Match is optional unless strictly enforced by business logic

  // Stringify using the same sltReplacer that res.json() applies, so the hash
  // matches the ETag the client received from the prior GET response.
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(currentDoc, sltReplacer))
    .digest('hex');
  
  const expectedEtag = `"${hash}"`;

  // WSO2/RFC 7232: Match exact ETag or '*'
  if (ifMatch !== expectedEtag && ifMatch !== '*') {
    throw new APIError(412, 'Precondition Failed', 'ETag does not match (resource modified)');
  }
};
