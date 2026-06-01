import { comparePasswords } from './src/utils/password.js';

async function main() {
    const hash = '$2b$10$3qvF38f5fO1MWWjbCUOH3uBpFAwmufqgW6Z8CjOTKsP87ZcShOC.O';
    const result = await comparePasswords('SuperAdmin@123', hash);
    console.log({ result });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
