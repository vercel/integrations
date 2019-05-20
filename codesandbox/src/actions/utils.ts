export const SETUP = 'setup';

export const CREATE_SANDBOX = 'createSandbox';

export const LOGOUT = 'logout';

export const newAction = (...args: string[]) => args.join('/');

export const equalsAction = (str: string, action: string) => {
  return str.split('/')[0] === action;
};

export const actionArgs = (action: string) => action.split('/').slice(1);
