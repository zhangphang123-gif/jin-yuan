import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface SocialFollowLinksProps {
  darkSurface?: boolean;
  className?: string;
}

const SOCIAL_CHANNELS = [
  {
    id: 'facebook',
    href: 'https://www.facebook.com/profile.php?id=61596513451447&sk=directory_links',
    titleZh: '錦源 Facebook 官方專頁',
    titleEn: 'Jin Yuan Official Facebook Page',
    bgClass: 'bg-[#1877F2]',
    svgClass: 'w-5 h-5 fill-white',
    path: 'M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z',
  },
  {
    id: 'instagram',
    href: 'https://www.instagram.com/jinyuanheng88/',
    titleZh: '錦源 Instagram (@jinyuanheng88)',
    titleEn: 'Jin Yuan Instagram (@jinyuanheng88)',
    bgClass:
      'bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]',
    svgClass: 'w-5 h-5 fill-white',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    id: 'youtube',
    href: 'https://youtube.com/channel/UCfiiHXRMFPYOcSaCu5vDjdw?si=wGggaf2tJyNlclWG',
    titleZh: '錦源 YouTube 官方頻道',
    titleEn: 'Jin Yuan YouTube Channel',
    bgClass: 'bg-[#FF0000]',
    svgClass: 'w-[21px] h-[21px] fill-white',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
] as const;

export const SocialFollowLinks: React.FC<SocialFollowLinksProps> = ({
  darkSurface = false,
  className = '',
}) => {
  const { t } = useLanguage();

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <p
        className={`text-[13px] font-bold tracking-wider mb-3 ${
          darkSurface ? 'text-[#e7b977]' : 'text-amber-800 dark:text-[#e7b977]'
        }`}
      >
        {t(
          '關注錦源官方頻道 · 獲取最新年貨與優惠動態：',
          'Follow Jin Yuan Official Channels · Latest Festive Deals & Updates:'
        )}
      </p>
      <div className="flex items-center justify-center gap-3.5">
        {SOCIAL_CHANNELS.map((channel) => {
          const label = t(channel.titleZh, channel.titleEn);
          return (
            <a
              key={channel.id}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              aria-label={label}
              className={`w-11 h-11 rounded-full ${channel.bgClass} flex items-center justify-center border-[1.5px] border-[#e7b977] shadow-md transition-transform duration-200 hover:-translate-y-1 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className={channel.svgClass}>
                <path d={channel.path} />
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
};
