import { APIError } from './apiError.js';

/**
 * Injects role-based scope filters into a MongoDB query filter object.
 *
 * - HQ_ADMIN / DEVICE : no restriction
 * - PROVINCIAL        : scoped to their assigned province (_id or province field)
 * - STATION           : scoped to their assigned station/district/province
 *                       depending on the resource type
 *
 * @param {Object} user       - req.user (Mongoose User document)
 * @param {Object} filter     - MongoDB filter object being built (mutated in place)
 * @param {'province'|'district'|'station'|'tuktuk'} resource
 */
export function injectScopeFilter(user, filter, resource) {
  if (user.role === 'HQ_ADMIN') return;

  if (user.role === 'DEVICE') {
    // A device may only see its own tuk-tuk when a list is queried.
    if (resource === 'tuktuk') {
      filter.registrationNumber = user.registrationNumber?.toUpperCase();
    }
    return;
  }

  if (user.role === 'PROVINCIAL') {
    if (resource === 'province') {
      filter._id = user.province;
    } else {
      // districts, stations, tuktuks all have a `province` reference field
      filter.province = user.province;
    }
    return;
  }

  if (user.role === 'STATION') {
    if (resource === 'province') {
      filter._id = user.province;
    } else if (resource === 'district') {
      filter._id = user.district;
    } else if (resource === 'station') {
      filter._id = user.station;
    } else {
      // tuktuk / location pings — scope to the user's station
      filter.station = user.station;
    }
  }
}

/**
 * Asserts that a fetched Mongoose document is within the caller's scope.
 * Throws 403 Forbidden if out of scope.
 *
 * - HQ_ADMIN / DEVICE : always passes
 * - PROVINCIAL        : document must belong to the user's province
 * - STATION           : document must belong to the user's station (or district/province
 *                       for reference data)
 *
 * @param {Object} user       - req.user
 * @param {Object} doc        - fetched Mongoose document
 * @param {'province'|'district'|'station'|'tuktuk'} resource
 */
export function assertScope(user, doc, resource) {
  if (user.role === 'HQ_ADMIN') return;

  if (user.role === 'DEVICE') {
    // A device may only access its own tuk-tuk record.
    if (resource === 'tuktuk' && doc.registrationNumber !== user.registrationNumber?.toUpperCase()) {
      throw new APIError(403, 'Forbidden', 'Device can only access its own tuk-tuk');
    }
    return;
  }

  if (user.role === 'PROVINCIAL') {
    const provinceId = resource === 'province' ? doc._id : doc.province;
    if (!provinceId?.equals(user.province)) {
      throw new APIError(403, 'Forbidden', 'Resource is outside your assigned province');
    }
    return;
  }

  if (user.role === 'STATION') {
    if (resource === 'province') {
      if (!doc._id.equals(user.province))
        throw new APIError(403, 'Forbidden', 'Resource is outside your assigned province');
    } else if (resource === 'district') {
      if (!doc._id.equals(user.district))
        throw new APIError(403, 'Forbidden', 'Resource is outside your assigned district');
    } else if (resource === 'station') {
      if (!doc._id.equals(user.station))
        throw new APIError(403, 'Forbidden', 'Resource is outside your assigned station');
    } else {
      // tuktuk
      if (!doc.station?.equals(user.station))
        throw new APIError(403, 'Forbidden', 'Resource is outside your assigned station');
    }
  }
}
