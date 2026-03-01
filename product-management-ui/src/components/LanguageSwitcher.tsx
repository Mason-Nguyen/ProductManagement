import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'vi' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button className="language-switcher" onClick={toggleLanguage} title="Change Language">
            <span className="language-icon">🌐</span>
            <span className="language-code">{i18n.language.toUpperCase()}</span>
        </button>
    );
};

export default LanguageSwitcher;
