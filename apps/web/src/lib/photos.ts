/*
 * Фото интерфейса (Pexels и Unsplash, бесплатные лицензии). Импорт статический: Next знает размеры заранее
 * (вёрстка не прыгает), даёт размытое превью на время загрузки и хеширует адрес — браузер
 * кеширует файл на год. Пережатые WebP-размеры прогревает infra/deploy.sh после выкатки.
 */
import alina from "@/assets/photos/a-alina.jpg";
import kirill from "@/assets/photos/a-kirill.jpg";
import heroTeam from "@/assets/photos/hero-team-brick.jpg";
import teamEvening from "@/assets/photos/team-evening.jpg";
import videoCall from "@/assets/photos/video-call.jpg";
import whiteboardDuo from "@/assets/photos/whiteboard-duo.jpg";

export const PHOTOS = {
  heroTeam,
  teamEvening,
  videoCall,
  whiteboardDuo,
};

/** Маленькие портреты для иллюстраций переписки (не настоящие пользователи). Фото с Unsplash. */
export const FACES = { alina, kirill };
