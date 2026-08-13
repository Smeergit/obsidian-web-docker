#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VAULT_PATH = process.env.VAULT_PATH || 'user-data/demo-vault';
const VAULT_REGISTRY = process.env.VAULT_REGISTRY || 'user-data/registry.json';

function computeVaultId() {
  if (process.env.VAULT_ID) return process.env.VAULT_ID;
  const resolved = path.resolve(VAULT_PATH);
  return crypto.createHash('sha256').update(resolved).digest('hex').slice(0, 16);
}

const resolvedVaultPath = path.resolve(VAULT_PATH);
const resolvedRegistryPath = path.resolve(VAULT_REGISTRY);
const id = computeVaultId();

if (!fs.existsSync(resolvedVaultPath)) {
  console.error(`[registry-init] FEHLER: VAULT_PATH existiert nicht: ${resolvedVaultPath}`);
  process.exit(1);
}
const stat = fs.statSync(resolvedVaultPath);
if (!stat.isDirectory()) {
  console.error(`[registry-init] FEHLER: VAULT_PATH ist kein Verzeichnis: ${resolvedVaultPath}`);
  process.exit(1);
}
try {
  fs.accessSync(resolvedVaultPath, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
  console.error(`[registry-init] FEHLER: keine Lese/Schreib-Berechtigung auf ${resolvedVaultPath}: ${err.message}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(resolvedRegistryPath), { recursive: true });

let registry = {};
if (fs.existsSync(resolvedRegistryPath)) {
  try {
    registry = JSON.parse(fs.readFileSync(resolvedRegistryPath, 'utf8'));
  } catch (err) {
    console.warn(`[registry-init] Warnung: registry.json nicht lesbar (${err.message}), wird neu angelegt`);
    registry = {};
  }
}

registry[id] = { path: resolvedVaultPath, ts: Date.now(), open: true };
fs.writeFileSync(resolvedRegistryPath, JSON.stringify(registry, null, 2));
console.log(`[registry-init] Vault registriert: id=${id} path=${resolvedVaultPath} registry=${resolvedRegistryPath}`);
