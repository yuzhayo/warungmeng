import { theme } from "antd";
import type { ThemeConfig } from "antd";

export const adminTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#d99a27",
    colorInfo: "#d99a27",
    colorBgBase: "#181a1b",
    colorTextBase: "#f0ede7",
    borderRadius: 4,
    fontSize: 14,
  },
  components: {
    Layout: {
      bodyBg: "#181a1b",
      headerBg: "#d99a27",
      headerColor: "#181a1b",
      headerHeight: 64,
      siderBg: "#1b1d1e",
    },
    Menu: {
      darkItemBg: "#1b1d1e",
      darkItemColor: "#f0ede7",
      darkItemHoverBg: "#292b2d",
      darkItemHoverColor: "#f0ede7",
      darkItemSelectedBg: "#3d2b08",
      darkItemSelectedColor: "#f6c453",
      itemBorderRadius: 0,
      itemMarginInline: 0,
    },
  },
};
