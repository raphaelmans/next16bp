import { describe, expect, it } from "vitest";
import {
  deriveWebPushState,
  getNotificationBellBadgeCount,
  getNotificationBellIconVariant,
  getNotificationBellPermissionLabel,
  getNotificationBellToggleDisabled,
  getWebPushSettingsStatusLabel,
  isWebPushDisableActionDisabled,
  isWebPushEnableActionDisabled,
} from "@/features/notifications/domain";

describe("notifications domain", () => {
  describe("deriveWebPushState", () => {
    it("unsupported browser -> returns unsupported diagnostics", () => {
      // Arrange
      const input = {
        supported: false,
        isSecureContext: true,
        configured: true,
        permission: "default" as const,
        hasSubscription: false,
        busy: false,
      };

      // Act
      const result = deriveWebPushState(input);

      // Assert
      expect(result.diagnosticsCode).toBe("unsupported");
      expect(result.diagnosticsMessage).toBe(
        "Your browser does not support push notifications.",
      );
    });

    it("granted + subscribed -> returns enabled diagnostics", () => {
      // Arrange
      const input = {
        supported: true,
        isSecureContext: true,
        configured: true,
        permission: "granted" as const,
        hasSubscription: true,
        busy: false,
      };

      // Act
      const result = deriveWebPushState(input);

      // Assert
      expect(result.enabledOnThisDevice).toBe(true);
      expect(result.diagnosticsCode).toBe("enabled");
      expect(result.canSendLocalTest).toBe(true);
      expect(result.canSendServerTest).toBe(true);
    });

    it("granted without subscription -> returns granted_not_registered", () => {
      // Arrange
      const input = {
        supported: true,
        isSecureContext: true,
        configured: true,
        permission: "granted" as const,
        hasSubscription: false,
        busy: false,
      };

      // Act
      const result = deriveWebPushState(input);

      // Assert
      expect(result.enabledOnThisDevice).toBe(false);
      expect(result.diagnosticsCode).toBe("granted_not_registered");
      expect(result.canSendLocalTest).toBe(true);
      expect(result.canSendServerTest).toBe(false);
    });
  });

  describe("bell/view-model helpers", () => {
    it("bell toggle disabled when permission denied", () => {
      // Arrange
      const input = {
        busy: false,
        supported: true,
        isSecureContext: true,
        configured: true,
        permission: "denied" as const,
      };

      // Act
      const result = getNotificationBellToggleDisabled(input);

      // Assert
      expect(result).toBe(true);
    });

    it("bell permission label for enabled device", () => {
      // Arrange
      const input = {
        permission: "granted" as const,
        enabledOnThisDevice: true,
      };

      // Act
      const result = getNotificationBellPermissionLabel(input);

      // Assert
      expect(result).toBe("Enabled on this device");
    });
  });

  describe("getNotificationBellIconVariant", () => {
    it("enabled -> bell-ring", () => {
      const result = getNotificationBellIconVariant({
        enabledOnThisDevice: true,
      });
      expect(result).toBe("bell-ring");
    });

    it("not enabled -> bell-off", () => {
      const result = getNotificationBellIconVariant({
        enabledOnThisDevice: false,
      });
      expect(result).toBe("bell-off");
    });
  });

  describe("getNotificationBellBadgeCount", () => {
    it("zero unread -> null badge", () => {
      expect(getNotificationBellBadgeCount(0)).toBeNull();
    });

    it("normal unread -> string count", () => {
      expect(getNotificationBellBadgeCount(7)).toBe("7");
    });

    it("large unread -> capped badge", () => {
      expect(getNotificationBellBadgeCount(120)).toBe("99+");
    });
  });

  describe("settings action helpers", () => {
    it("status label returns not configured when server not configured", () => {
      // Arrange
      const input = {
        supported: true,
        configured: false,
        enabledOnThisDevice: false,
        permission: "default" as const,
      };

      // Act
      const result = getWebPushSettingsStatusLabel(input);

      // Assert
      expect(result).toBe("Not configured");
    });

    it("enable action disabled when already enabled", () => {
      // Arrange
      const input = {
        busy: false,
        supported: true,
        configured: true,
        enabledOnThisDevice: true,
      };

      // Act
      const result = isWebPushEnableActionDisabled(input);

      // Assert
      expect(result).toBe(true);
    });

    it("disable action enabled when device subscription is active", () => {
      // Arrange
      const input = {
        busy: false,
        supported: true,
        enabledOnThisDevice: true,
      };

      // Act
      const result = isWebPushDisableActionDisabled(input);

      // Assert
      expect(result).toBe(false);
    });
  });
});
