/*
 * Фото интерфейса (Pexels, бесплатная лицензия). Импорт статический: Next знает размеры заранее
 * (вёрстка не прыгает), даёт размытое превью на время загрузки и хеширует адрес — браузер
 * кеширует файл на год. Пережатые WebP-размеры прогревает infra/deploy.sh после выкатки.
 */
import alina from "@/assets/photos/a-alina.jpg";
import ilya from "@/assets/photos/a-ilya.jpg";
import kirill from "@/assets/photos/a-kirill.jpg";
import timur from "@/assets/photos/a-timur.jpg";
import vera from "@/assets/photos/a-vera.jpg";
import duoWindow from "@/assets/photos/duo-window.jpg";
import handsLaptop from "@/assets/photos/hands-laptop.jpg";
import homeLaptop from "@/assets/photos/home-laptop.jpg";
import loftLaptop from "@/assets/photos/loft-laptop.jpg";
import officeBright from "@/assets/photos/office-bright.jpg";
import stickyMeeting from "@/assets/photos/sticky-meeting.jpg";
import tableTop from "@/assets/photos/table-top.jpg";
import teamEvening from "@/assets/photos/team-evening.jpg";
import teamTable from "@/assets/photos/team-table.jpg";
import videoCall from "@/assets/photos/video-call.jpg";
import whiteboardDuo from "@/assets/photos/whiteboard-duo.jpg";

export const PHOTOS = {
  duoWindow,
  handsLaptop,
  homeLaptop,
  loftLaptop,
  officeBright,
  stickyMeeting,
  tableTop,
  teamEvening,
  teamTable,
  videoCall,
  whiteboardDuo,
};

/** Маленькие портреты для иллюстраций переписки (не настоящие пользователи). */
export const FACES = { alina, ilya, kirill, timur, vera };
