export const getPaginationData = async (model, query, filter = {}, populateOptions = null, defaultLimit = 10, sortOptions = null) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || defaultLimit;
  const offset = (page - 1) * limit;

  const total = await model.countDocuments(filter);
  let queryObj = model.find(filter).skip(offset).limit(limit);
  
  if (sortOptions) {
    queryObj = queryObj.sort(sortOptions);
  }

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
