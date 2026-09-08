import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ensureWritePermission,
  supportsFileSystemAccess,
  tryGetFileSystemHandle,
  tryShowOpenFilePicker,
  writeToHandle,
} from "@/lib/fs/file-system-access";

afterEach(() => {
  // @ts-expect-error -- test-only cleanup of a property this suite adds to `window`
  delete window.showOpenFilePicker;
});

describe("tryGetFileSystemHandle", () => {
  it("returns null when the browser doesn't implement getAsFileSystemHandle", async () => {
    const item = {} as DataTransferItem;
    expect(await tryGetFileSystemHandle(item)).toBeNull();
  });

  it("returns the handle when the browser resolves a file handle", async () => {
    const handle = { kind: "file", getFile: vi.fn(), createWritable: vi.fn() };
    const item = { getAsFileSystemHandle: vi.fn().mockResolvedValue(handle) } as unknown as DataTransferItem;
    expect(await tryGetFileSystemHandle(item)).toBe(handle);
  });

  it("returns null (not the handle) when the drop was a directory, not a file", async () => {
    const handle = { kind: "directory" };
    const item = { getAsFileSystemHandle: vi.fn().mockResolvedValue(handle) } as unknown as DataTransferItem;
    expect(await tryGetFileSystemHandle(item)).toBeNull();
  });

  it("returns null rather than throwing when getAsFileSystemHandle itself rejects", async () => {
    const item = { getAsFileSystemHandle: vi.fn().mockRejectedValue(new Error("permission denied")) } as unknown as DataTransferItem;
    await expect(tryGetFileSystemHandle(item)).resolves.toBeNull();
  });
});

describe("tryShowOpenFilePicker", () => {
  it("returns null when the browser doesn't implement showOpenFilePicker", async () => {
    expect(await tryShowOpenFilePicker()).toBeNull();
  });

  it("returns the file and handle on a successful pick", async () => {
    const file = new File(["<html></html>"], "page.html", { type: "text/html" });
    const handle = { getFile: vi.fn().mockResolvedValue(file), createWritable: vi.fn() };
    // @ts-expect-error -- test-only stub of a browser API not in every lib.dom version
    window.showOpenFilePicker = vi.fn().mockResolvedValue([handle]);

    const result = await tryShowOpenFilePicker();
    expect(result).toEqual({ file, handle });
  });

  it("returns null (not a thrown error) when the person cancels the picker", async () => {
    // @ts-expect-error -- test-only stub
    window.showOpenFilePicker = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    expect(await tryShowOpenFilePicker()).toBeNull();
  });

  it("rethrows a real (non-cancel) failure rather than swallowing it", async () => {
    // @ts-expect-error -- test-only stub
    window.showOpenFilePicker = vi.fn().mockRejectedValue(new Error("disk error"));
    await expect(tryShowOpenFilePicker()).rejects.toThrow("disk error");
  });
});

describe("writeToHandle", () => {
  it("writes the content and closes the writable stream", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const handle = { getFile: vi.fn(), createWritable: vi.fn().mockResolvedValue({ write, close }) };

    await writeToHandle(handle, "<html>edited</html>");

    expect(write).toHaveBeenCalledWith("<html>edited</html>");
    expect(close).toHaveBeenCalled();
  });
});

describe("ensureWritePermission", () => {
  it("assumes access is granted when the handle exposes no permission methods at all", async () => {
    const handle = { getFile: vi.fn(), createWritable: vi.fn() };
    await expect(ensureWritePermission(handle)).resolves.toBe(true);
  });

  it("returns true immediately when permission is already granted", async () => {
    const handle = {
      getFile: vi.fn(),
      createWritable: vi.fn(),
      queryPermission: vi.fn().mockResolvedValue("granted"),
      requestPermission: vi.fn(),
    };
    await expect(ensureWritePermission(handle)).resolves.toBe(true);
    expect(handle.requestPermission).not.toHaveBeenCalled();
  });

  it("requests permission when the current state isn't granted, and returns the request's result", async () => {
    const handle = {
      getFile: vi.fn(),
      createWritable: vi.fn(),
      queryPermission: vi.fn().mockResolvedValue("prompt"),
      requestPermission: vi.fn().mockResolvedValue("granted"),
    };
    await expect(ensureWritePermission(handle)).resolves.toBe(true);
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: "readwrite" });
  });

  it("returns false when the person denies the permission request", async () => {
    const handle = {
      getFile: vi.fn(),
      createWritable: vi.fn(),
      queryPermission: vi.fn().mockResolvedValue("prompt"),
      requestPermission: vi.fn().mockResolvedValue("denied"),
    };
    await expect(ensureWritePermission(handle)).resolves.toBe(false);
  });

  it("returns false rather than throwing when the permission check itself errors", async () => {
    const handle = {
      getFile: vi.fn(),
      createWritable: vi.fn(),
      queryPermission: vi.fn().mockRejectedValue(new Error("boom")),
    };
    await expect(ensureWritePermission(handle)).resolves.toBe(false);
  });
});

describe("supportsFileSystemAccess", () => {
  it("returns true when showOpenFilePicker is present", () => {
    // @ts-expect-error -- test-only stub
    window.showOpenFilePicker = vi.fn();
    expect(supportsFileSystemAccess()).toBe(true);
  });

  it("returns false when neither showOpenFilePicker nor drag-drop handle support is present", () => {
    // Simulates Firefox/Safari, where jsdom's own DataTransferItem (if any)
    // also has no getAsFileSystemHandle — same as the real thing.
    expect(supportsFileSystemAccess()).toBe(false);
  });
});
