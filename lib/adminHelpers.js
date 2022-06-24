
// import package

// import lib
import isEmpty from '../lib/isEmpty';

export const paginationQuery = (query = {}) => {

    let pagination = {
        skip: 0,
        limit: 10,
        page: 1
    }

    if (!isEmpty(query) && !isEmpty(query.page) && !isEmpty(query.limit)) {
        pagination['skip'] = (query.page - 1) * query.limit;
        pagination['limit'] = Number(query.limit)
        pagination['page'] = Number(query.page)
    }

    return pagination;
}

export const filterQuery = (query = {}, nonRegExp = []) => {
    let filter = {};

   
    if (!isEmpty(query)) {
        for (const [key, value] of Object.entries(query)) {
            if (key != 'page' && key != 'limit') {
                if (nonRegExp.includes(key)) {
                    filter[key] = Number(value);
                } else {
                    filter[key] = new RegExp(value, 'i');
                }
            }
        }
    }
    return filter;
}

export const filterProofQuery = (query = {}, nonRegExp = [], additionKey = '') => {
    let filter = {};

    if (!isEmpty(query)) {
        for (const [key, value] of Object.entries(query)) {
            if (key != 'page' && key != 'limit') {
                if (nonRegExp.includes(key)) {
                    filter[additionKey + '.' + key] = Number(value);
                } else {
                    filter[additionKey + '.' + key] = new RegExp(value, 'i');
                }
            }
        }
    }
    return filter;
}

export const filterSearchQuery = (query = {}, fields = []) => {
    let filterQuery = {}
    if (!isEmpty(query) && !isEmpty(query.search)) {
        let filterArray = []
        for (const key of fields) {
            let filter = {};
            filter[key] = new RegExp(query.search, 'i');
            filterArray.push(filter)
        }
        filterQuery = { "$or": filterArray };
    }
    return filterQuery
}