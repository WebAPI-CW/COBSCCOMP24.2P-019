export const getPaginationData = async (model, query, filter = {}, populateOptions = null, defaultLimit = 10, sortOptions = null) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || defaultLimit;
  const offset = (page - 1) * limit;

  const total = await model.countDocuments(filter);
  let queryObj = model.find(filter).skip(offset).limit(limit);
  
  // Resolve sort order:
  //   1. ?sort=field:asc or ?sort=field:desc from query string (client-driven)
  //   2. sortOptions argument passed by the controller
  //   3. Default: newest first
  let resolvedSort;
  if (query.sort) {
    const [field, order] = query.sort.split(':');
    resolvedSort = { [field]: order === 'asc' ? 1 : -1 };
  } else if (sortOptions) {
    resolvedSort = sortOptions;
  } else {
    resolvedSort = { createdAt: -1 };
  }
  queryObj = queryObj.sort(resolvedSort);

  if (populateOptions) {
    if (Array.isArray(populateOptions)) {
      populateOptions.forEach(opt => queryObj = queryObj.populate(opt));
    } else {
      queryObj = queryObj.populate(populateOptions);
    }
  }
  
  const data = await queryObj;

  const qs = { ...query };
  delete qs.page;
  delete qs.limit;
  const stringifiedQs = Object.keys(qs).length > 0
    ? '&' + Object.keys(qs).map(k => `${k}=${qs[k]}`).join('&')
    : '';

  return {
    page,
    total,
    offset,
    limit,
    next: offset + limit < total ? `?page=${page + 1}&limit=${limit}${stringifiedQs}` : null,
    previous: offset > 0 ? `?page=${page - 1}&limit=${limit}${stringifiedQs}` : null,
    data
  };
};
