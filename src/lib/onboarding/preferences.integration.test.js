import { expect, test } from 'bun:test';
import { createClient } from '@supabase/supabase-js';
import { BUILD_TARGET, DEVICE, USAGE, ONBOARDING_METADATA_KEY, preferencesFromUser } from './preferences.js';

// RUN_ONBOARDING_INTEGRATION=1 with the local stack's SUPABASE_* environment.
const integrationTest = process.env.RUN_ONBOARDING_INTEGRATION === '1' ? test : test.skip;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for local onboarding integration tests.`);
  return value;
}

integrationTest('signup choices and later changes persist across independent Supabase sessions', async () => {
  const url = requiredEnv('SUPABASE_URL');
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1', 'supaclank.test'].includes(parsed.hostname) || parsed.port !== '54321') {
    throw new Error('This test only creates users in the local Supabase stack on port 54321.');
  }
  const anonKey = requiredEnv('SUPABASE_ANON_KEY');
  const secretKey = requiredEnv('SUPABASE_SECRET_KEY');
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient(url, secretKey, options);
  const firstSession = createClient(url, anonKey, options);
  const secondSession = createClient(url, anonKey, options);
  const credentials = { email: `onboarding-${crypto.randomUUID()}@clank.local`, password: crypto.randomUUID() };
  const preferences = { version: 1, buildTargets: [BUILD_TARGET.web, BUILD_TARGET.mobile], devices: [DEVICE.laptop, DEVICE.mobile], usage: USAGE.cloud };
  let userID;

  try {
    const signup = await firstSession.auth.signUp({
      ...credentials,
      options: { data: { [ONBOARDING_METADATA_KEY]: preferences } }
    });
    userID = signup.data.user?.id;
    expect(signup.error).toBeNull();
    expect(signup.data.session).not.toBeNull();
    expect(preferencesFromUser(signup.data.user)).toEqual(preferences);

    const login = await secondSession.auth.signInWithPassword(credentials);
    expect(login.error).toBeNull();
    expect(preferencesFromUser(login.data.user)).toEqual(preferences);

    const changed = { ...preferences, usage: USAGE.local };
    const updated = await secondSession.auth.updateUser({ data: { [ONBOARDING_METADATA_KEY]: changed } });
    expect(updated.error).toBeNull();
    const reloaded = await firstSession.auth.getUser();
    expect(reloaded.error).toBeNull();
    expect(preferencesFromUser(reloaded.data.user)).toEqual(changed);
  } finally {
    if (userID) {
      const { error } = await admin.auth.admin.deleteUser(userID);
      if (error) throw new Error(`Could not remove onboarding test user ${userID}: ${error.message}`);
    }
  }
}, 15000);
