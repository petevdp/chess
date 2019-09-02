import  p from 'path';


export const ROOT_DIR = p.resolve(__dirname, '../');
export const SECRETS_DIR = p.join(ROOT_DIR, 'secrets');
export const COMMON_DIR = p.join(ROOT_DIR, 'common');

export const JWT_SECRET_PATH = p.join(SECRETS_DIR, 'jwtRS256.key');
export const JWT_PUBLIC_PATH = p.join(SECRETS_DIR, 'jwtRS256.key.pub');
