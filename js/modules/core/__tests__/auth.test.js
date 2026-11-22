/**
 * @jest-environment jsdom
 */
import { afterEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../../supabase.js', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    }
  }
}));

const esperarArranque = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
  document.body.innerHTML = '';
});

describe('auth.js on pages without the login form', () => {
  test('stays silent when #authContainer is missing', async () => {
    document.body.innerHTML = '<main>landing</main>';
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await import('../auth.js');
    await esperarArranque();

    expect(error).not.toHaveBeenCalled();
  });

  test('still reports a login page that lost its toggle button', async () => {
    document.body.innerHTML = '<div id="authContainer"><button id="btnShowLogin"></button></div>';
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await import('../auth.js');
    await esperarArranque();

    expect(error).toHaveBeenCalledWith('❌ btnShowRegister no encontrado en el DOM');
  });
});
