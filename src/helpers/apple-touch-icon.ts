const APPLE_TOUCH_ICON_SELECTOR = 'link[rel~="apple-touch-icon"]';
const MANAGED_APPLE_TOUCH_ICON_ATTRIBUTE_NAME = "data-rc-apple-touch-icon";
const MANAGED_APPLE_TOUCH_ICON_ATTRIBUTE_VALUE = "true";
const MANAGED_APPLE_TOUCH_ICON_SELECTOR = `link[${MANAGED_APPLE_TOUCH_ICON_ATTRIBUTE_NAME}="${MANAGED_APPLE_TOUCH_ICON_ATTRIBUTE_VALUE}"]`;

export const hasAppleTouchIcon = (doc: Document): boolean =>
  !!doc.head.querySelector(APPLE_TOUCH_ICON_SELECTOR);

export const hasSameOriginSelfOrAncestorAppleTouchIcon = ({
  doc,
  win,
  ignoredLink,
}: {
  doc: Document;
  win?: Window;
  ignoredLink?: HTMLLinkElement | null;
}): boolean => {
  const existingLink = doc.head.querySelector<HTMLLinkElement>(
    APPLE_TOUCH_ICON_SELECTOR,
  );

  if (existingLink && existingLink !== ignoredLink) {
    return true;
  }

  if (!win) {
    return false;
  }

  let currentWindow: Window = win;

  while (currentWindow.parent !== currentWindow) {
    const parentWindow = currentWindow.parent;

    try {
      if (hasAppleTouchIcon(parentWindow.document)) {
        return true;
      }
    } catch {
      return false;
    }

    currentWindow = parentWindow;
  }

  return false;
};

export const removeManagedAppleTouchIcon = (doc: Document): void => {
  doc.head
    .querySelector<HTMLLinkElement>(MANAGED_APPLE_TOUCH_ICON_SELECTOR)
    ?.remove();
};

export const syncManagedAppleTouchIcon = ({
  doc,
  win,
  href,
}: {
  doc: Document;
  win?: Window;
  href?: string | null;
}): void => {
  const managedLink = doc.head.querySelector<HTMLLinkElement>(
    MANAGED_APPLE_TOUCH_ICON_SELECTOR,
  );

  if (!href) {
    managedLink?.remove();
    return;
  }

  if (
    hasSameOriginSelfOrAncestorAppleTouchIcon({
      doc,
      win,
      ignoredLink: managedLink,
    })
  ) {
    managedLink?.remove();
    return;
  }

  const iconLink = managedLink ?? doc.createElement("link");
  iconLink.rel = "apple-touch-icon";
  iconLink.href = href;
  iconLink.setAttribute(
    MANAGED_APPLE_TOUCH_ICON_ATTRIBUTE_NAME,
    MANAGED_APPLE_TOUCH_ICON_ATTRIBUTE_VALUE,
  );

  if (!managedLink) {
    doc.head.appendChild(iconLink);
  }
};
