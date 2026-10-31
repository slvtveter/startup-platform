/**
 * Витрина главной: придуманные стартапы и люди, не связанные с базой (не меняются от новых регистраций).
 * Сгенерировано app/scripts/showcase_export.py из demo_data.py, фото — Pexels (бесплатная лицензия) в public/showcase.
 * Карточки ведут не на страницы (их нет), а в каталог по роли — выбор карточек и ссылки — в showcase.ts.
 */
import type { PersonCard, StartupCard } from "@/lib/api";

export const STARTUPS: StartupCard[] = [
  {
    "id": "f44ecb14-78b9-4c42-954d-a8eaa2652f70",
    "slug": "flowly",
    "title": "Flowly",
    "pitch": "Онлайн-запись и напоминания для салонов красоты",
    "stage": "mvp",
    "terms": "paid",
    "status": "recruiting",
    "published_at": "2026-10-30T15:42:01.258173Z",
    "owner_name": "Мария Лебедева",
    "owner_avatar_url": "/showcase/maria-lebedeva.webp",
    "open_roles": [
      {
        "id": "4965f967-ea5e-4382-bcf5-9530be47713d",
        "title": "Продуктовый дизайнер",
        "role": {
          "slug": "designer",
          "name": "Дизайнер"
        },
        "slots": 1,
        "hours_per_week": 10
      },
      {
        "id": "a5419a31-085b-40e9-afbf-79f7ab3d4133",
        "title": "Frontend-разработчик",
        "role": {
          "slug": "frontend",
          "name": "Frontend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 15
      }
    ],
    "team_size": 2,
    "is_demo": false,
    "cover_url": "/showcase/c-flowly.webp",
    "cover_url_lg": "/showcase/c-flowly.webp"
  },
  {
    "id": "442693f7-5c75-4d83-a75c-75fc2283fba2",
    "slug": "studymate",
    "title": "StudyMate",
    "pitch": "Тесты и карточки к экзамену из твоих конспектов",
    "stage": "prototype",
    "terms": "negotiable",
    "status": "recruiting",
    "published_at": "2026-10-28T10:42:01.258173Z",
    "owner_name": "Артём Никитин",
    "owner_avatar_url": "/showcase/artem-nikitin.webp",
    "open_roles": [
      {
        "id": "88fc9cc9-7fae-4052-b58a-2313359e86e9",
        "title": "Маркетолог",
        "role": {
          "slug": "marketer",
          "name": "Маркетолог"
        },
        "slots": 1,
        "hours_per_week": 8
      },
      {
        "id": "cdaeba18-f108-4859-b44e-04b5a6478997",
        "title": "ML-инженер",
        "role": {
          "slug": "ml",
          "name": "ML-инженер"
        },
        "slots": 1,
        "hours_per_week": 10
      }
    ],
    "team_size": 2,
    "is_demo": false,
    "cover_url": "/showcase/c-studymate.webp",
    "cover_url_lg": "/showcase/c-studymate.webp"
  },
  {
    "id": "63cd330a-7381-4b36-b2e7-600023798293",
    "slug": "kvartal",
    "title": "Квартал",
    "pitch": "Приложение для жильцов: заявки в УК, голосования, объявления",
    "stage": "prototype",
    "terms": "free",
    "status": "recruiting",
    "published_at": "2026-10-26T05:42:01.258173Z",
    "owner_name": "Денис Галкин",
    "owner_avatar_url": "/showcase/denis-galkin.webp",
    "open_roles": [
      {
        "id": "130d12fc-1610-41f0-8e96-9a18ee94cd4f",
        "title": "UX-исследователь",
        "role": {
          "slug": "designer",
          "name": "Дизайнер"
        },
        "slots": 1,
        "hours_per_week": 6
      },
      {
        "id": "0a400089-b0fa-40ad-acb6-a649235cd90f",
        "title": "Backend-разработчик",
        "role": {
          "slug": "backend",
          "name": "Backend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 10
      }
    ],
    "team_size": 2,
    "is_demo": false,
    "cover_url": "/showcase/c-kvartal.webp",
    "cover_url_lg": "/showcase/c-kvartal.webp"
  },
  {
    "id": "3f0e5541-5834-4cf5-8338-63e20ffeed79",
    "slug": "fermo",
    "title": "Fermo",
    "pitch": "Фермерские продукты по подписке из Подмосковья",
    "stage": "launched",
    "terms": "paid",
    "status": "recruiting",
    "published_at": "2026-10-21T19:42:01.258173Z",
    "owner_name": "Олег Васильев",
    "owner_avatar_url": "/showcase/oleg-vasilev.webp",
    "open_roles": [
      {
        "id": "a6f8b321-e696-4aea-bbbb-2e703a279f5d",
        "title": "Копирайтер",
        "role": {
          "slug": "copywriter",
          "name": "Копирайтер"
        },
        "slots": 1,
        "hours_per_week": 8
      },
      {
        "id": "3ab293d0-762e-4f03-8f70-272805b4d8a5",
        "title": "Аналитик данных",
        "role": {
          "slug": "analyst",
          "name": "Аналитик данных"
        },
        "slots": 1,
        "hours_per_week": 15
      }
    ],
    "team_size": 3,
    "is_demo": false,
    "cover_url": "/showcase/c-fermo.webp",
    "cover_url_lg": "/showcase/c-fermo.webp"
  },
  {
    "id": "4401e5f9-32ab-4fb3-96bb-fd6bcdfea63d",
    "slug": "tripsy",
    "title": "Tripsy",
    "pitch": "Планировщик поездок для компании друзей: маршрут и общий бюджет",
    "stage": "mvp",
    "terms": "negotiable",
    "status": "recruiting",
    "published_at": "2026-10-19T14:42:01.258173Z",
    "owner_name": "Даниил Андреев",
    "owner_avatar_url": "/showcase/daniil-andreev.webp",
    "open_roles": [
      {
        "id": "95538ae2-fdaf-4bff-a339-a0a100f891d6",
        "title": "Маркетолог",
        "role": {
          "slug": "marketer",
          "name": "Маркетолог"
        },
        "slots": 1,
        "hours_per_week": 8
      },
      {
        "id": "214fc8a9-f5aa-4933-87e1-90a17c8bf9b5",
        "title": "Frontend-разработчик",
        "role": {
          "slug": "frontend",
          "name": "Frontend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 12
      }
    ],
    "team_size": 2,
    "is_demo": false,
    "cover_url": "/showcase/c-tripsy.webp",
    "cover_url_lg": "/showcase/c-tripsy.webp"
  },
  {
    "id": "fde5239b-6adb-4115-b16c-eb6f18f493a5",
    "slug": "krugooborot",
    "title": "Кругооборот",
    "pitch": "Залоговые многоразовые стаканы для кофеен",
    "stage": "mvp",
    "terms": "paid",
    "status": "recruiting",
    "published_at": "2026-10-10T18:42:01.258173Z",
    "owner_name": "Ксения Орлова",
    "owner_avatar_url": "/showcase/ksenia-orlova.webp",
    "open_roles": [
      {
        "id": "1fad44ce-969f-4e9c-a587-60fa8bbc76c8",
        "title": "Аналитик данных",
        "role": {
          "slug": "analyst",
          "name": "Аналитик данных"
        },
        "slots": 1,
        "hours_per_week": 8
      },
      {
        "id": "0bba4c18-52d3-4971-9422-45623de9851e",
        "title": "Mobile-разработчик",
        "role": {
          "slug": "mobile",
          "name": "Mobile-разработчик"
        },
        "slots": 1,
        "hours_per_week": 15
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
    "id": "94ae02ac-8419-41f2-bfe4-30888ad34931",
    "slug": "petly",
    "title": "Petly",
    "pitch": "Соседи и студенты выгуливают собак друг друга",
    "stage": "idea",
    "terms": "free",
    "status": "recruiting",
    "published_at": "2026-10-24T00:42:01.258173Z",
    "owner_name": "Анна Смирнова",
    "owner_avatar_url": "/showcase/anna-smirnova.webp",
    "open_roles": [
      {
        "id": "d465cb18-79c2-4ede-9d67-ecd644b81aaf",
        "title": "Маркетолог",
        "role": {
          "slug": "marketer",
          "name": "Маркетолог"
        },
        "slots": 1,
        "hours_per_week": 6
      },
      {
        "id": "64c8ec1e-d00d-4106-8f64-aec7e47b4420",
        "title": "Mobile-разработчик",
        "role": {
          "slug": "mobile",
          "name": "Mobile-разработчик"
        },
        "slots": 1,
        "hours_per_week": 10
      }
    ],
    "team_size": 1,
    "is_demo": false,
    "cover_url": "/showcase/c-petly.webp",
    "cover_url_lg": "/showcase/c-petly.webp"
  },
  {
    "id": "d05952d4-478f-4566-9024-275f2ab266a0",
    "slug": "roomly",
    "title": "Roomly",
    "pitch": "Подбор соседа по квартире среди студентов своего вуза",
    "stage": "idea",
    "terms": "free",
    "status": "recruiting",
    "published_at": "2026-10-17T09:42:01.258173Z",
    "owner_name": "Ева Лунина",
    "owner_avatar_url": "/showcase/eva-lunina.webp",
    "open_roles": [
      {
        "id": "93b15835-6da5-4085-bd2f-1ee5af89db45",
        "title": "Backend-разработчик",
        "role": {
          "slug": "backend",
          "name": "Backend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 10
      },
      {
        "id": "290f13ed-bbc3-4b1c-a85f-bacf65e1352a",
        "title": "Frontend-разработчик",
        "role": {
          "slug": "frontend",
          "name": "Frontend-разработчик"
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
    "id": "2899bbef-9f06-4e0e-8d4d-9960ebada409",
    "slug": "caselab",
    "title": "CaseLab",
    "pitch": "Учебные кейсы от реальных компаний для студентов",
    "stage": "idea",
    "terms": "negotiable",
    "status": "recruiting",
    "published_at": "2026-10-15T04:42:01.258173Z",
    "owner_name": "Марк Белоусов",
    "owner_avatar_url": "/showcase/mark-belousov.webp",
    "open_roles": [
      {
        "id": "35679b52-317b-46fe-8500-bb0229589b8e",
        "title": "Менеджер по партнёрствам",
        "role": {
          "slug": "marketer",
          "name": "Маркетолог"
        },
        "slots": 1,
        "hours_per_week": 6
      },
      {
        "id": "18ce1691-1f56-48f8-9c41-ae17ac9408dc",
        "title": "Дизайнер",
        "role": {
          "slug": "designer",
          "name": "Дизайнер"
        },
        "slots": 1,
        "hours_per_week": 8
      },
      {
        "id": "f51e6dca-8902-4a89-9f22-231cc2cb56c6",
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
    "cover_url": "/showcase/c-caselab.webp",
    "cover_url_lg": "/showcase/c-caselab.webp"
  },
  {
    "id": "9aa8cf7a-b90c-43ea-9576-eafecf02166a",
    "slug": "rezyume-za-vecher",
    "title": "Резюме за вечер",
    "pitch": "Мидлы разбирают резюме джунов за 300 ₽",
    "stage": "idea",
    "terms": "free",
    "status": "recruiting",
    "published_at": "2026-10-12T23:42:01.258173Z",
    "owner_name": "Светлана Юдина",
    "owner_avatar_url": "/showcase/svetlana-yudina.webp",
    "open_roles": [
      {
        "id": "95d60223-c62f-4ea5-8be1-2ba5c560de8e",
        "title": "Backend-разработчик",
        "role": {
          "slug": "backend",
          "name": "Backend-разработчик"
        },
        "slots": 1,
        "hours_per_week": 8
      },
      {
        "id": "0bf79f42-baf0-4c3b-abba-fd53b671636c",
        "title": "Frontend-разработчик",
        "role": {
          "slug": "frontend",
          "name": "Frontend-разработчик"
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
    "slug": "roman-haritonov",
    "display_name": "Роман Харитонов",
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
    "avatar_url": "/showcase/roman-kharitonov.webp",
    "avatar_url_lg": "/showcase/roman-kharitonov.webp",
    "is_demo": false
  },
  {
    "slug": "irina-guseva",
    "display_name": "Ирина Гусева",
    "headline": "Продакт после стажировки в финтехе. Ищу сообщников",
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
    "avatar_url": "/showcase/irina-guseva.webp",
    "avatar_url_lg": "/showcase/irina-guseva.webp",
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
      },
      {
        "slug": "smm",
        "name": "SMM",
        "category": "marketing"
      }
    ],
    "avatar_url": "/showcase/polina-mironova.webp",
    "avatar_url_lg": "/showcase/polina-mironova.webp",
    "is_demo": false
  },
  {
    "slug": "yulya-panova",
    "display_name": "Юля Панова",
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
    "avatar_url": "/showcase/yulia-panova.webp",
    "avatar_url_lg": "/showcase/yulia-panova.webp",
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
    "slug": "denis-galkin",
    "display_name": "Денис Галкин",
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
    "avatar_url": "/showcase/denis-galkin.webp",
    "avatar_url_lg": "/showcase/denis-galkin.webp",
    "is_demo": false
  },
  {
    "slug": "artem-nikitin",
    "display_name": "Артём Никитин",
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
    "avatar_url": "/showcase/artem-nikitin.webp",
    "avatar_url_lg": "/showcase/artem-nikitin.webp",
    "is_demo": false
  },
  {
    "slug": "daniil-andreev",
    "display_name": "Даниил Андреев",
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
    "avatar_url": "/showcase/daniil-andreev.webp",
    "avatar_url_lg": "/showcase/daniil-andreev.webp",
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
    "slug": "oleg-vasilev",
    "display_name": "Олег Васильев",
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
    "avatar_url": "/showcase/oleg-vasilev.webp",
    "avatar_url_lg": "/showcase/oleg-vasilev.webp",
    "is_demo": false
  },
  {
    "slug": "egor-volkov-6e9d",
    "display_name": "Егор Волков",
    "headline": "Backend на Python, 2 курс ТПУ. Сделал бота для расписания своего потока",
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
    "slug": "marina-abramova",
    "display_name": "Марина Абрамова",
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
    "avatar_url": "/showcase/marina-abramova.webp",
    "avatar_url_lg": "/showcase/marina-abramova.webp",
    "is_demo": false
  },
  {
    "slug": "sonya-pavlova-131a",
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
    "slug": "maksim-lisitsyn",
    "display_name": "Максим Лисицын",
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
    "avatar_url": "/showcase/maksim-lisitsyn.webp",
    "avatar_url_lg": "/showcase/maksim-lisitsyn.webp",
    "is_demo": false
  },
  {
    "slug": "semen-rahmanov",
    "display_name": "Семён Рахманов",
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
    "avatar_url": "/showcase/semyon-rakhmanov.webp",
    "avatar_url_lg": "/showcase/semyon-rakhmanov.webp",
    "is_demo": false
  },
  {
    "slug": "svetlana-yudina",
    "display_name": "Светлана Юдина",
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
    "avatar_url": "/showcase/svetlana-yudina.webp",
    "avatar_url_lg": "/showcase/svetlana-yudina.webp",
    "is_demo": false
  },
  {
    "slug": "mark-belousov",
    "display_name": "Марк Белоусов",
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
    "avatar_url": "/showcase/mark-belousov.webp",
    "avatar_url_lg": "/showcase/mark-belousov.webp",
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
    "slug": "kirill-morozov-80b9",
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
    "slug": "alina-tsvetkova",
    "display_name": "Алина Цветкова",
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
    "avatar_url": "/showcase/alina-tsvetkova.webp",
    "avatar_url_lg": "/showcase/alina-tsvetkova.webp",
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
    "slug": "alena-kuznetsova",
    "display_name": "Алёна Кузнецова",
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
    "avatar_url": "/showcase/alena-kuznetsova.webp",
    "avatar_url_lg": "/showcase/alena-kuznetsova.webp",
    "is_demo": false
  },
  {
    "slug": "zhenya-komarova",
    "display_name": "Женя Комарова",
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
    "avatar_url": "/showcase/zhenya-komarova.webp",
    "avatar_url_lg": "/showcase/zhenya-komarova.webp",
    "is_demo": false
  },
  {
    "slug": "nastya-ershova",
    "display_name": "Настя Ершова",
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
    "avatar_url": "/showcase/nastya-ershova.webp",
    "avatar_url_lg": "/showcase/nastya-ershova.webp",
    "is_demo": false
  }
];
