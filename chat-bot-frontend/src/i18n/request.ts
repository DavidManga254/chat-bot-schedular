import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const NAMESPACES = {
  chat: "chat",
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const imports = await Promise.all(
    Object.keys(NAMESPACES).map(async (ns) => {
      const msgs = (await import(`../../messages/${locale}/${ns}.json`))
        .default;
      return { [ns]: msgs };
    })
  );

  const messages = Object.assign({}, ...imports);

  return {
    locale,
    messages,
  };
});
