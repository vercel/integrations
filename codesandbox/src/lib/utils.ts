import zeitFetch from '@zeit/fetch';
import nodefetch from 'node-fetch';
import { ViewOptions, UIError } from '../types';

export const fetch = zeitFetch(nodefetch);

export function addErrorById(viewOptions: ViewOptions, id: string, err: UIError) {
  viewOptions.errors = viewOptions.errors || {};
  viewOptions.errors.byId = viewOptions.errors.byId || {};
  viewOptions.errors.byId[id] = err;
}

export function getErrorById(viewOptions: ViewOptions, id: string) {
  return viewOptions.errors && viewOptions.errors.byId && viewOptions.errors.byId[id];
}

export const getQueryStr = (obj: { [k: string]: string | number | null | undefined }) => {
  const queryStr = Object.keys(obj)
    .filter(k => obj[k])
    .map(k => `${k}=${obj[k]}`)
    .join('&');

  return queryStr ? `?${queryStr}` : '';
};
