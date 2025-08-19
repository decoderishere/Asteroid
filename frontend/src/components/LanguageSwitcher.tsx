'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useTranslation } from '@/contexts/LanguageContext'
import clsx from 'clsx'

const languages = [
  { code: 'es' as const, name: 'Español', short: 'ES' },
  { code: 'en' as const, name: 'English', short: 'EN' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <span className="mr-1">{currentLanguage.short}</span>
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
          <div className="py-1">
            {languages.map((lang) => (
              <Menu.Item key={lang.code}>
                {({ active }) => (
                  <button
                    onClick={() => setLanguage(lang.code)}
                    className={clsx(
                      'group flex items-center px-4 py-2 text-sm w-full text-left',
                      active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300',
                      language === lang.code ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : ''
                    )}
                  >
                    <span className="mr-3 font-medium">{lang.short}</span>
                    <span>{lang.name}</span>
                    {language === lang.code && (
                      <span className="ml-auto text-primary-500">✓</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}