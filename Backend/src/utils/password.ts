import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
    if (typeof password !== 'string' || typeof hash !== 'string' || !password || !hash) {
        return false;
    }
    return bcrypt.compare(password, hash);
};
