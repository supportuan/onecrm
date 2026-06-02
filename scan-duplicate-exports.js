const fs = require("fs");
const path = require("path");
const root = path.join(process.cwd(), "Backend/src");
const files = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (full.endsWith(".ts")) {
      files.push(full);
    }
  }
}

walk(root);
const duplicates = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const re = /export const ([A-Za-z0-9_]+)\s*=\s*async/g;
  const counts = {};
  let m;
  while ((m = re.exec(text))) {
    if (!counts[m[1]]) counts[m[1]] = 0;
    counts[m[1]] += 1;
  }
  for (const [name, count] of Object.entries(counts)) {
    if (count > 1) duplicates.push({ file, name, count });
  }
}
if (duplicates.length === 0) {
  console.log("No duplicate export names found within single files.");
} else {
  console.log("Duplicates:");
  duplicates.forEach((d) => console.log(`${d.file}: ${d.name} x${d.count}`));
}
