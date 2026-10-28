type SignOutActions = {
  cancelQueries: () => Promise<unknown>;
  clearQueries: () => void;
  signOut: () => Promise<unknown>;
  clearStorage: () => void;
  navigate: () => Promise<unknown>;
  reloadLogin: () => void;
};

// A stalled logout must not leave a user looking at protected content.
export async function signOutToLogin(actions: SignOutActions) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let signedOut = false;
  try {
    await actions.cancelQueries();
    actions.clearQueries();
    await Promise.race([
      actions.signOut().then(() => { signedOut = true; }),
      new Promise<void>((resolve) => { timer = setTimeout(resolve, 1500); }),
    ]);
  } catch {
    // Clear browser storage and reload login if the auth client failed.
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    actions.clearStorage();
    if (!signedOut) {
      actions.reloadLogin();
    } else {
      try { await actions.navigate(); }
      catch { actions.reloadLogin(); }
    }
  }
}