"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

/**
 * Блок, который проявляется, когда попадает в экран. Дочерние .reveal-item анимируются
 * по очереди (задержка — CSS-переменная --d). До гидрации и без JS всё видно сразу.
 */
export function Reveal(props: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "armed" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    // Уже на экране при загрузке — показываем сразу с анимацией, иначе ждём прокрутки.
    setState("armed");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref} data-reveal={state} {...props} />;
}
