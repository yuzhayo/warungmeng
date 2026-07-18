import type { TranslationKey } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";

export interface AdminPlaceholderScreenProps {
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
}

export function AdminPlaceholderScreen({ titleKey, descriptionKey }: AdminPlaceholderScreenProps) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="placeholder-screen-title">
      <h1 id="placeholder-screen-title">{t(titleKey)}</h1>
      <p>{t(descriptionKey)}</p>
    </section>
  );
}
