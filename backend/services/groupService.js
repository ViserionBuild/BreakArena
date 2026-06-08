const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../database/supabase');

const TABLE = 'groups';
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'breakarena-secret-change-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

/**
 * Shape returned to the client – never expose passcode_hash.
 */
const sanitize = (row) => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const signToken = (groupId, groupName) =>
  jwt.sign({ groupId, groupName }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Create a new group.
 * Throws 409 if name already taken.
 */
const createGroup = async ({ name, passcode }) => {
  if (!name?.trim() || !passcode?.trim()) {
    const err = new Error('name and passcode are required');
    err.statusCode = 400;
    throw err;
  }

  const passcodeHash = await bcrypt.hash(passcode.trim(), SALT_ROUNDS);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name: name.trim(), passcode_hash: passcodeHash })
    .select()
    .single();

  if (error) {
    // Unique violation on name
    if (error.code === '23505') {
      const err = new Error('A group with that name already exists');
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }

  const token = signToken(data.id, data.name);
  return { group: sanitize(data), token };
};

/**
 * Sign in to an existing group.
 * Throws 401 on wrong passcode, 404 if group not found.
 */
const signIn = async ({ name, passcode }) => {
  if (!name?.trim() || !passcode?.trim()) {
    const err = new Error('name and passcode are required');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .ilike('name', name.trim())
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  const valid = await bcrypt.compare(passcode.trim(), data.passcode_hash);
  if (!valid) {
    const err = new Error('Incorrect passcode');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(data.id, data.name);
  return { group: sanitize(data), token };
};

/**
 * Reset (change) a group passcode — requires the current passcode.
 */
const resetPasscode = async ({ name, currentPasscode, newPasscode }) => {
  if (!name?.trim() || !currentPasscode?.trim() || !newPasscode?.trim()) {
    const err = new Error('name, currentPasscode, and newPasscode are required');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .ilike('name', name.trim())
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }

  const valid = await bcrypt.compare(currentPasscode.trim(), data.passcode_hash);
  if (!valid) {
    const err = new Error('Current passcode is incorrect');
    err.statusCode = 401;
    throw err;
  }

  const newHash = await bcrypt.hash(newPasscode.trim(), SALT_ROUNDS);

  const { data: updated, error: updateError } = await supabase
    .from(TABLE)
    .update({ passcode_hash: newHash })
    .eq('id', data.id)
    .select()
    .single();

  if (updateError) throw updateError;

  const token = signToken(updated.id, updated.name);
  return { group: sanitize(updated), token };
};

/**
 * Verify a JWT and return the decoded payload.
 * Used by middleware to protect routes.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Fetch a group by ID (for profile / info display).
 */
const getGroupById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const err = new Error('Group not found');
    err.statusCode = 404;
    throw err;
  }
  return sanitize(data);
};

module.exports = { createGroup, signIn, resetPasscode, verifyToken, getGroupById };
