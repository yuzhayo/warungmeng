import type { ThemeConfig } from "antd";

export const storefrontTheme: ThemeConfig = {
  token: {
    // Warm amber/gold accent for Warung Meng
    colorPrimary: "#d4af37", // Gold color
    colorInfo: "#d4af37", // Use gold for info states too

    // Light warm background
    colorBgLayout: "#fffaf0", // Very light cream
    colorBgContainer: "#ffffff", // White containers on cream background

    // Text colors
    colorText: "#333333", // Dark gray for readability
    colorTextSecondary: "#666666", // Secondary text

    // Spacing and sizing
    borderRadius: 6, // Slightly rounded corners
  },
  components: {
    Layout: {
      colorBgHeader: "#ffffff",
      colorBgBody: "#fffaf0",
    },
    Card: {
      borderRadiusLG: 8,
    },
    Button: {
      controlHeight: 44, // Ensure minimum 44px for touch targets
      controlHeightSM: 36,
      controlHeightLG: 52,
    },
  },
};
