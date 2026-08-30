import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const modelName = 'viago-behavioral-color-model-v1.0.json';
const model = JSON.parse(fs.readFileSync(new URL(`../data/v2-governance/${modelName}`, import.meta.url)));
const colors = ['red', 'blue', 'yellow', 'green'];
const evidenceClasses = ['HISTORICALLY_ESTABLISHED', 'OWNER_GOVERNED', 'SUPPORTED_INFERENCE', 'NOT_ESTABLISHED'];
const patternDimensions = ['decision', 'communication', 'work_execution', 'social_relationship', 'leadership_followership', 'conflict', 'pressure_stress', 'change', 'risk', 'planning_organization'];
const listDimensions = ['core_preferences', 'core_motivators', 'observable_indicators', 'strengths', 'overextensions', 'growth_behaviors', 'nonqualifying_behaviors'];

test('model identity is immutable, review-only, and not OWNER-approved', () => {
  assert.equal(model.model_id, 'VIAGO_BEHAVIORAL_COLOR_MODEL_V1_0');
  assert.equal(model.semantic_version, '1.0.0');
  assert.equal(model.status, 'PROPOSED_FOR_OWNER_REVIEW');
  assert.equal(model.owner_approval.approved, false);
  assert.equal(model.owner_approval.approved_at, null);
  assert.equal(model.runtime_authority, false);
  assert.deepEqual(model.evidence_classes, evidenceClasses);
});

test('every color has complete governed content and pairwise confusion coverage', () => {
  assert.deepEqual(Object.keys(model.colors).sort(), [...colors].sort());
  for (const color of colors) {
    const definition = model.colors[color];
    assert.equal(definition.identity.canonical_color.toLowerCase(), color);
    assertClaim(definition.identity.role, `${color}.identity.role`);
    assertClaim(definition.identity.essence, `${color}.identity.essence`);
    for (const dimension of listDimensions) {
      assert.ok(definition[dimension]?.length, `${color} missing ${dimension}`);
      definition[dimension].forEach((claim, index) => assertClaim(claim, `${color}.${dimension}[${index}]`));
    }
    for (const dimension of patternDimensions) {
      assert.ok(definition.patterns[dimension]?.length, `${color} missing patterns.${dimension}`);
      definition.patterns[dimension].forEach((claim, index) => assertClaim(claim, `${color}.patterns.${dimension}[${index}]`));
    }
    assert.deepEqual(definition.confusion_zones.map((zone) => zone.with).sort(), colors.filter((candidate) => candidate !== color).sort());
    definition.confusion_zones.forEach((claim, index) => assertClaim(claim, `${color}.confusion_zones[${index}]`));
  }
});

test('all substantive machine-readable claims carry an allowed evidence class', () => {
  const claims = [];
  visit(model, (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.claim === 'string') claims.push(value);
  });
  assert.ok(claims.length >= 90, `expected a substantial governed model, found ${claims.length} claims`);
  for (const claim of claims) assertClaim(claim, claim.claim.slice(0, 50));
});

test('universal-virtue rule and Yellow safeguards are explicit and fail closed', () => {
  assert.equal(model.universal_virtue_rule.evidence_class, 'OWNER_GOVERNED');
  for (const virtue of ['kindness', 'fairness', 'courage', 'competence', 'responsibility', 'honesty', 'accountability', 'accuracy', 'emotional maturity', 'good communication']) {
    assert.ok(model.universal_virtue_rule.behaviors.includes(virtue));
  }

  const yellow = JSON.stringify(model.colors.yellow).toLowerCase();
  for (const behavior of ['directness', 'confrontation', 'assertiveness', 'boundaries', 'introversion', 'quietness', 'soft-spokenness']) assert.match(yellow, new RegExp(behavior));
  assert.match(yellow, /not core yellow scoring evidence|do not independently score yellow/);
  assert.equal(model.colors.yellow.patterns.conflict[0].evidence_class, 'HISTORICALLY_ESTABLISHED');
  assert.equal(model.colors.yellow.growth_behaviors[0].evidence_class, 'OWNER_GOVERNED');
});

test('discriminator matrix compares all colors and labels its authority', () => {
  assert.ok(model.cross_color_discriminator_matrix.length >= 8);
  for (const row of model.cross_color_discriminator_matrix) {
    assert.ok(row.surface_behavior.length > 3);
    for (const color of colors) assert.ok(row[color].length > 10, `${row.surface_behavior} missing ${color}`);
    assert.ok(evidenceClasses.includes(row.evidence_class));
  }
});

test('proposed model remains isolated from application runtime', () => {
  assert.deepEqual(model.runtime_integration, {
    imported_by_application: false,
    used_by_scoring: false,
    used_by_selector: false,
    used_by_result_content: false,
    used_by_spanish_content: false,
  });
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /viago-behavioral-color-model-v1\.0|VIAGO_BEHAVIORAL_COLOR_MODEL_V1_0/);
  }
});

function assertClaim(value, location) {
  assert.equal(typeof value.claim, 'string', `${location} missing claim`);
  assert.ok(value.claim.length >= 12, `${location} claim too short`);
  assert.ok(evidenceClasses.includes(value.evidence_class), `${location} invalid evidence class`);
}

function visit(value, callback) {
  callback(value);
  if (Array.isArray(value)) value.forEach((item) => visit(item, callback));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => visit(item, callback));
}

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(child);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) yield child;
  }
}
