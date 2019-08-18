import * as p from 'path';


export const ROOT_DIR = p.resolve(__dirname, '../../');
export const SRC = p.join(ROOT_DIR, 'server', 'src');
export const SECRETS_DIR = p.join(ROOT_DIR, 'secrets');

export const JWT_SECRET_PATH = p.join(SECRETS_DIR, 'jwtRS256.key');
export const JWT_PUBLIC_PATH = p.join(SECRETS_DIR, 'jwtRS256.key.pub');
