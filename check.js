

import * as fs from "fs";

const compromised = JSON.parse(fs.readFileSync("compromessi.json"));
const lock = JSON.parse(fs.readFileSync("package-lock.json"));

const found = [];

for (const pkg of compromised.compromised_packages) {
  const versions = pkg.versions;
  const deps = lock.packages || lock.dependencies;

  for (const dep in deps) {
    if (dep.includes(pkg.name)) {
      const installed = deps[dep].version || deps[dep];
      if (versions.includes(installed)) {
        found.push({ name: pkg.name, version: installed });
      }
    }
  }
}

if (found.length) {
  console.log("⚠️ Pacchetti compromessi trovati:");
  console.table(found);
} else {
  console.log("✅ Nessun pacchetto compromesso trovato");
}
