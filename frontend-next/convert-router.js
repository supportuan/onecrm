const fs = require('fs');
const path = require('path');

function replaceRouter(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace Outlet with children in Layout
    if (path.basename(filePath) === 'Layout.jsx') {
        content = content.replace("import { Outlet } from 'react-router-dom';", "");
        content = content.replace("const Layout = () => {", "const Layout = ({ children }) => {");
        content = content.replace("<Outlet />", "{children}");
        changed = true;
    }

    // Replace react-router-dom imports with next/link and next/navigation
    if (content.includes('react-router-dom')) {
        content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];?/g, (match, imports) => {
            let newImports = [];
            let nextLinkImports = [];
            let nextNavImports = [];

            const parts = imports.split(',').map(s => s.trim());
            parts.forEach(part => {
                if (part === 'Link' || part === 'NavLink') {
                    nextLinkImports.push('Link');
                } else if (part === 'useNavigate' || part === 'useLocation') {
                    nextNavImports.push(part === 'useNavigate' ? 'useRouter as useNavigate' : 'usePathname as useLocation');
                }
            });

            let res = '';
            if (nextLinkImports.length > 0) res += `import Link from 'next/link';\n`;
            if (nextNavImports.length > 0) res += `import { ${nextNavImports.join(', ')} } from 'next/navigation';\n`;
            return res;
        });

        // Replace <NavLink to="..."> with <Link href="...">
        content = content.replace(/<NavLink/g, '<Link');
        content = content.replace(/<\/NavLink>/g, '</Link>');
        content = content.replace(/ to=/g, ' href=');
        
        // Replace <Link to="..."> with <Link href="...">
        content = content.replace(/<Link([^>]+)to=/g, '<Link$1href=');
        
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            replaceRouter(fullPath);
        }
    }
}

traverse(path.join(__dirname, 'src', 'components'));
traverse(path.join(__dirname, 'src', 'pages-old'));
traverse(path.join(__dirname, 'src', 'lib'));
