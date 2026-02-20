import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLang(e.target.value)}
    >
      <option value="en">English</option>
      <option value="te">తెలుగు</option>
    </select>
  );
}

export default LanguageSwitcher;
