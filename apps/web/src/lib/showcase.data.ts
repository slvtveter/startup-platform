/**
 * Витрина главной: придуманные стартапы и люди, не связанные с базой (не меняются от новых регистраций).
 * Сгенерировано app/scripts/showcase_export.py из demo_data.py, фото — Pexels (бесплатная лицензия) в public/showcase.
 * Выбор карточек и ссылки — в showcase.ts (этот файл перезаписывается генератором).
 */
import type { PersonCard, StartupCard } from "@/lib/api";

export const STARTUPS: StartupCard[] = [
  {
    "id": "8dca13e2-e2e9-44e6-bd74-a95b2d21685e",
    "slug": "flowly",
    "title": "Flowly",
    "pitch": "Онлайн-запись и напоминания для салонов красоты",
    "stage": "mvp",
    "terms": "paid",
    "status": "recruiting",
    "published_at": "2026-10-30T14:05:21.163681Z",
    "owner_name": "Мария Лебедева",
    "owner_avatar_url": "/showcase/maria-lebedeva.webp",
    "open_roles": [
      {
        "id": "0273b96d-087c-44d9-b3c0-b54171a3e07a",
        "title": "Frontend-разработчик",
        "role": {
          "slug": "frontend",
          "name": "Frontend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 15
      },
      {
        "id": "b19d1e2b-6fee-49f7-9ae7-f83a92ed4f46",
        "title": "Продуктовый дизайнер",
        "role": {
          "slug": "designer",
          "name": "Дизайнер"
        },
        "slots": 1,
        "hours_per_week": 10
      }
    ],
    "team_size": 2,
    "is_demo": false,
    "cover_url": "/showcase/c-flowly.webp",
    "cover_url_lg": "/showcase/c-flowly.webp"
  },
  {
    "id": "30b92ef7-c119-4ea4-8b34-3e31253c909d",
    "slug": "studymate",
    "title": "StudyMate",
    "pitch": "Тесты и карточки к экзамену из твоих конспектов",
    "stage": "prototype",
    "terms": "negotiable",
    "status": "recruiting",
    "published_at": "2026-10-28T09:05:21.163681Z",
    "owner_name": "Артём Ким",
    "owner_avatar_url": "/showcase/artem-kim.webp",
    "open_roles": [
      {
        "id": "68799280-d171-4757-a00c-dfe07250435c",
        "title": "ML-инженер",
        "role": {
          "slug": "ml",
          "name": "ML-инженер"
        },
        "slots": 1,
        "hours_per_week": 10
      },
      {
        "id": "d917ce86-952e-4ab3-bea8-7328da8fc1e2",
        "title": "Маркетолог",
        "role": {
          "slug": "marketer",
          "name": "Маркетолог"
        },
        "slots": 1,
        "hours_per_week": 8
      }
    ],
    "team_size": 2,
    "is_demo": false,
    "cover_url": "/showcase/c-studymate.webp",
    "cover_url_lg": "/showcase/c-studymate.webp"
  },
  {
    "id": "68951fa4-0f93-4516-910a-4f9e7cbf4ad7",
    "slug": "kvartal",
    "title": "Квартал",
    "pitch": "Приложение для жильцов: заявки в УК, голосования, объявления",
    "stage": "prototype",
    "terms": "free",
    "status": "recruiting",
    "published_at": "2026-10-26T04:05:21.163681Z",
    "owner_name": "Тимур Галиев",
    "owner_avatar_url": "/showcase/timur-galiev.webp",
    "open_roles": [
      {
        "id": "dcaf85b8-1a04-4e50-bad7-e57ec9fb510a",
        "title": "Backend-разработчик",
        "role": {
          "slug": "backend",
          "name": "Backend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 10
      },
      {
        "id": "ba019680-c2dd-4948-83f3-4d082fbb3fec",
        "title": "UX-исследователь",
        "role": {
          "slug": "designer",
          "name": "Дизайнер"
        },
        "slots": 1,
        "hours_per_week": 6
      }
    ],
    "team_size": 2,
    "is_demo": false,
    "cover_url": "/showcase/c-kvartal.webp",
    "cover_url_lg": "/showcase/c-kvartal.webp"
  },
  {
    "id": "2b502ebb-c572-4100-a3e3-6a56f5099db6",
    "slug": "fermo",
    "title": "Fermo",
    "pitch": "Фермерские продукты по подписке из Подмосковья",
    "stage": "launched",
    "terms": "paid",
    "status": "recruiting",
    "published_at": "2026-10-21T18:05:21.163681Z",
    "owner_name": "Олег Ван",
    "owner_avatar_url": "/showcase/oleg-van.webp",
    "open_roles": [
      {
        "id": "d3c77bd5-f99a-4dce-95e5-b19671dd086e",
        "title": "Аналитик данных",
        "role": {
          "slug": "analyst",
          "name": "Аналитик данных"
        },
        "slots": 1,
        "hours_per_week": 15
      },
      {
        "id": "f2527dcd-dcab-4104-b89d-f0a1bcd3257c",
        "title": "Копирайтер",
        "role": {
          "slug": "copywriter",
          "name": "Копирайтер"
        },
        "slots": 1,
        "hours_per_week": 8
      }
    ],
    "team_size": 3,
    "is_demo": false,
    "cover_url": "/showcase/c-fermo.webp",
    "cover_url_lg": "/showcase/c-fermo.webp"
  },
  {
    "id": "c1eeedd3-1914-429e-8e3f-5e4e76f58e5a",
    "slug": "tripsy",
    "title": "Tripsy",
    "pitch": "Планировщик поездок для компании друзей: маршрут и общий бюджет",
    "stage": "mvp",
    "terms": "negotiable",
    "status": "recruiting",
    "published_at": "2026-10-19T13:05:21.163681Z",
    "owner_name": "Даниэль Аду",
    "owner_avatar_url": "/showcase/daniel-adu.webp",
    "open_roles": [
      {
        "id": "d22a48af-ec9b-406a-a146-acd95fbfbe03",
        "title": "Frontend-разработчик",
        "role": {
          "slug": "frontend",
          "name": "Frontend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 12
      },
      {
        "id": "9207c642-3918-4cd0-b217-9cc485918249",
        "title": "Маркетолог",
        "role": {
          "slug": "marketer",
          "name": "Маркетолог"
        },
        "slots": 1,
        "hours_per_week": 8
      }
    ],
    "team_size": 2,
    "is_demo": false,
    "cover_url": "/showcase/c-tripsy.webp",
    "cover_url_lg": "/showcase/c-tripsy.webp"
  },
  {
    "id": "2a856380-7f1d-40e7-8e76-117794dcf0d5",
    "slug": "krugooborot",
    "title": "Кругооборот",
    "pitch": "Залоговые многоразовые стаканы для кофеен",
    "stage": "mvp",
    "terms": "paid",
    "status": "recruiting",
    "published_at": "2026-10-10T17:05:21.163681Z",
    "owner_name": "Ксения Орлова",
    "owner_avatar_url": "/showcase/ksenia-orlova.webp",
    "open_roles": [
      {
        "id": "37fcb7e3-0f90-4069-a817-a9da669f35d0",
        "title": "Mobile-разработчик",
        "role": {
          "slug": "mobile",
          "name": "Mobile-разработчик"
        },
        "slots": 1,
        "hours_per_week": 15
      },
      {
        "id": "dcbb872d-7537-4fb2-9ab3-f7934372c561",
        "title": "Аналитик данных",
        "role": {
          "slug": "analyst",
          "name": "Аналитик данных"
        },
        "slots": 1,
        "hours_per_week": 8
      }
    ],
    "team_size": 1,
    "is_demo": false,
    "cover_url": "/showcase/c-krugooborot.webp",
    "cover_url_lg": "/showcase/c-krugooborot.webp"
  }
];

export const IDEAS: StartupCard[] = [
  {
    "id": "c96a9fe2-9cc0-4697-a589-9b44fdd8254c",
    "slug": "petly",
    "title": "Petly",
    "pitch": "Соседи и студенты выгуливают собак друг друга",
    "stage": "idea",
    "terms": "free",
    "status": "recruiting",
    "published_at": "2026-10-23T23:05:21.163681Z",
    "owner_name": "Анна Смирнова",
    "owner_avatar_url": "/showcase/anna-smirnova.webp",
    "open_roles": [
      {
        "id": "808c5050-bea2-4445-a2d4-bbb44dd90ec5",
        "title": "Mobile-разработчик",
        "role": {
          "slug": "mobile",
          "name": "Mobile-разработчик"
        },
        "slots": 1,
        "hours_per_week": 10
      },
      {
        "id": "b8b331cb-e7e6-4a88-b109-6d2a22943a4b",
        "title": "Маркетолог",
        "role": {
          "slug": "marketer",
          "name": "Маркетолог"
        },
        "slots": 1,
        "hours_per_week": 6
      }
    ],
    "team_size": 1,
    "is_demo": false,
    "cover_url": "/showcase/c-petly.webp",
    "cover_url_lg": "/showcase/c-petly.webp"
  },
  {
    "id": "5f3d9089-6bc1-4891-b8e9-6114839e01ac",
    "slug": "roomly",
    "title": "Roomly",
    "pitch": "Подбор соседа по квартире среди студентов своего вуза",
    "stage": "idea",
    "terms": "free",
    "status": "recruiting",
    "published_at": "2026-10-17T08:05:21.163681Z",
    "owner_name": "Ева Лунина",
    "owner_avatar_url": "/showcase/eva-lunina.webp",
    "open_roles": [
      {
        "id": "5fb94642-973c-41da-b801-8f1789787c20",
        "title": "Frontend-разработчик",
        "role": {
          "slug": "frontend",
          "name": "Frontend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 10
      },
      {
        "id": "e7f36fd4-2bb7-4357-a183-a806c2e7b609",
        "title": "Backend-разработчик",
        "role": {
          "slug": "backend",
          "name": "Backend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 10
      }
    ],
    "team_size": 1,
    "is_demo": false,
    "cover_url": "/showcase/c-roomly.webp",
    "cover_url_lg": "/showcase/c-roomly.webp"
  },
  {
    "id": "c74aed80-13f5-490d-820f-ca9b3152101b",
    "slug": "caselab",
    "title": "CaseLab",
    "pitch": "Учебные кейсы от реальных компаний для студентов",
    "stage": "idea",
    "terms": "negotiable",
    "status": "recruiting",
    "published_at": "2026-10-15T03:05:21.163681Z",
    "owner_name": "Марк Адебайо",
    "owner_avatar_url": "/showcase/mark-adebayo.webp",
    "open_roles": [
      {
        "id": "d788fef8-eed5-4563-8360-2bc246b34f3b",
        "title": "Backend-разработчик",
        "role": {
          "slug": "backend",
          "name": "Backend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 10
      },
      {
        "id": "ad5c9d95-d2c8-476e-be43-2e1375407cf3",
        "title": "Дизайнер",
        "role": {
          "slug": "designer",
          "name": "Дизайнер"
        },
        "slots": 1,
        "hours_per_week": 8
      },
      {
        "id": "b76e34c9-a1d0-49d9-b0e1-e3e706c375d5",
        "title": "Менеджер по партнёрствам",
        "role": {
          "slug": "marketer",
          "name": "Маркетолог"
        },
        "slots": 1,
        "hours_per_week": 6
      }
    ],
    "team_size": 1,
    "is_demo": false,
    "cover_url": "/showcase/c-caselab.webp",
    "cover_url_lg": "/showcase/c-caselab.webp"
  },
  {
    "id": "77650ca4-9ca4-4ff4-a19c-0e9263879556",
    "slug": "rezyume-za-vecher",
    "title": "Резюме за вечер",
    "pitch": "Мидлы разбирают резюме джунов за 300 ₽",
    "stage": "idea",
    "terms": "free",
    "status": "recruiting",
    "published_at": "2026-10-12T22:05:21.163681Z",
    "owner_name": "Сабина Юсупова",
    "owner_avatar_url": "/showcase/sabina-yusupova.webp",
    "open_roles": [
      {
        "id": "03fb2214-2ff5-4916-9831-fe298629923c",
        "title": "Frontend-разработчик",
        "role": {
          "slug": "frontend",
          "name": "Frontend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 8
      },
      {
        "id": "f2652384-b525-479e-a972-f0644618fe0d",
        "title": "Backend-разработчик",
        "role": {
          "slug": "backend",
          "name": "Backend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 8
      }
    ],
    "team_size": 1,
    "is_demo": false,
    "cover_url": "/showcase/c-rezyume.webp",
    "cover_url_lg": "/showcase/c-rezyume.webp"
  }
];

export const PEOPLE: PersonCard[] = [
  {
    "slug": "rinat-hayrullin",
    "display_name": "Ринат Хайруллин",
    "headline": "iOS-разработчик на Swift",
    "primary_role": {
      "slug": "mobile",
      "name": "Mobile-разработчик"
    },
    "experience_level": "courses",
    "availability": "part_time",
    "looking_for": [
      "free",
      "paid"
    ],
    "city": "Уфа",
    "skills": [
      {
        "slug": "swift",
        "name": "Swift",
        "category": "dev"
      },
      {
        "slug": "git",
        "name": "Git",
        "category": "dev"
      },
      {
        "slug": "rest",
        "name": "REST",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/rinat-khayrullin.webp",
    "avatar_url_lg": "/showcase/rinat-khayrullin.webp",
    "is_demo": false
  },
  {
    "slug": "zhanna-kamara",
    "display_name": "Жанна Камара",
    "headline": "Аналитик данных, SQL и Power BI",
    "primary_role": {
      "slug": "analyst",
      "name": "Аналитик данных"
    },
    "experience_level": "internship",
    "availability": "part_time",
    "looking_for": [
      "free",
      "paid"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "sql",
        "name": "SQL",
        "category": "data"
      },
      {
        "slug": "powerbi",
        "name": "Power BI",
        "category": "data"
      },
      {
        "slug": "pandas",
        "name": "pandas",
        "category": "data"
      },
      {
        "slug": "excel",
        "name": "Excel",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/zhanna-kamara.webp",
    "avatar_url_lg": "/showcase/zhanna-kamara.webp",
    "is_demo": false
  },
  {
    "slug": "ardzhun-mehta",
    "display_name": "Арджун Мехта",
    "headline": "ML в рекомендациях, магистратура Сколтеха",
    "primary_role": {
      "slug": "ml",
      "name": "ML-инженер"
    },
    "experience_level": "internship",
    "availability": "few_hours",
    "looking_for": [
      "negotiable"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "python",
        "name": "Python",
        "category": "dev"
      },
      {
        "slug": "pytorch",
        "name": "PyTorch",
        "category": "data"
      },
      {
        "slug": "pandas",
        "name": "pandas",
        "category": "data"
      },
      {
        "slug": "statistika",
        "name": "Статистика",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/arjun-mehta.webp",
    "avatar_url_lg": "/showcase/arjun-mehta.webp",
    "is_demo": false
  },
  {
    "slug": "tigran-arutyunyan",
    "display_name": "Тигран Арутюнян",
    "headline": "Продакт без идеи, но с желанием. Ищу сообщников",
    "primary_role": {
      "slug": "product",
      "name": "Продакт-менеджер"
    },
    "experience_level": "internship",
    "availability": "full_time",
    "looking_for": [
      "free",
      "cofound"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "customerdevelopment",
        "name": "Customer Development",
        "category": "marketing"
      },
      {
        "slug": "unitekonomika",
        "name": "Unit экономика",
        "category": "product"
      },
      {
        "slug": "jira",
        "name": "Jira",
        "category": "product"
      },
      {
        "slug": "sql",
        "name": "SQL",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/tigran-arutyunyan.webp",
    "avatar_url_lg": "/showcase/tigran-arutyunyan.webp",
    "is_demo": false
  },
  {
    "slug": "polina-mironova",
    "display_name": "Полина Миронова",
    "headline": "SMM и контент, веду соцсети Fermo",
    "primary_role": {
      "slug": "smm",
      "name": "SMM-специалист"
    },
    "experience_level": "junior",
    "availability": "part_time",
    "looking_for": [
      "paid"
    ],
    "city": "Сочи",
    "skills": [
      {
        "slug": "smm",
        "name": "SMM",
        "category": "marketing"
      },
      {
        "slug": "targetvk",
        "name": "Таргет VK",
        "category": "marketing"
      },
      {
        "slug": "kontentmarketing",
        "name": "Контент маркетинг",
        "category": "marketing"
      },
      {
        "slug": "kopirayting",
        "name": "Копирайтинг",
        "category": "marketing"
      }
    ],
    "avatar_url": "/showcase/polina-mironova.webp",
    "avatar_url_lg": "/showcase/polina-mironova.webp",
    "is_demo": false
  },
  {
    "slug": "yuna-pak",
    "display_name": "Юна Пак",
    "headline": "Дизайнер интерфейсов, хочу сделать свой стартап",
    "primary_role": {
      "slug": "designer",
      "name": "Дизайнер"
    },
    "experience_level": "courses",
    "availability": "part_time",
    "looking_for": [
      "free",
      "cofound"
    ],
    "city": "Владивосток",
    "skills": [
      {
        "slug": "figma",
        "name": "Figma",
        "category": "design"
      },
      {
        "slug": "illyustratsiya",
        "name": "Иллюстрация",
        "category": "design"
      },
      {
        "slug": "mobilnyeinterfeysy",
        "name": "Мобильные интерфейсы",
        "category": "design"
      },
      {
        "slug": "motion",
        "name": "Motion",
        "category": "design"
      }
    ],
    "avatar_url": "/showcase/yuna-pak.webp",
    "avatar_url_lg": "/showcase/yuna-pak.webp",
    "is_demo": false
  },
  {
    "slug": "darya-kovalchuk",
    "display_name": "Дарья Ковальчук",
    "headline": "Аналитик в Fermo: считаю подписки и отток",
    "primary_role": {
      "slug": "analyst",
      "name": "Аналитик данных"
    },
    "experience_level": "junior",
    "availability": "part_time",
    "looking_for": [
      "paid"
    ],
    "city": "Воронеж",
    "skills": [
      {
        "slug": "sql",
        "name": "SQL",
        "category": "data"
      },
      {
        "slug": "pandas",
        "name": "pandas",
        "category": "data"
      },
      {
        "slug": "a-btesty",
        "name": "A/B тесты",
        "category": "data"
      },
      {
        "slug": "excel",
        "name": "Excel",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/darya-kovalchuk.webp",
    "avatar_url_lg": "/showcase/darya-kovalchuk.webp",
    "is_demo": false
  },
  {
    "slug": "kristina-belaya",
    "display_name": "Кристина Белая",
    "headline": "Продакт-менеджер после стажировки в EdTech",
    "primary_role": {
      "slug": "product",
      "name": "Продакт-менеджер"
    },
    "experience_level": "internship",
    "availability": "part_time",
    "looking_for": [
      "free",
      "negotiable"
    ],
    "city": "Санкт-Петербург",
    "skills": [
      {
        "slug": "roadmap",
        "name": "Roadmap",
        "category": "product"
      },
      {
        "slug": "intervyuspolzovatelyami",
        "name": "Интервью с пользователями",
        "category": "product"
      },
      {
        "slug": "jira",
        "name": "Jira",
        "category": "product"
      },
      {
        "slug": "a-btesty",
        "name": "A/B тесты",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/kristina-belaya.webp",
    "avatar_url_lg": "/showcase/kristina-belaya.webp",
    "is_demo": false
  },
  {
    "slug": "madina-abdullaeva",
    "display_name": "Мадина Абдуллаева",
    "headline": "Маркетолог, ищу команду, чтобы запустить что-то своё",
    "primary_role": {
      "slug": "marketer",
      "name": "Маркетолог"
    },
    "experience_level": "junior",
    "availability": "part_time",
    "looking_for": [
      "negotiable",
      "cofound"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "targetvk",
        "name": "Таргет VK",
        "category": "marketing"
      },
      {
        "slug": "seo",
        "name": "SEO",
        "category": "marketing"
      },
      {
        "slug": "emailmarketing",
        "name": "Email маркетинг",
        "category": "marketing"
      },
      {
        "slug": "analitikatrafika",
        "name": "Аналитика трафика",
        "category": "marketing"
      }
    ],
    "avatar_url": "/showcase/madina-abdullaeva.webp",
    "avatar_url_lg": "/showcase/madina-abdullaeva.webp",
    "is_demo": false
  },
  {
    "slug": "sonya-pavlova-7445",
    "display_name": "Соня Павлова",
    "headline": "Копирайтер: тексты для интерфейсов и рассылок",
    "primary_role": {
      "slug": "copywriter",
      "name": "Копирайтер"
    },
    "experience_level": "courses",
    "availability": "few_hours",
    "looking_for": [
      "free",
      "paid"
    ],
    "city": "Нижний Новгород",
    "skills": [
      {
        "slug": "kopirayting",
        "name": "Копирайтинг",
        "category": "marketing"
      },
      {
        "slug": "kontentmarketing",
        "name": "Контент маркетинг",
        "category": "marketing"
      },
      {
        "slug": "emailmarketing",
        "name": "Email маркетинг",
        "category": "marketing"
      }
    ],
    "avatar_url": "/showcase/sonya-pavlova.webp",
    "avatar_url_lg": "/showcase/sonya-pavlova.webp",
    "is_demo": false
  },
  {
    "slug": "maksim-li",
    "display_name": "Максим Ли",
    "headline": "Продуктовый дизайнер, рисую Tripsy",
    "primary_role": {
      "slug": "designer",
      "name": "Дизайнер"
    },
    "experience_level": "junior",
    "availability": "part_time",
    "looking_for": [
      "negotiable"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "figma",
        "name": "Figma",
        "category": "design"
      },
      {
        "slug": "dizaynsistemy",
        "name": "Дизайн системы",
        "category": "design"
      },
      {
        "slug": "prototipirovanie",
        "name": "Прототипирование",
        "category": "design"
      },
      {
        "slug": "uxissledovaniya",
        "name": "UX исследования",
        "category": "design"
      }
    ],
    "avatar_url": "/showcase/maksim-li.webp",
    "avatar_url_lg": "/showcase/maksim-li.webp",
    "is_demo": false
  },
  {
    "slug": "samir-rahimov",
    "display_name": "Самир Рахимов",
    "headline": "DevOps: Docker, CI/CD, мониторинг",
    "primary_role": {
      "slug": "devops",
      "name": "DevOps-инженер"
    },
    "experience_level": "junior",
    "availability": "few_hours",
    "looking_for": [
      "paid",
      "negotiable"
    ],
    "city": "Казань",
    "skills": [
      {
        "slug": "docker",
        "name": "Docker",
        "category": "dev"
      },
      {
        "slug": "linux",
        "name": "Linux",
        "category": "dev"
      },
      {
        "slug": "git",
        "name": "Git",
        "category": "dev"
      },
      {
        "slug": "postgresql",
        "name": "PostgreSQL",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/samir-rakhimov.webp",
    "avatar_url_lg": "/showcase/samir-rakhimov.webp",
    "is_demo": false
  },
  {
    "slug": "egor-volkov-4d05",
    "display_name": "Егор Волков",
    "headline": "Студент 2 курса ТПУ, Python. Ищу ребят на свой первый стартап",
    "primary_role": {
      "slug": "backend",
      "name": "Backend-разработчик"
    },
    "experience_level": "no_experience",
    "availability": "part_time",
    "looking_for": [
      "free",
      "cofound"
    ],
    "city": "Томск",
    "skills": [
      {
        "slug": "python",
        "name": "Python",
        "category": "dev"
      },
      {
        "slug": "fastapi",
        "name": "FastAPI",
        "category": "dev"
      },
      {
        "slug": "git",
        "name": "Git",
        "category": "dev"
      },
      {
        "slug": "sql",
        "name": "SQL",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/egor-volkov.webp",
    "avatar_url_lg": "/showcase/egor-volkov.webp",
    "is_demo": false
  },
  {
    "slug": "oleg-van",
    "display_name": "Олег Ван",
    "headline": "Fermo: фермерские продукты по подписке",
    "primary_role": {
      "slug": "product",
      "name": "Продакт-менеджер"
    },
    "experience_level": null,
    "availability": "full_time",
    "looking_for": [
      "paid"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "unitekonomika",
        "name": "Unit экономика",
        "category": "product"
      },
      {
        "slug": "roadmap",
        "name": "Roadmap",
        "category": "product"
      },
      {
        "slug": "sql",
        "name": "SQL",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/oleg-van.webp",
    "avatar_url_lg": "/showcase/oleg-van.webp",
    "is_demo": false
  },
  {
    "slug": "arseniy-belov",
    "display_name": "Арсений Белов",
    "headline": "Junior frontend, Vue и немного React",
    "primary_role": {
      "slug": "frontend",
      "name": "Frontend-разработчик"
    },
    "experience_level": "junior",
    "availability": "part_time",
    "looking_for": [
      "paid",
      "negotiable"
    ],
    "city": "Екатеринбург",
    "skills": [
      {
        "slug": "vue",
        "name": "Vue",
        "category": "dev"
      },
      {
        "slug": "javascript",
        "name": "JavaScript",
        "category": "dev"
      },
      {
        "slug": "typescript",
        "name": "TypeScript",
        "category": "dev"
      },
      {
        "slug": "git",
        "name": "Git",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/arseniy-belov.webp",
    "avatar_url_lg": "/showcase/arseniy-belov.webp",
    "is_demo": false
  },
  {
    "slug": "daniel-adu",
    "display_name": "Даниэль Аду",
    "headline": "Делаю Tripsy — планировщик поездок для компании друзей",
    "primary_role": {
      "slug": "frontend",
      "name": "Frontend-разработчик"
    },
    "experience_level": null,
    "availability": "part_time",
    "looking_for": [
      "negotiable"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "react",
        "name": "React",
        "category": "dev"
      },
      {
        "slug": "typescript",
        "name": "TypeScript",
        "category": "dev"
      },
      {
        "slug": "next-js",
        "name": "Next.js",
        "category": "dev"
      },
      {
        "slug": "node-js",
        "name": "Node.js",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/daniel-adu.webp",
    "avatar_url_lg": "/showcase/daniel-adu.webp",
    "is_demo": false
  },
  {
    "slug": "eva-lunina",
    "display_name": "Ева Лунина",
    "headline": "Продакт после стажировки, придумала Roomly",
    "primary_role": {
      "slug": "product",
      "name": "Продакт-менеджер"
    },
    "experience_level": "internship",
    "availability": "part_time",
    "looking_for": [
      "free",
      "cofound"
    ],
    "city": "Санкт-Петербург",
    "skills": [
      {
        "slug": "customerdevelopment",
        "name": "Customer Development",
        "category": "marketing"
      },
      {
        "slug": "intervyuspolzovatelyami",
        "name": "Интервью с пользователями",
        "category": "product"
      },
      {
        "slug": "roadmap",
        "name": "Roadmap",
        "category": "product"
      }
    ],
    "avatar_url": "/showcase/eva-lunina.webp",
    "avatar_url_lg": "/showcase/eva-lunina.webp",
    "is_demo": false
  },
  {
    "slug": "sabina-yusupova",
    "display_name": "Сабина Юсупова",
    "headline": "Маркетолог, запускаю «Резюме за вечер»",
    "primary_role": {
      "slug": "marketer",
      "name": "Маркетолог"
    },
    "experience_level": null,
    "availability": "part_time",
    "looking_for": [
      "free"
    ],
    "city": "Казань",
    "skills": [
      {
        "slug": "kontentmarketing",
        "name": "Контент маркетинг",
        "category": "marketing"
      },
      {
        "slug": "targetvk",
        "name": "Таргет VK",
        "category": "marketing"
      },
      {
        "slug": "kopirayting",
        "name": "Копирайтинг",
        "category": "marketing"
      },
      {
        "slug": "analitikatrafika",
        "name": "Аналитика трафика",
        "category": "marketing"
      }
    ],
    "avatar_url": "/showcase/sabina-yusupova.webp",
    "avatar_url_lg": "/showcase/sabina-yusupova.webp",
    "is_demo": false
  },
  {
    "slug": "mark-adebayo",
    "display_name": "Марк Адебайо",
    "headline": "CaseLab: учебные кейсы от реальных компаний",
    "primary_role": {
      "slug": "backend",
      "name": "Backend-разработчик"
    },
    "experience_level": null,
    "availability": "part_time",
    "looking_for": [
      "negotiable",
      "cofound"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "java",
        "name": "Java",
        "category": "dev"
      },
      {
        "slug": "postgresql",
        "name": "PostgreSQL",
        "category": "dev"
      },
      {
        "slug": "docker",
        "name": "Docker",
        "category": "dev"
      },
      {
        "slug": "rest",
        "name": "REST",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/mark-adebayo.webp",
    "avatar_url_lg": "/showcase/mark-adebayo.webp",
    "is_demo": false
  },
  {
    "slug": "kseniya-orlova",
    "display_name": "Ксения Орлова",
    "headline": "Кругооборот: многоразовые стаканы для кофеен",
    "primary_role": {
      "slug": "product",
      "name": "Продакт-менеджер"
    },
    "experience_level": null,
    "availability": "part_time",
    "looking_for": [
      "paid",
      "negotiable"
    ],
    "city": "Екатеринбург",
    "skills": [
      {
        "slug": "unitekonomika",
        "name": "Unit экономика",
        "category": "product"
      },
      {
        "slug": "customerdevelopment",
        "name": "Customer Development",
        "category": "marketing"
      },
      {
        "slug": "jira",
        "name": "Jira",
        "category": "product"
      }
    ],
    "avatar_url": "/showcase/ksenia-orlova.webp",
    "avatar_url_lg": "/showcase/ksenia-orlova.webp",
    "is_demo": false
  },
  {
    "slug": "kirill-morozov-62b4",
    "display_name": "Кирилл Морозов",
    "headline": "Frontend на React, ищу людей, с кем придумать и сделать свой продукт",
    "primary_role": {
      "slug": "frontend",
      "name": "Frontend-разработчик"
    },
    "experience_level": "courses",
    "availability": "part_time",
    "looking_for": [
      "free",
      "negotiable",
      "cofound"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "react",
        "name": "React",
        "category": "dev"
      },
      {
        "slug": "typescript",
        "name": "TypeScript",
        "category": "dev"
      },
      {
        "slug": "next-js",
        "name": "Next.js",
        "category": "dev"
      },
      {
        "slug": "figma",
        "name": "Figma",
        "category": "design"
      }
    ],
    "avatar_url": "/showcase/kirill-morozov.webp",
    "avatar_url_lg": "/showcase/kirill-morozov.webp",
    "is_demo": false
  },
  {
    "slug": "alina-tsoy",
    "display_name": "Алина Цой",
    "headline": "UX/UI дизайнер, 3 курс ВШЭ. Хочу в команду, где дизайн решает",
    "primary_role": {
      "slug": "designer",
      "name": "Дизайнер"
    },
    "experience_level": "no_experience",
    "availability": "part_time",
    "looking_for": [
      "free",
      "cofound"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "figma",
        "name": "Figma",
        "category": "design"
      },
      {
        "slug": "uxissledovaniya",
        "name": "UX исследования",
        "category": "design"
      },
      {
        "slug": "prototipirovanie",
        "name": "Прототипирование",
        "category": "design"
      },
      {
        "slug": "mobilnyeinterfeysy",
        "name": "Мобильные интерфейсы",
        "category": "design"
      }
    ],
    "avatar_url": "/showcase/alina-tsoy.webp",
    "avatar_url_lg": "/showcase/alina-tsoy.webp",
    "is_demo": false
  },
  {
    "slug": "ilya-savin",
    "display_name": "Илья Савин",
    "headline": "Flutter-разработчик, 4 курс ИТМО",
    "primary_role": {
      "slug": "mobile",
      "name": "Mobile-разработчик"
    },
    "experience_level": "junior",
    "availability": "few_hours",
    "looking_for": [
      "paid",
      "negotiable"
    ],
    "city": "Санкт-Петербург",
    "skills": [
      {
        "slug": "flutter",
        "name": "Flutter",
        "category": "dev"
      },
      {
        "slug": "kotlin",
        "name": "Kotlin",
        "category": "dev"
      },
      {
        "slug": "git",
        "name": "Git",
        "category": "dev"
      },
      {
        "slug": "rest",
        "name": "REST",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/ilya-savin.webp",
    "avatar_url_lg": "/showcase/ilya-savin.webp",
    "is_demo": false
  },
  {
    "slug": "vera-sokolova",
    "display_name": "Вера Соколова",
    "headline": "ML-инженер, магистратура МФТИ. Ищу сообщников на стартап с ИИ",
    "primary_role": {
      "slug": "ml",
      "name": "ML-инженер"
    },
    "experience_level": "internship",
    "availability": "part_time",
    "looking_for": [
      "negotiable",
      "cofound"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "python",
        "name": "Python",
        "category": "dev"
      },
      {
        "slug": "pytorch",
        "name": "PyTorch",
        "category": "data"
      },
      {
        "slug": "scikitlearn",
        "name": "scikit learn",
        "category": "data"
      },
      {
        "slug": "sql",
        "name": "SQL",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/vera-sokolova.webp",
    "avatar_url_lg": "/showcase/vera-sokolova.webp",
    "is_demo": false
  },
  {
    "slug": "liza-gromova",
    "display_name": "Лиза Громова",
    "headline": "QA-инженер после курса, тестирую Flowly",
    "primary_role": {
      "slug": "qa",
      "name": "QA-инженер"
    },
    "experience_level": "courses",
    "availability": "part_time",
    "looking_for": [
      "free",
      "paid"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "jira",
        "name": "Jira",
        "category": "product"
      },
      {
        "slug": "sql",
        "name": "SQL",
        "category": "data"
      },
      {
        "slug": "excel",
        "name": "Excel",
        "category": "data"
      }
    ],
    "avatar_url": "/showcase/liza-gromova.webp",
    "avatar_url_lg": "/showcase/liza-gromova.webp",
    "is_demo": false
  },
  {
    "slug": "mariya-lebedeva",
    "display_name": "Мария Лебедева",
    "headline": "Основательница Flowly. 6 лет в продукте, теперь делаю своё",
    "primary_role": {
      "slug": "product",
      "name": "Продакт-менеджер"
    },
    "experience_level": null,
    "availability": "full_time",
    "looking_for": [
      "paid",
      "negotiable"
    ],
    "city": "Москва",
    "skills": [
      {
        "slug": "roadmap",
        "name": "Roadmap",
        "category": "product"
      },
      {
        "slug": "unitekonomika",
        "name": "Unit экономика",
        "category": "product"
      },
      {
        "slug": "intervyuspolzovatelyami",
        "name": "Интервью с пользователями",
        "category": "product"
      },
      {
        "slug": "jira",
        "name": "Jira",
        "category": "product"
      }
    ],
    "avatar_url": "/showcase/maria-lebedeva.webp",
    "avatar_url_lg": "/showcase/maria-lebedeva.webp",
    "is_demo": false
  },
  {
    "slug": "artem-kim",
    "display_name": "Артём Ким",
    "headline": "Делаю StudyMate: тесты к экзамену из твоих конспектов",
    "primary_role": {
      "slug": "ml",
      "name": "ML-инженер"
    },
    "experience_level": null,
    "availability": "part_time",
    "looking_for": [
      "negotiable"
    ],
    "city": "Новосибирск",
    "skills": [
      {
        "slug": "python",
        "name": "Python",
        "category": "dev"
      },
      {
        "slug": "pytorch",
        "name": "PyTorch",
        "category": "data"
      },
      {
        "slug": "fastapi",
        "name": "FastAPI",
        "category": "dev"
      },
      {
        "slug": "postgresql",
        "name": "PostgreSQL",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/artem-kim.webp",
    "avatar_url_lg": "/showcase/artem-kim.webp",
    "is_demo": false
  },
  {
    "slug": "timur-galiev",
    "display_name": "Тимур Галиев",
    "headline": "Основатель Квартала, backend на Python",
    "primary_role": {
      "slug": "backend",
      "name": "Backend-разработчик"
    },
    "experience_level": null,
    "availability": "part_time",
    "looking_for": [
      "free",
      "negotiable"
    ],
    "city": "Казань",
    "skills": [
      {
        "slug": "python",
        "name": "Python",
        "category": "dev"
      },
      {
        "slug": "fastapi",
        "name": "FastAPI",
        "category": "dev"
      },
      {
        "slug": "postgresql",
        "name": "PostgreSQL",
        "category": "dev"
      },
      {
        "slug": "docker",
        "name": "Docker",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/timur-galiev.webp",
    "avatar_url_lg": "/showcase/timur-galiev.webp",
    "is_demo": false
  },
  {
    "slug": "anna-smirnova",
    "display_name": "Анна Смирнова",
    "headline": "Продуктовый дизайнер, придумала Petly и ищу, с кем её делать",
    "primary_role": {
      "slug": "designer",
      "name": "Дизайнер"
    },
    "experience_level": null,
    "availability": "part_time",
    "looking_for": [
      "free",
      "cofound"
    ],
    "city": "Санкт-Петербург",
    "skills": [
      {
        "slug": "figma",
        "name": "Figma",
        "category": "design"
      },
      {
        "slug": "prototipirovanie",
        "name": "Прототипирование",
        "category": "design"
      },
      {
        "slug": "uxissledovaniya",
        "name": "UX исследования",
        "category": "design"
      },
      {
        "slug": "brending",
        "name": "Брендинг",
        "category": "design"
      }
    ],
    "avatar_url": "/showcase/anna-smirnova.webp",
    "avatar_url_lg": "/showcase/anna-smirnova.webp",
    "is_demo": false
  },
  {
    "slug": "david-kazaryan",
    "display_name": "Давид Казарян",
    "headline": "Backend на Go, хочу придумать стартап с командой",
    "primary_role": {
      "slug": "backend",
      "name": "Backend-разработчик"
    },
    "experience_level": "junior",
    "availability": "few_hours",
    "looking_for": [
      "negotiable",
      "cofound"
    ],
    "city": "Ростов-на-Дону",
    "skills": [
      {
        "slug": "go",
        "name": "Go",
        "category": "dev"
      },
      {
        "slug": "postgresql",
        "name": "PostgreSQL",
        "category": "dev"
      },
      {
        "slug": "docker",
        "name": "Docker",
        "category": "dev"
      },
      {
        "slug": "linux",
        "name": "Linux",
        "category": "dev"
      }
    ],
    "avatar_url": "/showcase/david-kazaryan.webp",
    "avatar_url_lg": "/showcase/david-kazaryan.webp",
    "is_demo": false
  }
];
