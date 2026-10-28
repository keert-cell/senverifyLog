import { describe, expect, it, vi } from "vitest";
import { signOutToLogin } from "@/lib/sign-out";

function actions(signOut = vi.fn().mockResolvedValue(undefined)) {
  return {
    cancelQueries: vi.fn().mockResolvedValue(undefined),
    clearQueries: vi.fn(),
    signOut,
    clearStorage: vi.fn(),
    navigate: vi.fn().mockResolvedValue(undefined),
    reloadLogin: vi.fn(),
  };
}

describe("Sign out to login", () => {
  it("clears protected cache and storage before navigating to login", async () => {
    const flow = actions();
    await signOutToLogin(flow);
    expect(flow.clearQueries).toHaveBeenCalledOnce();
    expect(flow.clearStorage).toHaveBeenCalledOnce();
    expect(flow.navigate).toHaveBeenCalledOnce();
    expect(flow.clearStorage.mock.invocationCallOrder[0]).toBeLessThan(flow.navigate.mock.invocationCallOrder[0] ?? 0);
    expect(flow.reloadLogin).not.toHaveBeenCalled();
  });

  it("clears storage and opens login when sign out fails", async () => {
    const flow = actions(vi.fn().mockRejectedValue(new Error("Network unavailable")));
    await signOutToLogin(flow);
    expect(flow.clearStorage).toHaveBeenCalledOnce();
    expect(flow.reloadLogin).toHaveBeenCalledOnce();
  });

  it("opens login after 1500ms when sign out stalls", async () => {
    vi.useFakeTimers();
    try {
      const flow = actions(vi.fn(() => new Promise(() => {})));
      const pending = signOutToLogin(flow);
      await vi.advanceTimersByTimeAsync(1500);
      await pending;
      expect(flow.clearStorage).toHaveBeenCalledOnce();
      expect(flow.reloadLogin).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
});