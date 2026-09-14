import { beforeEach, describe, expect, it } from "vitest";
import {
  hasAppleTouchIcon,
  hasSameOriginSelfOrAncestorAppleTouchIcon,
  removeManagedAppleTouchIcon,
  syncManagedAppleTouchIcon,
} from "../../helpers/apple-touch-icon";

describe("apple-touch-icon helpers", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  describe("hasAppleTouchIcon", () => {
    it("returns false when the document has no apple-touch-icon", () => {
      expect(hasAppleTouchIcon(document)).toBe(false);
    });

    it("returns true when the document has an apple-touch-icon", () => {
      document.head.innerHTML =
        '<link rel="apple-touch-icon" href="/host-provided-icon.png">';

      expect(hasAppleTouchIcon(document)).toBe(true);
    });
  });

  describe("hasSameOriginSelfOrAncestorAppleTouchIcon", () => {
    it("returns false when neither the current document nor ancestors have an apple-touch-icon", () => {
      expect(
        hasSameOriginSelfOrAncestorAppleTouchIcon({
          doc: document,
          win: window,
        }),
      ).toBe(false);
    });

    it("returns true when the current document has an apple-touch-icon", () => {
      document.head.innerHTML =
        '<link rel="apple-touch-icon" href="/host-provided-icon.png">';

      expect(
        hasSameOriginSelfOrAncestorAppleTouchIcon({
          doc: document,
          win: window,
        }),
      ).toBe(true);
    });

    it("returns false when same-origin ancestors have no apple-touch-icon", () => {
      const iframe = document.createElement("iframe");
      document.body.appendChild(iframe);

      expect(iframe.contentWindow).not.toBeNull();
      expect(
        hasSameOriginSelfOrAncestorAppleTouchIcon({
          doc: iframe.contentDocument!,
          win: iframe.contentWindow!,
        }),
      ).toBe(false);
    });

    it("returns true when a same-origin ancestor has an apple-touch-icon", () => {
      document.head.innerHTML =
        '<link rel="apple-touch-icon" href="/host-provided-icon.png">';

      const iframe = document.createElement("iframe");
      document.body.appendChild(iframe);

      expect(iframe.contentWindow).not.toBeNull();
      expect(
        hasSameOriginSelfOrAncestorAppleTouchIcon({
          doc: iframe.contentDocument!,
          win: iframe.contentWindow!,
        }),
      ).toBe(true);
    });

    it("ignores the managed link in the current document", () => {
      document.head.innerHTML =
        '<link rel="apple-touch-icon" href="/managed-icon.png" data-rc-apple-touch-icon="true">';

      const managedLink = document.head.querySelector<HTMLLinkElement>(
        'link[data-rc-apple-touch-icon="true"]',
      );

      expect(
        hasSameOriginSelfOrAncestorAppleTouchIcon({
          doc: document,
          win: window,
          ignoredLink: managedLink,
        }),
      ).toBe(false);
    });
  });

  describe("syncManagedAppleTouchIcon", () => {
    it("injects an apple-touch-icon when none exists", () => {
      syncManagedAppleTouchIcon({
        doc: document,
        win: window,
        href: "/branding-icon.png",
      });

      const link = document.head.querySelector<HTMLLinkElement>(
        'link[rel="apple-touch-icon"]',
      );

      expect(link?.getAttribute("href")).toBe("/branding-icon.png");
      expect(link?.getAttribute("data-rc-apple-touch-icon")).toBe("true");
    });

    it("does not overwrite a host-provided apple-touch-icon", () => {
      document.head.innerHTML =
        '<link rel="apple-touch-icon" href="/host-provided-icon.png">';

      syncManagedAppleTouchIcon({
        doc: document,
        win: window,
        href: "/branding-icon.png",
      });

      const links = document.head.querySelectorAll(
        'link[rel="apple-touch-icon"]',
      );
      expect(links).toHaveLength(1);
      expect(links[0]?.getAttribute("href")).toBe("/host-provided-icon.png");
    });

    it("removes the managed icon when href is missing", () => {
      syncManagedAppleTouchIcon({
        doc: document,
        win: window,
        href: "/branding-icon.png",
      });

      syncManagedAppleTouchIcon({
        doc: document,
        win: window,
        href: null,
      });

      expect(
        document.head.querySelector('link[rel="apple-touch-icon"]'),
      ).toBeNull();
    });

    it("backs off when a same-origin ancestor has an apple-touch-icon", () => {
      document.head.innerHTML =
        '<link rel="apple-touch-icon" href="/host-provided-icon.png">';

      const iframe = document.createElement("iframe");
      document.body.appendChild(iframe);

      expect(iframe.contentWindow).not.toBeNull();
      expect(iframe.contentDocument).not.toBeNull();

      syncManagedAppleTouchIcon({
        doc: iframe.contentDocument!,
        win: iframe.contentWindow!,
        href: "/branding-icon.png",
      });

      expect(
        iframe.contentDocument?.head.querySelector(
          'link[rel="apple-touch-icon"]',
        ),
      ).toBeNull();
    });
  });

  describe("removeManagedAppleTouchIcon", () => {
    it("removes only the managed apple-touch-icon", () => {
      document.head.innerHTML = [
        '<link rel="apple-touch-icon" href="/host-provided-icon.png">',
        '<link rel="apple-touch-icon" href="/managed-icon.png" data-rc-apple-touch-icon="true">',
      ].join("");

      removeManagedAppleTouchIcon(document);

      const links = document.head.querySelectorAll(
        'link[rel="apple-touch-icon"]',
      );
      expect(links).toHaveLength(1);
      expect(links[0]?.getAttribute("href")).toBe("/host-provided-icon.png");
    });
  });
});
