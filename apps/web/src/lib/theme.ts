import themeJson from "../../public/theme/theme.json" with { type: "json" };

export type AppTheme = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  legalName: string;
  themeColor: string;
  logoIncludesWordmark: boolean;
  assets: {
    favicon: string;
    logo: string;
    logoMark: string;
    banner: string;
    backdrop: string;
    emptyList: string;
  };
};

export const theme: AppTheme = themeJson;
