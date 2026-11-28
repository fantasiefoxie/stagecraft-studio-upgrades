/**
 * Stagecraft Studio — Living LLM Docs Synchronizer (Wave 7)
 *
 * Writes:
 *   1. `STAGECRAFT_LLM_INSTRUCTIONS.md` (100% auto-generated from live runtime catalogs)
 *   2. The `<!-- STAGECRAFT_AUTO_SYNC_START --> ... <!-- STAGECRAFT_AUTO_SYNC_END -->`
 *      block inside `LLM_STORY_STAGE_GUIDE.md`.
 *
 * Usage:
 *   npm run sync-docs             # regenerate / sync both files
 *   npm run sync-docs -- --check  # verify zero drift (exits 1 if out of sync)
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  AUTO_SYNC_END_MARKER,
  AUTO_SYNC_START_MARKER,
  buildGuideAutoSyncSectionMd,
  buildStagecraftLlmInstructionsMd,
  computeStudioCatalogFingerprint,
} from '../src/studio/llmMasterGuideBuilder';

const ROOT = process.cwd();
const INSTRUCTIONS_PATH = path.join(ROOT, 'STAGECRAFT_LLM_INSTRUCTIONS.md');
const GUIDE_PATH = path.join(ROOT, 'LLM_STORY_STAGE_GUIDE.md');

function spliceAutoSyncBlock(existingGuide: string, autoBlock: string): string {
  const startIdx = existingGuide.indexOf(AUTO_SYNC_START_MARKER);
  const endIdx = existingGuide.indexOf(AUTO_SYNC_END_MARKER);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existingGuide.slice(0, startIdx).replace(/\s+$/, '');
    const after = existingGuide.slice(endIdx + AUTO_SYNC_END_MARKER.length).replace(/^\s+/, '');
    return after ? `${before}\n\n${autoBlock}\n\n${after}\n` : `${before}\n\n${autoBlock}\n`;
  }

  const trimmed = existingGuide.replace(/\s+$/, '');
  return `${trimmed}\n\n---\n\n${autoBlock}\n`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const expectedInstructions = buildStagecraftLlmInstructionsMd();
  const expectedAutoBlock = buildGuideAutoSyncSectionMd();
  const fingerprint = computeStudioCatalogFingerprint();

  const currentGuide = fs.existsSync(GUIDE_PATH) ? fs.readFileSync(GUIDE_PATH, 'utf8') : '';
  const expectedGuide = spliceAutoSyncBlock(currentGuide, expectedAutoBlock);

  if (checkOnly) {
    const diffs: string[] = [];
    if (!fs.existsSync(INSTRUCTIONS_PATH)) {
      diffs.push('STAGECRAFT_LLM_INSTRUCTIONS.md is missing');
    } else {
      const actualInstructions = fs.readFileSync(INSTRUCTIONS_PATH, 'utf8');
      if (actualInstructions !== expectedInstructions) {
        diffs.push('STAGECRAFT_LLM_INSTRUCTIONS.md is out of sync with live catalogs');
      }
    }

    if (!fs.existsSync(GUIDE_PATH)) {
      diffs.push('LLM_STORY_STAGE_GUIDE.md is missing');
    } else if (currentGuide !== expectedGuide) {
      diffs.push('LLM_STORY_STAGE_GUIDE.md auto-sync block is out of sync with live catalogs');
    }

    if (diffs.length > 0) {
      console.error('LLM docs drift detected:');
      for (const d of diffs) console.error(`  - ${d}`);
      console.error('Run `npm run sync-docs` to update.');
      process.exit(1);
    }

    console.log(`OK: Living LLM docs are in sync (fingerprint ${fingerprint}).`);
    return;
  }

  fs.writeFileSync(INSTRUCTIONS_PATH, expectedInstructions, 'utf8');
  fs.writeFileSync(GUIDE_PATH, expectedGuide, 'utf8');
  console.log(
    `Synced STAGECRAFT_LLM_INSTRUCTIONS.md & LLM_STORY_STAGE_GUIDE.md (fingerprint ${fingerprint}).`
  );
}

main();
